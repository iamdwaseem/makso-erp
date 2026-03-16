import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller.js";

const router = Router();
const controller = new CustomerController();

router.get("/", controller.getAllCustomers);
router.get("/:id", controller.getCustomerById);
router.post("/", controller.createCustomer);
router.patch("/:id", controller.updateCustomer);
router.delete("/:id", controller.deleteCustomer);

export default router;
