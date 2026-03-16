import { Request, Response } from "express";
import { GdnService } from "../services/gdn.service.js";
import { createGdnSchema, updateGdnSchema } from "../validators/gdn.validator.js";
import { BaseController } from "./BaseController.js";

export class GdnController extends BaseController {
  private getService(req: Request): GdnService {
    const ctx = this.getServiceContext(req);
    return new GdnService(
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
      const gdn = await this.getService(req).getById(id);
      return this.success(res, gdn);
    } catch (error: any) {
      return this.handleError(res, error, "GDN not found");
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const data = createGdnSchema.parse(this.getBody(req));
      const gdn = await this.getService(req).create(data);
      return this.success(res, gdn, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const data = updateGdnSchema.parse(this.getBody(req));
      const gdn = await this.getService(req).update(id, data);
      return this.success(res, gdn);
    } catch (error: any) {
      return this.handleError(res, error, "GDN not found");
    }
  };

  submit = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const gdn = await this.getService(req).submit(id);
      return this.success(res, gdn);
    } catch (error: any) {
      return this.handleError(res, error, "GDN not found");
    }
  };

  cancel = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const gdn = await this.getService(req).cancel(id);
      return this.success(res, gdn);
    } catch (error: any) {
      return this.handleError(res, error, "GDN not found");
    }
  };
}
