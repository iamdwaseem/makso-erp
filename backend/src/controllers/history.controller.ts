import { Request, Response } from "express";
import { HistoryService } from "../services/history.service.js";
import { BaseController } from "./BaseController.js";

export class HistoryController extends BaseController {
  private getService(req: Request): HistoryService {
    const ctx = this.getServiceContext(req);
    return new HistoryService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getHistory = async (req: Request, res: Response) => {
    try {
      const { page, limit } = this.getPagination(req);
      const type = req.query.type as "entry" | "exit" | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const period = req.query.period as "day" | "week" | "month" | "year" | "all" | "custom" | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const service = this.getService(req);
      const result = await service.getUnifiedHistory({ page, limit, type, warehouseId, period, startDate, endDate });
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }
}
