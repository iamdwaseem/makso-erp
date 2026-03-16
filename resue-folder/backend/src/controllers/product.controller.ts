import { Request, Response } from "express";
import { ProductService } from "../services/product.service.js";
import { productSchema } from "../validators/product.validator.js";
import { BaseController } from "./BaseController.js";
import { VariantController } from "./variant.controller.js";

export class ProductController extends BaseController {
  private getService(req: Request): ProductService {
    const ctx = this.getServiceContext(req);
    return new ProductService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getAllProducts = async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = this.getPagination(req);
      if (search !== undefined) {
        const q = search?.trim();
        if (!q || q.length < 2) {
          return this.success(res, {
            data: [],
            meta: { total: 0, page, limit, totalPages: 0 },
          });
        }
      }
      const service = this.getService(req);
      const result = await service.getAllProducts({ page, limit, search });
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getProductById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      const product = await service.getProductById(id);
      return this.success(res, product);
    } catch (error: any) {
      return this.handleError(res, error, "Product not found");
    }
  };

  createProduct = async (req: Request, res: Response) => {
    try {
      const validatedData = productSchema.parse(this.getBody(req));
      const service = this.getService(req);
      const product = await service.createProduct(validatedData);
      return this.success(res, product, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  updateProduct = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = productSchema.partial().parse(this.getBody(req));
      const service = this.getService(req);
      const product = await service.updateProduct(id, validatedData);
      return this.success(res, product);
    } catch (error: any) {
      return this.handleError(res, error, "Product not found");
    }
  };

  deleteProduct = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      await service.deleteProduct(id);
      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error, "Product not found");
    }
  };

  /** GET /api/products/:id/variants — delegates to variant controller */
  getVariantsByProductId = (req: Request, res: Response) => {
    const variantController = new VariantController();
    return variantController.getVariantsByProductId(req, res);
  };
}
