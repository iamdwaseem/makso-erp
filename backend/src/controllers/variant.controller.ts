import { Request, Response } from "express";
import { VariantService } from "../services/variant.service.js";
import { variantSchema } from "../validators/variant.validator.js";

const variantService = new VariantService();

export class VariantController {
  async getAllVariants(req: Request, res: Response) {
    try {
      const variants = await variantService.getAllVariants();
      return res.status(200).json(variants);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getVariantById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const variant = await variantService.getVariantById(id);
      return res.status(200).json(variant);
    } catch (error: any) {
      const status = error.message === "Variant not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async getVariantsByProductId(req: Request, res: Response) {
    try {
      const productId = req.params.id as string;
      const variants = await variantService.getVariantsByProductId(productId);
      return res.status(200).json(variants);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createVariant(req: Request, res: Response) {
    try {
      const validatedData = variantSchema.parse(req.body);
      const variant = await variantService.createVariant(validatedData);
      return res.status(201).json(variant);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }
      if (error.message === "SKU already exists") {
        return res.status(409).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  async updateVariant(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const validatedData = variantSchema.partial().parse(req.body);
      
      // Prevent updating product_id
      if (validatedData.product_id) {
          delete validatedData.product_id;
      }

      const variant = await variantService.updateVariant(id, validatedData);
      return res.status(200).json(variant);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }
      if (error.message === "SKU already exists") {
        return res.status(409).json({ error: error.message });
      }
      const status = error.message === "Variant not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async deleteVariant(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await variantService.deleteVariant(id);
      return res.status(204).send();
    } catch (error: any) {
      const status = error.message === "Variant not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }
}
