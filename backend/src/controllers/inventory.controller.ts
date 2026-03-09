import { Request, Response } from "express";
import { InventoryService } from "../services/inventory.service.js";
import { adjustInventorySchema } from "../validators/inventory.validator.js";

const inventoryService = new InventoryService();

export class InventoryController {
  async getAllInventory(req: Request, res: Response) {
    try {
      const inventory = await inventoryService.getAllInventory();
      return res.status(200).json(inventory);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getInventoryByVariantId(req: Request, res: Response) {
    try {
      const variantId = req.params.variantId as string;
      const inventory = await inventoryService.getInventoryByVariantId(variantId);
      return res.status(200).json(inventory);
    } catch (error: any) {
      const status = error.message === "Variant not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async adjustInventory(req: Request, res: Response) {
    try {
      // Parse using Zod
      const validatedData = adjustInventorySchema.parse(req.body);
      const result = await inventoryService.adjustInventory(validatedData);
      
      return res.status(200).json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }
      
      if (error.message === "Variant not found") {
         return res.status(404).json({ error: error.message });
      }

      if (error.message === "Insufficient inventory") {
         return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message });
    }
  }

  async getLedgerByVariantId(req: Request, res: Response) {
    try {
      const variantId = req.params.variantId as string;
      const ledger = await inventoryService.getLedgerByVariantId(variantId);
      return res.status(200).json(ledger);
    } catch (error: any) {
      const status = error.message === "Variant not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }
}
