import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../../.env") });
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import supplierRoutes from "./routes/supplier.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import variantRoutes from "./routes/variant.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import scanRoutes from "./routes/scan.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import authRoutes from "./routes/auth.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import userRoutes from "./routes/user.routes.js";
import historyRoutes from "./routes/history.routes.js";
import updateRequestRoutes from "./routes/updateRequest.routes.js";
import skuHistoryRoutes from "./routes/skuHistory.routes.js";
import { authenticate } from "./middleware/auth.middleware.js";
import { resolveTenant } from "./middleware/tenant.middleware.js";
import { authorizeWarehouseAccess } from "./middleware/warehouseAccess.middleware.js";
import { getEnv } from "./config/env.js";

const app = express();
const env = getEnv();
const PORT = env.PORT;

if (env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

// Middleware — cors MUST come before helmet
const corsOrigin = env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(cors({ origin: corsOrigin }));
app.use(helmet({ crossOriginResourcePolicy: false }));
if (env.HTTP_LOGS === "true") {
  app.use(morgan("dev"));
}
app.use(express.json());

// Public auth routes (no JWT required) - Must come before tenant resolution
app.use("/api", authRoutes);

// Multi-tenant resolution — MUST happen before protected routes
app.use("/api", resolveTenant);

// Protected routes — all routes below require a valid JWT
app.use("/api", authenticate);
app.use("/api", authorizeWarehouseAccess);

app.use("/api", supplierRoutes);
app.use("/api", customerRoutes);
app.use("/api", productRoutes);
app.use("/api", variantRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", purchaseRoutes);
app.use("/api", saleRoutes);
app.use("/api", scanRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", warehouseRoutes);
app.use("/api", userRoutes);
app.use("/api", historyRoutes);
app.use("/api", updateRequestRoutes);
app.use("/api", skuHistoryRoutes);

// Health Check — lightweight, no heavy DB queries
app.get("/health", async (req, res) => {
  const start = Date.now();
  let dbStatus = "ok";
  let dbLatencyMs = 0;
  try {
    const { PrismaClient } = await import("@prisma/client");
    const p = new PrismaClient();
    await p.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    await p.$disconnect();
  } catch {
    dbStatus = "error";
  }

  const mem = process.memoryUsage();
  res.status(200).json({
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    db: { status: dbStatus, latencyMs: dbLatencyMs },
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    },
    version: process.env.npm_package_version ?? "1.0.0",
    environment: env.NODE_ENV,
  });
});

import { startMetricsWorker } from "./jobs/metrics.worker.js";

// Use http.createServer to keep process alive (Express 5 app.listen returns a Promise)
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`[server]: Warehouse ERP backend is running at http://localhost:${PORT}`);
  
  // Start background analytics worker
  startMetricsWorker(60000); // Refresh every 60s
});
