import { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import { ReportService } from "../services/report.service.js";

export class ReportController extends BaseController {
  getStock = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new ReportService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getStockReport(warehouseId);
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getLowStock = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new ReportService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getLowStockReport(warehouseId);
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getTransactions = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new ReportService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const data = await service.getTransactionsReport({ from, to, warehouseId, limit });
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getSalesSummary = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new ReportService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getSalesSummaryReport({ from, to, warehouseId });
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getInventoryValuation = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new ReportService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getInventoryValuationReport(warehouseId);
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getCustomerAging = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new ReportService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const data = await service.getCustomerAgingReport();
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getSupplierAging = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new ReportService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const data = await service.getSupplierAgingReport();
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getInventoryMovementHistory = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new ReportService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const data = await service.getInventoryMovementHistory({ from, to, warehouseId, limit });
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
}
