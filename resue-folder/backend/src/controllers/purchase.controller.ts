import { Request, Response } from "express";
import { PurchaseService } from "../services/purchase.service.js";
import { createPurchaseSchema, updatePurchaseSchema } from "../validators/purchase.validator.js";
import { BaseController } from "./BaseController.js";

export class PurchaseController extends BaseController {
  private getService(req: Request): PurchaseService {
    const ctx = this.getServiceContext(req);
    return new PurchaseService(
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
      const purchase = await this.getService(req).getById(id);
      return this.success(res, purchase);
    } catch (error: any) {
      return this.handleError(res, error, "Purchase not found");
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const data = createPurchaseSchema.parse(this.getBody(req));
      const purchase = await this.getService(req).create(data);
      return this.success(res, purchase, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const data = updatePurchaseSchema.parse(this.getBody(req));
      const purchase = await this.getService(req).update(id, data);
      return this.success(res, purchase);
    } catch (error: any) {
      return this.handleError(res, error, "Purchase not found");
    }
  };

  submit = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const purchase = await this.getService(req).submit(id);
      return this.success(res, purchase);
    } catch (error: any) {
      return this.handleError(res, error, "Purchase not found");
    }
  };

  cancel = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const purchase = await this.getService(req).cancel(id);
      return this.success(res, purchase);
    } catch (error: any) {
      return this.handleError(res, error, "Purchase not found");
    }
  };
}
