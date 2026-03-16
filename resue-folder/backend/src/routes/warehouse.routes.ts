import { Router } from "express";
import { WarehouseController } from "../controllers/warehouse.controller.js";

const router = Router();
const controller = new WarehouseController();

router.get("/", controller.getAllWarehouses);
router.get("/:id", controller.getWarehouseById);
router.post("/", controller.createWarehouse);
router.patch("/:id", controller.updateWarehouse);
router.delete("/:id", controller.deleteWarehouse);

export default router;
