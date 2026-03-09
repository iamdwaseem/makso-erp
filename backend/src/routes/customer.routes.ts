import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller.js";

const router = Router();
const customerController = new CustomerController();

router.get("/customers", customerController.getAllCustomers);
router.get("/customers/:id", customerController.getCustomerById);
router.post("/customers", customerController.createCustomer);
router.put("/customers/:id", customerController.updateCustomer);
router.delete("/customers/:id", customerController.deleteCustomer);

export default router;
