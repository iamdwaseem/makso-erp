import { Router } from "express";
import { SupplierController } from "../controllers/supplier.controller.js";

const router = Router();
const controller = new SupplierController();

router.get("/", controller.getAllSuppliers);
router.get("/:id", controller.getSupplierById);
router.post("/", controller.createSupplier);
router.patch("/:id", controller.updateSupplier);
router.delete("/:id", controller.deleteSupplier);

export default router;
