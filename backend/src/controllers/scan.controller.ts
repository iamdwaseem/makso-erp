import { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import { ScanService } from "../services/scan.service.js";
import { scanSchema } from "../validators/scan.validator.js";
import prisma from "../lib/prisma.js";

export class ScanController extends BaseController {
  private getService(req: Request): ScanService {
    const orgId = this.getTenant(req);
    return new ScanService(prisma as any, orgId);
  }

  processScan = async (req: Request, res: Response) => {
    try {
      const validatedData = scanSchema.parse(req.body);
      const service = this.getService(req);
      const scanLog = await service.processScan(validatedData);

      return this.success(res, scanLog, 201);
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found for the given SKU");
    }
  }
}
