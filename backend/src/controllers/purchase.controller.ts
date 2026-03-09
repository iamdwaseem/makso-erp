import { Request, Response } from "express";
import { PurchaseService } from "../services/purchase.service.js";
import { purchaseSchema } from "../validators/purchase.validator.js";

const purchaseService = new PurchaseService();

export class PurchaseController {
  async getAllPurchases(req: Request, res: Response) {
    try {
      const purchases = await purchaseService.getAllPurchases();
      return res.status(200).json(purchases);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getPurchaseById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const purchase = await purchaseService.getPurchaseById(id);
      return res.status(200).json(purchase);
    } catch (error: any) {
      const status = error.message === "Purchase not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async createPurchase(req: Request, res: Response) {
    try {
      const validatedData = purchaseSchema.parse(req.body);
      const purchase = await purchaseService.createPurchase(validatedData);
      
      return res.status(201).json(purchase);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }

      if (error.message === "Supplier not found") {
         return res.status(404).json({ error: error.message });
      }

      if (error.message.includes("Variant not found")) {
        return res.status(404).json({ error: error.message });
     }

      return res.status(500).json({ error: error.message });
    }
  }
}
