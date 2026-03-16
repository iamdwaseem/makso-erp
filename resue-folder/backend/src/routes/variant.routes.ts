import { Router } from "express";
import { VariantController } from "../controllers/variant.controller.js";

const router = Router();
const controller = new VariantController();

router.get("/", controller.getAllVariants);
router.get("/sku/:sku", controller.getVariantBySku);
router.get("/:id", controller.getVariantById);
router.post("/", controller.createVariant);
router.patch("/:id", controller.updateVariant);
router.delete("/:id", controller.deleteVariant);

export default router;
