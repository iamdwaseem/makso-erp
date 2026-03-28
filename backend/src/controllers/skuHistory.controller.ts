import { Request, Response } from "express";
import type { SkuHistoryEntityType } from "@prisma/client";
import { SkuHistoryService } from "../services/skuHistory.service.js";
import { BaseController } from "./BaseController.js";

export class SkuHistoryController extends BaseController {
  private getService(req: Request): SkuHistoryService {
    const ctx = this.getServiceContext(req);
    return new SkuHistoryService(ctx.organizationId);
  }

  listByEntity = async (req: Request, res: Response) => {
    try {
      const entityType = req.params.entityType as string;
      const entityId = req.params.entityId as string;

      if (entityType !== "product" && entityType !== "variant") {
        return res.status(400).json({ error: "Invalid entity type" });
      }

      const service = this.getService(req);
      const rows = await service.listByEntity(entityType as SkuHistoryEntityType, entityId);
      return this.success(res, rows);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
}
