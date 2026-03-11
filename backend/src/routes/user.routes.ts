import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authorizeRole } from "../middleware/role.middleware.js";

const router = Router();
const userController = new UserController();

// All user management routes require ADMIN role
router.get("/users", authorizeRole("ADMIN"), (req, res) => userController.listUsers(req, res));
router.post("/users", authorizeRole("ADMIN"), (req, res) => userController.createUser(req, res));
router.delete("/users/:id", authorizeRole("ADMIN"), (req, res) => userController.deleteUser(req, res));

router.get("/users/:id/warehouses", authorizeRole("ADMIN"), (req, res) => userController.getUserWarehouses(req, res));
router.post("/users/:id/warehouses", authorizeRole("ADMIN"), (req, res) => userController.assignWarehouse(req, res));
router.delete("/users/:id/warehouses/:warehouseId", authorizeRole("ADMIN"), (req, res) => userController.unassignWarehouse(req, res));

export default router;
