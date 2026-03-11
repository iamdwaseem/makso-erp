import { Router } from "express";
import { VariantController } from "../controllers/variant.controller.js";

const router = Router();
const variantController = new VariantController();

router.get("/variants", variantController.getAllVariants);
router.get("/variants/sku/:sku", variantController.getVariantBySku);
router.get("/variants/:id", variantController.getVariantById);
router.post("/variants", variantController.createVariant);
router.put("/variants/:id", variantController.updateVariant);
router.delete("/variants/:id", variantController.deleteVariant);

// Get variants by product ID
router.get("/products/:id/variants", variantController.getVariantsByProductId);

export default router;
