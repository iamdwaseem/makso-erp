import { Request, Response } from "express";
import { GrnService } from "../services/grn.service.js";
import { createGrnSchema, updateGrnSchema } from "../validators/grn.validator.js";
import { BaseController } from "./BaseController.js";

export class GrnController extends BaseController {
  private getService(req: Request): GrnService {
    const ctx = this.getServiceContext(req);
    return new GrnService(
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
      const grn = await this.getService(req).getById(id);
      return this.success(res, grn);
    } catch (error: any) {
      return this.handleError(res, error, "GRN not found");
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const data = createGrnSchema.parse(this.getBody(req));
      const grn = await this.getService(req).create(data);
      return this.success(res, grn, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const data = updateGrnSchema.parse(this.getBody(req));
      const grn = await this.getService(req).update(id, data);
      return this.success(res, grn);
    } catch (error: any) {
      return this.handleError(res, error, "GRN not found");
    }
  };

  submit = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const grn = await this.getService(req).submit(id);
      return this.success(res, grn);
    } catch (error: any) {
      return this.handleError(res, error, "GRN not found");
    }
  };

  cancel = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const grn = await this.getService(req).cancel(id);
      return this.success(res, grn);
    } catch (error: any) {
      return this.handleError(res, error, "GRN not found");
    }
  };
}
