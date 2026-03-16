import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authorizeRole } from "../middleware/role.middleware.js";

const router = Router();
const userController = new UserController();

// User management: MANAGER can add/remove users (STAFF only); ADMIN can add/remove users and managers
router.get("/users", authorizeRole("ADMIN", "MANAGER"), (req, res) => userController.listUsers(req, res));
router.post("/users", authorizeRole("ADMIN", "MANAGER"), (req, res) => userController.createUser(req, res));
router.delete("/users/:id", authorizeRole("ADMIN", "MANAGER"), (req, res) => userController.deleteUser(req, res));

router.get("/users/:id/warehouses", authorizeRole("ADMIN", "MANAGER"), (req, res) => userController.getUserWarehouses(req, res));
router.post("/users/:id/warehouses", authorizeRole("ADMIN", "MANAGER"), (req, res) => userController.assignWarehouse(req, res));
router.delete("/users/:id/warehouses/:warehouseId", authorizeRole("ADMIN", "MANAGER"), (req, res) => userController.unassignWarehouse(req, res));

export default router;
