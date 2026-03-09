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
import { authenticate } from "../src/middleware/auth.middleware.js";

export const prisma = new PrismaClient();

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(express.json());

  app.use("/api", authRoutes);
  app.use("/api", authenticate, supplierRoutes);
  app.use("/api", authenticate, customerRoutes);
  app.use("/api", authenticate, productRoutes);
  app.use("/api", authenticate, variantRoutes);
  app.use("/api", authenticate, inventoryRoutes);
  app.use("/api", authenticate, purchaseRoutes);
  app.use("/api", authenticate, saleRoutes);
  app.use("/api", authenticate, dashboardRoutes);

  return app;
}

/** Wipe test data in dependency order */
export async function cleanDb() {
  await prisma.scanLog.deleteMany();
  await prisma.inventoryLedger.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
}
