import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller.js";

const router = Router();
const controller = new DashboardController();

router.get("/stats", controller.getStats);
router.get("/sales-purchase-trend", controller.getSalesPurchaseTrend);
router.get("/stock-in-out-trend", controller.getStockInOutTrend);
router.get("/inventory/trend", controller.getInventoryTrend);
router.get("/employee-sales", controller.getEmployeeSales);
router.get("/inventory/item-groups", controller.getItemGroups);
router.get("/inventory/gain-loss", controller.getGainLoss);

export default router;
