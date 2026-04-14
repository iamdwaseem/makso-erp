import { Request, Response } from "express";
import { VariantService } from "../services/variant.service.js";
import { variantSchema } from "../validators/variant.validator.js";
import { variantUpdateRequestChangesSchema } from "../validators/updateRequest.validator.js";
import { UpdateRequestService } from "../services/updateRequest.service.js";
import { toCamelCase } from "../utils/mapper.js";
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

      if (search !== undefined) {
        const q = search.trim();
        if (!q || q.length < 2) {
          return this.success(res, { data: [], meta: { total: 0, page, limit, totalPages: 0 } });
        }
      }

      const service = this.getService(req);
      const result = await service.getAllVariants({ page, limit, search });
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  getVariantById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      const variant = await service.getVariantById(id);
      return this.success(res, variant);
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found");
    }
  }

  getVariantsByProductId = async (req: Request, res: Response) => {
    try {
      const productId = req.params.id as string;
      const service = this.getService(req);
      const variants = await service.getVariantsByProductId(productId);
      return this.success(res, variants);
    } catch (error: any) {
      return this.handleError(res, error, "Product not found");
    }
  }

  getVariantBySku = async (req: Request, res: Response) => {
    try {
      const sku = req.params.sku as string;
      const service = this.getService(req);
      const variant = await service.getVariantBySku(sku);
      return this.success(res, variant);
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found");
    }
  }

  createVariant = async (req: Request, res: Response) => {
    try {
      const validatedData = variantSchema.parse(this.getBody(req));
      const service = this.getService(req);
      const variant = await service.createVariant(validatedData);
      return this.success(res, variant, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  updateVariant = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = variantUpdateRequestChangesSchema.parse(this.getBody(req));
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
        const requestRow = await updateRequestService.submitVariantUpdateRequest(id, ctx.userId, validatedData);
        return res.status(202).json(
          toCamelCase({
            message: "Update request submitted for approval",
            data: requestRow,
          })
        );
      }

      if (ctx.userRole !== "ADMIN" && ctx.userRole !== "MANAGER") {
        return res.status(403).json({ error: "Forbidden: You do not have permission to update variants" });
      }

      const service = this.getService(req);
      const variant = await service.updateVariant(id, validatedData);
      return this.success(res, variant);
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found");
    }
  }

  deleteVariant = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      await service.deleteVariant(id);
      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found");
    }
  }
}
