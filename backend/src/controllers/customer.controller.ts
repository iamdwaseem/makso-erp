import { Request, Response } from "express";
import { CustomerService } from "../services/customer.service.js";
import { customerSchema } from "../validators/customer.validator.js";

const customerService = new CustomerService();

export class CustomerController {
  async getAllCustomers(req: Request, res: Response) {
    try {
      const customers = await customerService.getAllCustomers();
      return res.status(200).json(customers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getCustomerById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const customer = await customerService.getCustomerById(id);
      return res.status(200).json(customer);
    } catch (error: any) {
      const status = error.message === "Customer not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async createCustomer(req: Request, res: Response) {
    try {
      const validatedData = customerSchema.parse(req.body);
      const customer = await customerService.createCustomer(validatedData);
      return res.status(201).json(customer);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  async updateCustomer(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const validatedData = customerSchema.partial().parse(req.body);
      const customer = await customerService.updateCustomer(id, validatedData);
      return res.status(200).json(customer);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }
      const status = error.message === "Customer not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async deleteCustomer(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await customerService.deleteCustomer(id);
      return res.status(204).send();
    } catch (error: any) {
      const status = error.message === "Customer not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }
}
