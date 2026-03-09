import { Request, Response } from "express";
import { SupplierService } from "../services/supplier.service.js";
import { supplierSchema } from "../validators/supplier.validator.js";

const supplierService = new SupplierService();

export class SupplierController {
  async getAllSuppliers(req: Request, res: Response) {
    try {
      const suppliers = await supplierService.getAllSuppliers();
      return res.status(200).json(suppliers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getSupplierById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const supplier = await supplierService.getSupplierById(id);
      return res.status(200).json(supplier);
    } catch (error: any) {
      const status = error.message === "Supplier not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async createSupplier(req: Request, res: Response) {
    try {
      const validatedData = supplierSchema.parse(req.body);
      const supplier = await supplierService.createSupplier(validatedData);
      return res.status(201).json(supplier);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  async updateSupplier(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const validatedData = supplierSchema.partial().parse(req.body);
      const supplier = await supplierService.updateSupplier(id, validatedData);
      return res.status(200).json(supplier);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }
      const status = error.message === "Supplier not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async deleteSupplier(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await supplierService.deleteSupplier(id);
      return res.status(204).send();
    } catch (error: any) {
      const status = error.message === "Supplier not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }
}
