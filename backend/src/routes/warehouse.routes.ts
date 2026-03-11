import { Router } from "express";
import { WarehouseController } from "../controllers/warehouse.controller.js";
import { authorizeRole } from "../middleware/role.middleware.js";

const router = Router();
const controller = new WarehouseController();

router.get("/warehouses", controller.getAllWarehouses);
router.post("/warehouses", authorizeRole("ADMIN"), controller.createWarehouse);
router.get("/warehouses/:id", controller.getWarehouseById);
router.delete("/warehouses/:id", authorizeRole("ADMIN"), controller.deleteWarehouse);
router.put("/warehouses/:id", authorizeRole("ADMIN"), controller.updateWarehouse);

export default router;
