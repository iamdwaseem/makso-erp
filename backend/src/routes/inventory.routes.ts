import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";
import { TransferController } from "../controllers/transfer.controller.js";
import { authorizeWarehouseAccess } from "../middleware/warehouseAccess.middleware.js";

const router = Router();
const inventoryController = new InventoryController();
const transferController = new TransferController();

router.get("/inventory", authorizeWarehouseAccess, inventoryController.getAllInventory);
router.get("/inventory/:variantId", authorizeWarehouseAccess, inventoryController.getInventoryByVariantId);
router.get("/inventory/:variantId/ledger", authorizeWarehouseAccess, inventoryController.getLedgerByVariantId);
router.post("/inventory/adjust", authorizeWarehouseAccess, inventoryController.adjustInventory);

// Inventory transfers
router.get("/transfers", authorizeWarehouseAccess, transferController.getAll);
router.post("/transfers", authorizeWarehouseAccess, transferController.create);
router.get("/transfers/:id", authorizeWarehouseAccess, transferController.getById);
router.patch("/transfers/:id", authorizeWarehouseAccess, transferController.update);
router.post("/transfers/:id/submit", authorizeWarehouseAccess, transferController.submit);

export default router;
