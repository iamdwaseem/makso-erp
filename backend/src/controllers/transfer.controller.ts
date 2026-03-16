import { Request, Response } from "express";
import { TransferService } from "../services/transfer.service.js";
import { createTransferSchema, updateTransferSchema } from "../validators/transfer.validator.js";
import { BaseController } from "./BaseController.js";

export class TransferController extends BaseController {
  private getService(req: Request): TransferService {
    const ctx = this.getServiceContext(req);
    return new TransferService(
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
      const transfer = await this.getService(req).getById(id);
      return this.success(res, transfer);
    } catch (error: any) {
      return this.handleError(res, error, "Transfer not found");
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const data = createTransferSchema.parse(this.getBody(req));
      const transfer = await this.getService(req).create(data);
      return this.success(res, transfer, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const data = updateTransferSchema.parse(this.getBody(req));
      const transfer = await this.getService(req).update(id, data);
      return this.success(res, transfer);
    } catch (error: any) {
      return this.handleError(res, error, "Transfer not found");
    }
  };

  submit = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const transfer = await this.getService(req).submit(id);
      return this.success(res, transfer);
    } catch (error: any) {
      return this.handleError(res, error, "Transfer not found");
    }
  };
}

