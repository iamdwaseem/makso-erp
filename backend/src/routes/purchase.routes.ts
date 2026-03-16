import { Router } from "express";
import { PurchaseController } from "../controllers/purchase.controller.js";
import { authorizeRole } from "../middleware/role.middleware.js";

const router = Router();
const purchaseController = new PurchaseController();

router.get("/purchases", purchaseController.getAllPurchases);
router.get("/purchases/:id", purchaseController.getPurchaseById);
router.post("/purchases", purchaseController.createPurchase);
router.post("/purchases/import-from-csv", purchaseController.importFromCsv);
router.patch("/purchases/:id", purchaseController.updatePurchase);
router.delete("/purchases/:id", authorizeRole("MANAGER", "ADMIN"), purchaseController.deletePurchase);

export default router;
