import { Router } from "express";
import { authorizeRole } from "../middleware/role.middleware.js";
import { ProductController } from "../controllers/product.controller.js";

const router = Router();
const productController = new ProductController();

router.get("/products", productController.getAllProducts);
router.get("/products/:id", productController.getProductById);
router.post("/products", productController.createProduct);
router.put("/products/:id", productController.updateProduct);
router.delete("/products/:id", authorizeRole("ADMIN", "MANAGER"), productController.deleteProduct);

export default router;
