import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes.js";
import supplierRoutes from "./supplier.routes.js";
import customerRoutes from "./customer.routes.js";
import productRoutes from "./product.routes.js";
import variantRoutes from "./variant.routes.js";
import warehouseRoutes from "./warehouse.routes.js";
import userRoutes from "./user.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import salesRoutes from "./sales.routes.js";
import purchaseRoutes from "./purchase.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import reportsRoutes from "./reports.routes.js";
import reportingRoutes from "./reporting.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/variants", variantRoutes);
router.use("/warehouses", warehouseRoutes);
router.use("/users", userRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/sales", salesRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportsRoutes);
router.use("/reporting", reportingRoutes);

router.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found", message: "No route matched" });
});

export default router;
