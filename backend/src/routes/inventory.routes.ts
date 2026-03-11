import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";
import { authorizeWarehouseAccess } from "../middleware/warehouseAccess.middleware.js";

const router = Router();
const inventoryController = new InventoryController();

router.get("/inventory", authorizeWarehouseAccess, inventoryController.getAllInventory);
router.get("/inventory/:variantId", authorizeWarehouseAccess, inventoryController.getInventoryByVariantId);
router.get("/inventory/:variantId/ledger", authorizeWarehouseAccess, inventoryController.getLedgerByVariantId);
router.post("/inventory/adjust", authorizeWarehouseAccess, inventoryController.adjustInventory);

export default router;
