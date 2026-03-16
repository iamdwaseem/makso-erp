import { Router } from "express";
import { ReportController } from "../controllers/report.controller.js";

const router = Router();
const controller = new ReportController();

router.get("/stock", controller.getStock);
router.get("/low-stock", controller.getLowStock);
router.get("/transactions", controller.getTransactions);
router.get("/sales-summary", controller.getSalesSummary);
router.get("/inventory-valuation", controller.getInventoryValuation);
router.get("/customer-aging", controller.getCustomerAging);
router.get("/supplier-aging", controller.getSupplierAging);
router.get("/inventory-movement-history", controller.getInventoryMovementHistory);

export default router;
