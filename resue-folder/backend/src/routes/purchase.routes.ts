import { Router } from "express";
import { PurchaseController } from "../controllers/purchase.controller.js";

const router = Router();
const purchaseController = new PurchaseController();

router.get("/", purchaseController.getAll);
router.post("/", purchaseController.create);
router.get("/:id", purchaseController.getById);
router.patch("/:id", purchaseController.update);
router.post("/:id/submit", purchaseController.submit);
router.post("/:id/cancel", purchaseController.cancel);

export default router;
