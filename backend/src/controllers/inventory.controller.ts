import { Request, Response } from "express";
import { InventoryService } from "../services/inventory.service.js";
import { BaseController } from "./BaseController.js";

export class InventoryController extends BaseController {
  private getService(req: Request): InventoryService {
    const ctx = this.getServiceContext(req);
    return new InventoryService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getAllInventory = async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = this.getPagination(req);
      const productId = req.query.productId as string | undefined;
      const status = req.query.status as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;

      const service = this.getService(req);
      const result = await service.getAllInventory({ page, limit, search, productId, status, warehouseId });
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  getInventoryByVariantId = async (req: Request, res: Response) => {
    try {
      const variantId = req.params.variantId as string;
      const warehouseId = req.query.warehouseId as string | undefined;
      const service = this.getService(req);
      const inventory = await service.getInventoryByVariantId(variantId, warehouseId);
      return this.success(res, inventory);
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found");
    }
  }

  getLedgerByVariantId = async (req: Request, res: Response) => {
    try {
      const variantId = req.params.variantId as string;
      const warehouseId = req.query.warehouseId as string | undefined;
      const service = this.getService(req);
      const ledger = await service.getLedgerByVariantId(variantId, warehouseId);
      return this.success(res, ledger);
    } catch (error: any) {
      return this.handleError(res, error, "Variant not found");
    }
  }
}
