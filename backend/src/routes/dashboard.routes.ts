import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller.js";
import { authorizeWarehouseAccess } from "../middleware/warehouseAccess.middleware.js";

const router = Router();
const controller = new DashboardController();

router.get("/dashboard/stats", authorizeWarehouseAccess, (req, res) => controller.getStats(req, res));
router.get("/dashboard/inventory/trend", authorizeWarehouseAccess, (req, res) => controller.getInventoryTrend(req, res));
router.get("/dashboard/inventory/gain-loss", authorizeWarehouseAccess, (req, res) => controller.getInventoryGainLoss(req, res));

export default router;
