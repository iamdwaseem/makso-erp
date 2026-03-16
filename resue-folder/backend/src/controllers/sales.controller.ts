import { Request, Response } from "express";
import { SalesService } from "../services/sales.service.js";
import { createSaleSchema, updateSaleSchema } from "../validators/sale.validator.js";
import { BaseController } from "./BaseController.js";

export class SalesController extends BaseController {
  private getService(req: Request): SalesService {
    const ctx = this.getServiceContext(req);
    return new SalesService(
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
      const sale = await this.getService(req).getById(id);
      return this.success(res, sale);
    } catch (error: any) {
      return this.handleError(res, error, "Sale not found");
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const data = createSaleSchema.parse(this.getBody(req));
      const sale = await this.getService(req).create(data);
      return this.success(res, sale, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const data = updateSaleSchema.parse(this.getBody(req));
      const sale = await this.getService(req).update(id, data);
      return this.success(res, sale);
    } catch (error: any) {
      return this.handleError(res, error, "Sale not found");
    }
  };

  submit = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const sale = await this.getService(req).submit(id);
      return this.success(res, sale);
    } catch (error: any) {
      return this.handleError(res, error, "Sale not found");
    }
  };

  cancel = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const sale = await this.getService(req).cancel(id);
      return this.success(res, sale);
    } catch (error: any) {
      return this.handleError(res, error, "Sale not found");
    }
  };
}
