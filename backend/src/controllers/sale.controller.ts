import { Request, Response } from "express";
import { SaleService } from "../services/sale.service.js";
import { saleSchema } from "../validators/sale.validator.js";

const saleService = new SaleService();

export class SaleController {
  async getAllSales(req: Request, res: Response) {
    try {
      const sales = await saleService.getAllSales();
      return res.status(200).json(sales);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getSaleById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const sale = await saleService.getSaleById(id);
      return res.status(200).json(sale);
    } catch (error: any) {
      const status = error.message === "Sale not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async createSale(req: Request, res: Response) {
    try {
      const validatedData = saleSchema.parse(req.body);
      const sale = await saleService.createSale(validatedData);
      
      return res.status(201).json(sale);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }

      if (error.message === "Customer not found") {
         return res.status(404).json({ error: error.message });
      }

      if (error.message.includes("Variant not found")) {
        return res.status(404).json({ error: error.message });
      }

      if (error.message === "Insufficient inventory") {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message });
    }
  }
}
