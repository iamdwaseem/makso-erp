import { Request, Response } from "express";
import { BaseController } from "./BaseController.js";
import { WarehouseRequest } from "../middleware/warehouseAccess.middleware.js";
import { WarehouseService } from "../services/warehouse.service.js";

export class WarehouseController extends BaseController {
  private getService(req: Request): WarehouseService {
    const ctx = this.getServiceContext(req);

    return new WarehouseService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getAllWarehouses = async (req: Request, res: Response) => {
    try {
      const { page, limit } = this.getPagination(req);

      const service = this.getService(req);
      const result = await service.getAllWarehouses({ page, limit });
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  getWarehouseById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      const warehouse = await service.getWarehouseById(id);
      return this.success(res, warehouse);
    } catch (error: any) {
      return this.handleError(res, error, "Warehouse not found");
    }
  }

  createWarehouse = async (req: Request, res: Response) => {
    try {
      const { name, code, location } = req.body;
      if (!name || !code) {
        return res.status(400).json({ error: "Name and code are required" });
      }
      const service = this.getService(req);
      const warehouse = await service.createWarehouse({ name, code, location });
      return this.success(res, warehouse, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  updateWarehouse = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      const warehouse = await service.updateWarehouse(id, req.body);
      return this.success(res, warehouse);
    } catch (error: any) {
      return this.handleError(res, error, "Warehouse not found");
    }
  }

  deleteWarehouse = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      await service.deleteWarehouse(id);
      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error, "Warehouse not found");
    }
  }
}
