import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller.js";
import { InventoryImportController } from "../controllers/inventory-import.controller.js";
import { GrnController } from "../controllers/grn.controller.js";
import { GdnController } from "../controllers/gdn.controller.js";
import { TransferController } from "../controllers/transfer.controller.js";
import { AdjustmentController } from "../controllers/adjustment.controller.js";

const router = Router();
const inventoryController = new InventoryController();
const inventoryImportController = new InventoryImportController();
const grnController = new GrnController();
const gdnController = new GdnController();
const transferController = new TransferController();
const adjustmentController = new AdjustmentController();

// Inventory list and adjust (static paths first)
router.get("/", inventoryController.getAllInventory);
router.post("/adjust", inventoryController.adjustInventory);

// Bulk import products from scraped data (e.g. MAKSO CSV)
router.post("/import/products", inventoryImportController.importProducts);

// GRN
router.get("/grn", grnController.getAll);
router.post("/grn", grnController.create);
router.get("/grn/:id", grnController.getById);
router.patch("/grn/:id", grnController.update);
router.post("/grn/:id/submit", grnController.submit);
router.post("/grn/:id/cancel", grnController.cancel);

// GDN
router.get("/gdn", gdnController.getAll);
router.post("/gdn", gdnController.create);
router.get("/gdn/:id", gdnController.getById);
router.patch("/gdn/:id", gdnController.update);
router.post("/gdn/:id/submit", gdnController.submit);
router.post("/gdn/:id/cancel", gdnController.cancel);

// Transfers
router.get("/transfers", transferController.getAll);
router.post("/transfers", transferController.create);
router.get("/transfers/:id", transferController.getById);
router.patch("/transfers/:id", transferController.update);
router.post("/transfers/:id/submit", transferController.submit);

// Adjustments
router.get("/adjustments", adjustmentController.getAll);
router.post("/adjustments", adjustmentController.create);
router.get("/adjustments/:id", adjustmentController.getById);

// Variant-scoped (must be last so :variantId does not match "grn", "gdn", etc.)
router.get("/:variantId", inventoryController.getInventoryByVariantId);
router.get("/:variantId/ledger", inventoryController.getLedgerByVariantId);

export default router;
