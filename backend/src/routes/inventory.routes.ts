import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";
import { TransferController } from "../controllers/transfer.controller.js";
import { authorizeWarehouseAccess } from "../middleware/warehouseAccess.middleware.js";

const router = Router();
const inventoryController = new InventoryController();
const transferController = new TransferController();

router.get("/inventory", authorizeWarehouseAccess, inventoryController.getAllInventory);

// Inventory transfers — must be registered before /inventory/:variantId (otherwise "transfers" is parsed as a variant id)
router.get("/inventory/transfers", authorizeWarehouseAccess, transferController.getAll);
router.post("/inventory/transfers", authorizeWarehouseAccess, transferController.create);
router.get("/inventory/transfers/:id", authorizeWarehouseAccess, transferController.getById);
router.patch("/inventory/transfers/:id", authorizeWarehouseAccess, transferController.update);
router.post("/inventory/transfers/:id/submit", authorizeWarehouseAccess, transferController.submit);

router.get("/inventory/:variantId", authorizeWarehouseAccess, inventoryController.getInventoryByVariantId);
router.get("/inventory/:variantId/ledger", authorizeWarehouseAccess, inventoryController.getLedgerByVariantId);

export default router;
