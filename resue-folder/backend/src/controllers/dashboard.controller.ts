import { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import { DashboardService } from "../services/dashboard.service.js";

export class DashboardController extends BaseController {
  getStats = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new DashboardService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getStats({ from, to, warehouseId });
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getSalesPurchaseTrend = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new DashboardService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const from = req.query.from as string;
      const to = req.query.to as string;
      if (!from || !to) {
        return res.status(400).json({ error: "from and to query params required" });
      }
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getSalesPurchaseTrend(from, to, warehouseId);
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getInventoryTrend = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new DashboardService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const from = req.query.from as string;
      const to = req.query.to as string;
      if (!from || !to) {
        return res.status(400).json({ error: "from and to query params required" });
      }
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getInventoryTrend(from, to, warehouseId);
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getEmployeeSales = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new DashboardService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getEmployeeSales({ from, to, warehouseId });
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getItemGroups = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new DashboardService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getItemGroups(warehouseId);
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getStockInOutTrend = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new DashboardService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const from = req.query.from as string;
      const to = req.query.to as string;
      if (!from || !to) {
        return res.status(400).json({ error: "from and to query params required" });
      }
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getStockInOutTrend(from, to, warehouseId);
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getGainLoss = async (req: Request, res: Response) => {
    try {
      const ctx = this.getServiceContext(req);
      const service = new DashboardService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const warehouseId = req.query.warehouseId as string | undefined;
      const data = await service.getGainLoss(warehouseId);
      return this.success(res, data);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
}
