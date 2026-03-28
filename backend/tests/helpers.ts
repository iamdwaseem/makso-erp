/**
 * Shared test helpers.
 * Creates the Express app (without .listen) so supertest can wrap it.
 * Also exports a prisma client for DB cleanup between tests.
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { PrismaClient } from "@prisma/client";
import supplierRoutes   from "../src/routes/supplier.routes.js";
import customerRoutes   from "../src/routes/customer.routes.js";
import productRoutes    from "../src/routes/product.routes.js";
import variantRoutes    from "../src/routes/variant.routes.js";
import inventoryRoutes  from "../src/routes/inventory.routes.js";
import purchaseRoutes   from "../src/routes/purchase.routes.js";
import saleRoutes       from "../src/routes/sale.routes.js";
import dashboardRoutes  from "../src/routes/dashboard.routes.js";
import authRoutes       from "../src/routes/auth.routes.js";
import warehouseRoutes  from "../src/routes/warehouse.routes.js";
import userRoutes       from "../src/routes/user.routes.js";
import historyRoutes    from "../src/routes/history.routes.js";
import updateRequestRoutes from "../src/routes/updateRequest.routes.js";
import skuHistoryRoutes from "../src/routes/skuHistory.routes.js";
import { authenticate } from "../src/middleware/auth.middleware.js";
import { resolveTenant } from "../src/middleware/tenant.middleware.js";
import { authorizeWarehouseAccess } from "../src/middleware/warehouseAccess.middleware.js";

export const prisma = new PrismaClient();

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(express.json());

  app.use("/api", authRoutes);
  app.use("/api", resolveTenant);
  app.use("/api", authenticate);
  app.use("/api", authorizeWarehouseAccess);
  app.use("/api", supplierRoutes);
  app.use("/api", customerRoutes);
  app.use("/api", productRoutes);
  app.use("/api", variantRoutes);
  app.use("/api", inventoryRoutes);
  app.use("/api", purchaseRoutes);
  app.use("/api", saleRoutes);
  app.use("/api", dashboardRoutes);
  app.use("/api", warehouseRoutes);
  app.use("/api", userRoutes);
  app.use("/api", historyRoutes);
  app.use("/api", updateRequestRoutes);
  app.use("/api", skuHistoryRoutes);

  return app;
}

/** Wipe test data in dependency order */
export async function cleanDb() {
  const tables = [
    "dashboard_metrics", "scan_logs", "inventory_ledger", "inventory_summaries",
    "inventory", "purchase_items", "sale_items", "purchases", "sales",
    "transfer_items", "transfers",
    "variants", "products", "customers", "suppliers", "update_requests", "sku_history", "user_warehouses",
    "warehouses", "users", "organizations",
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
  }
}
