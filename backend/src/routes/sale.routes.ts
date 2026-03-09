import { Router } from "express";
import { SaleController } from "../controllers/sale.controller.js";

const router = Router();
const saleController = new SaleController();

router.get("/sales", saleController.getAllSales);
router.get("/sales/:id", saleController.getSaleById);
router.post("/sales", saleController.createSale);

export default router;
