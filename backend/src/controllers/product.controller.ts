import { Request, Response } from "express";
import { ProductService } from "../services/product.service.js";
import { productSchema } from "../validators/product.validator.js";

const productService = new ProductService();

export class ProductController {
  async getAllProducts(req: Request, res: Response) {
    try {
      const products = await productService.getAllProducts();
      return res.status(200).json(products);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const product = await productService.getProductById(id);
      return res.status(200).json(product);
    } catch (error: any) {
      const status = error.message === "Product not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      const validatedData = productSchema.parse(req.body);
      const product = await productService.createProduct(validatedData);
      return res.status(201).json(product);
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

  async updateProduct(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const validatedData = productSchema.partial().parse(req.body);
      const product = await productService.updateProduct(id, validatedData);
      return res.status(200).json(product);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ errors: error.errors });
      }
      if (error.message === "SKU already exists") {
        return res.status(409).json({ error: error.message });
      }
      const status = error.message === "Product not found" ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      await productService.deleteProduct(id);
      return res.status(204).send();
    } catch (error: any) {
      if (error.message === "Product not found") return res.status(404).json({ error: error.message });
      if (error.message?.startsWith("Cannot delete")) return res.status(400).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }
}
