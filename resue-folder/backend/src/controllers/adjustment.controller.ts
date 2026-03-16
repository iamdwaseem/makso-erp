import { Request, Response } from "express";
import { AdjustmentService } from "../services/adjustment.service.js";
import { createAdjustmentSchema } from "../validators/adjustment.validator.js";
import { BaseController } from "./BaseController.js";

export class AdjustmentController extends BaseController {
  private getService(req: Request): AdjustmentService {
    const ctx = this.getServiceContext(req);
    return new AdjustmentService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const { page, limit } = this.getPagination(req);
      const result = await this.getService(req).getAll({ page, limit });
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const adjustment = await this.getService(req).getById(id);
      return this.success(res, adjustment);
    } catch (error: any) {
      return this.handleError(res, error, "Adjustment not found");
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const data = createAdjustmentSchema.parse(this.getBody(req));
      const adjustment = await this.getService(req).create(data);
      return this.success(res, adjustment, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
}
