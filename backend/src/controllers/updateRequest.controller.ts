import { Request, Response } from "express";
import { UpdateRequestService } from "../services/updateRequest.service.js";
import { BaseController } from "./BaseController.js";

export class UpdateRequestController extends BaseController {
  private getService(req: Request): UpdateRequestService {
    const ctx = this.getServiceContext(req);
    return new UpdateRequestService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  listPending = async (req: Request, res: Response) => {
    try {
      const data = await this.getService(req).listPending();
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  approve = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const ctx = this.getServiceContext(req);
      if (!ctx.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const requestRow = await this.getService(req).approve(id, ctx.userId, ctx.userRole);
      return this.success(res, {
        message: "Update request approved",
        request: requestRow,
      });
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  reject = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const ctx = this.getServiceContext(req);
      if (!ctx.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const requestRow = await this.getService(req).reject(id, ctx.userId, ctx.userRole);
      return this.success(res, {
        message: "Update request rejected",
        request: requestRow,
      });
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
}
