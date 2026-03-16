import { Request, Response } from "express";
import { CreditNoteService } from "../services/credit-note.service.js";
import { createCreditNoteSchema } from "../validators/credit-note.validator.js";
import { BaseController } from "./BaseController.js";

export class CreditNoteController extends BaseController {
  private getService(req: Request): CreditNoteService {
    const ctx = this.getServiceContext(req);
    return new CreditNoteService(
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

  create = async (req: Request, res: Response) => {
    try {
      const data = createCreditNoteSchema.parse(this.getBody(req));
      const creditNote = await this.getService(req).create(data);
      return this.success(res, creditNote, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  submit = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const creditNote = await this.getService(req).submit(id);
      return this.success(res, creditNote);
    } catch (error: any) {
      return this.handleError(res, error, "Credit note not found");
    }
  };
}
