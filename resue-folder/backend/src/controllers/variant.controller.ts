import { Request, Response } from "express";
import { VariantService } from "../services/variant.service.js";
import { variantSchema } from "../validators/variant.validator.js";
import { BaseController } from "./BaseController.js";

export class VariantController extends BaseController {
  private getService(req: Request): VariantService {
    const ctx = this.getServiceContext(req);
    return new VariantService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getAllVariants = async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = this.getPagination(req);
      // If search is too short, still return first page (for combobox initial load)
      const effectiveSearch =
        typeof search === "string" && search.trim().length >= 2 ? search.trim() : undefined;
      const service = this.getService(req);
      const result = await service.getAllVariants({ page, limit, search: effectiveSearch });
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getVariantById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      const variant = await service.getVariantById(id);
      return this.success(res, variant);
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found");
    }
  };

  getVariantsByProductId = async (req: Request, res: Response) => {
    try {
      const productId = req.params.id as string;
      const service = this.getService(req);
      const variants = await service.getVariantsByProductId(productId);
      return this.success(res, variants);
    } catch (error: any) {
      return this.handleError(res, error, "Product not found");
    }
  };

  getVariantBySku = async (req: Request, res: Response) => {
    try {
      const sku = req.params.sku as string;
      const service = this.getService(req);
      const variant = await service.getVariantBySku(sku);
      return this.success(res, variant);
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found");
    }
  };

  createVariant = async (req: Request, res: Response) => {
    try {
      const validatedData = variantSchema.parse(this.getBody(req));
      const service = this.getService(req);
      const variant = await service.createVariant(validatedData);
      return this.success(res, variant, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  updateVariant = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = variantSchema.partial().parse(this.getBody(req));
      const service = this.getService(req);
      const variant = await service.updateVariant(id, validatedData);
      return this.success(res, variant);
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found");
    }
  };

  deleteVariant = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      await service.deleteVariant(id);
      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found");
    }
  };
}
