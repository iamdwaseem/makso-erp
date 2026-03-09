import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";

const router = Router();
const inventoryController = new InventoryController();

router.get("/inventory", inventoryController.getAllInventory);
router.get("/inventory/:variantId", inventoryController.getInventoryByVariantId);
router.get("/inventory/:variantId/ledger", inventoryController.getLedgerByVariantId);
router.post("/inventory/adjust", inventoryController.adjustInventory);

export default router;
