import { Router } from "express";
import { ProductController } from "../controllers/product.controller.js";

const router = Router();
const controller = new ProductController();

router.get("/", controller.getAllProducts);
router.get("/:id/variants", controller.getVariantsByProductId);
router.get("/:id", controller.getProductById);
router.post("/", controller.createProduct);
router.patch("/:id", controller.updateProduct);
router.delete("/:id", controller.deleteProduct);

export default router;
