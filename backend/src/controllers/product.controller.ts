import { Request, Response } from "express";
import { ProductService } from "../services/product.service.js";
import { productSchema } from "../validators/product.validator.js";
import { productUpdateRequestChangesSchema } from "../validators/updateRequest.validator.js";
import { UpdateRequestService } from "../services/updateRequest.service.js";
import { toCamelCase } from "../utils/mapper.js";
import { BaseController } from "./BaseController.js";

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
        const q = search.trim();
        if (!q || q.length < 2) {
          return this.success(res, { data: [], meta: { total: 0, page, limit, totalPages: 0 } });
        }
      }

      const service = this.getService(req);
      const result = await service.getAllProducts({ page, limit, search });
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  getProductById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      const product = await service.getProductById(id);
      return this.success(res, product);
    } catch (error: any) {
      return this.handleError(res, error, "Product not found");
    }
  }

  createProduct = async (req: Request, res: Response) => {
    try {
      const validatedData = productSchema.parse(this.getBody(req));
      const service = this.getService(req);
      const product = await service.createProduct(validatedData);
      return this.success(res, product, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  updateProduct = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = productUpdateRequestChangesSchema.parse(this.getBody(req));
      const ctx = this.getServiceContext(req);

      if (ctx.userRole === "STAFF") {
        if (Object.keys(validatedData).length === 0) {
          return res.status(400).json({ error: "No changes requested" });
        }
        if (!ctx.userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        const updateRequestService = new UpdateRequestService(
          ctx.organizationId,
          ctx.userId,
          ctx.userRole,
          ctx.allowedWarehouseIds
        );
        const requestRow = await updateRequestService.submitProductUpdateRequest(id, ctx.userId, validatedData);
        return res.status(202).json(
          toCamelCase({
            message: "Update request submitted for approval",
            data: requestRow,
          })
        );
      }

      if (ctx.userRole !== "ADMIN" && ctx.userRole !== "MANAGER") {
        return res.status(403).json({ error: "Forbidden: You do not have permission to update products" });
      }

      const service = this.getService(req);
      const product = await service.updateProduct(id, validatedData);
      return this.success(res, product);
    } catch (error: any) {
      return this.handleError(res, error, "Product not found");
    }
  }

  deleteProduct = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      await service.deleteProduct(id);
      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error, "Product not found");
    }
  }
}
