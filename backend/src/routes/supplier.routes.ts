import { Router } from "express";
import { SupplierController } from "../controllers/supplier.controller.js";

const router = Router();
const supplierController = new SupplierController();

router.get("/suppliers", supplierController.getAllSuppliers);
router.get("/suppliers/:id", supplierController.getSupplierById);
router.post("/suppliers", supplierController.createSupplier);
router.put("/suppliers/:id", supplierController.updateSupplier);
router.delete("/suppliers/:id", supplierController.deleteSupplier);

export default router;
