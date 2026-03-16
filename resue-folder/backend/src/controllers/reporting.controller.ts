import { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import { ReportingService } from "../services/reporting.service.js";

export class ReportingController extends BaseController {
  getOverview = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new ReportingService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getOverview({ from, to, warehouseId });
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
}
