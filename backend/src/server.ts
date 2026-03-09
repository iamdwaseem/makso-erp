import express from "express";
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
import { authenticate } from "./middleware/auth.middleware.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware — cors MUST come before helmet
app.use(cors({ origin: "*" }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json());

// Public auth routes (no JWT required)
app.use("/api", authRoutes);

// Protected routes — all routes below require a valid JWT
app.use("/api", authenticate, supplierRoutes);
app.use("/api", authenticate, customerRoutes);
app.use("/api", authenticate, productRoutes);
app.use("/api", authenticate, variantRoutes);
app.use("/api", authenticate, inventoryRoutes);
app.use("/api", authenticate, purchaseRoutes);
app.use("/api", authenticate, saleRoutes);
app.use("/api", authenticate, scanRoutes);
app.use("/api", authenticate, dashboardRoutes);

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
    environment: process.env.NODE_ENV ?? "development",
  });
});

// Use http.createServer to keep process alive (Express 5 app.listen returns a Promise)
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`[server]: Warehouse ERP backend is running at http://localhost:${PORT}`);
});
