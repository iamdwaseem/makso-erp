import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express, { Request, Response, NextFunction, RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });

import { getEnv } from "./config/env.js";
import { resolveTenant } from "./middleware/tenant.middleware.js";
import { authenticate } from "./middleware/auth.middleware.js";
import { devAuth } from "./middleware/devAuth.middleware.js";
import { authorizeWarehouseAccess } from "./middleware/warehouseAccess.middleware.js";
import { dashboardAuth } from "./middleware/dashboardAuth.middleware.js";
import apiRoutes from "./routes/api.routes.js";

const app = express();
const env = getEnv();
const PORT = env.PORT;

if (env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

const corsOrigin =
  env.CORS_ORIGIN === "*"
    ? "*"
    : env.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(cors({ origin: corsOrigin }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());

// Health check — no tenant/auth, no DB required for status
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
  });
});

// Public auth paths: no Bearer token required
const isAuthPublicPath = (req: Request) => {
  const path = (req.originalUrl || req.url || "").split("?")[0];
  return path.endsWith("/auth/login") || path.endsWith("/auth/register");
};

// API: tenant → auth (skip for login/register) → warehouse or dashboard access → routes
app.use("/api", resolveTenant);
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  if (isAuthPublicPath(req)) return next();
  const hasBearer =
    typeof req.headers.authorization === "string" &&
    req.headers.authorization.startsWith("Bearer ");
  const authMiddleware: RequestHandler =
    env.NODE_ENV === "development" && !hasBearer ? devAuth : authenticate;
  return authMiddleware(req, res, next);
});
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  if (isAuthPublicPath(req)) return next();
  const path = (req.originalUrl || req.url || "").split("?")[0];
  if (path.includes("/auth")) return next(); // auth/me etc. don't need warehouse
  if (path.includes("/dashboard")) {
    return dashboardAuth(req, res, next);
  }
  return authorizeWarehouseAccess(req, res, next);
});
app.use("/api", apiRoutes);

// Central error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(
    `[server]: ERP backend running at http://localhost:${PORT}; GET /health for health check.`
  );
});
