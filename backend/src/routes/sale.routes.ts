import { Router } from "express";
import { SaleController } from "../controllers/sale.controller.js";
import { authorizeRole } from "../middleware/role.middleware.js";

const router = Router();
const saleController = new SaleController();

router.get("/sales", saleController.getAllSales);
router.get("/sales/:id", saleController.getSaleById);
router.post("/sales", saleController.createSale);
router.delete("/sales/:id", authorizeRole("MANAGER", "ADMIN"), saleController.deleteSale);

export default router;
