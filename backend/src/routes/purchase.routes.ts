import { Router } from "express";
import { PurchaseController } from "../controllers/purchase.controller.js";

const router = Router();
const purchaseController = new PurchaseController();

router.get("/purchases", purchaseController.getAllPurchases);
router.get("/purchases/:id", purchaseController.getPurchaseById);
router.post("/purchases", purchaseController.createPurchase);

export default router;
