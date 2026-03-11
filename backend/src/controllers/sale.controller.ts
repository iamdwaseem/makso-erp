import { Request, Response } from "express";
import { SaleService } from "../services/sale.service.js";
import { saleSchema } from "../validators/sale.validator.js";
import { BaseController } from "./BaseController.js";

export class SaleController extends BaseController {
  private getService(req: Request): SaleService {
    const ctx = this.getServiceContext(req);
    return new SaleService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getAllSales = async (req: Request, res: Response) => {
    try {
      const { page, limit } = this.getPagination(req);
      const service = this.getService(req);
      const result = await service.getAllSales({ page, limit });
      return res.status(200).json(result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }

  getSaleById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      const sale = await service.getSaleById(id);
      return res.status(200).json(sale);
    } catch (error: any) {
      return this.handleError(res, error, "Sale not found");
    }
  }

  createSale = async (req: Request, res: Response) => {
    try {
      const validatedData = saleSchema.parse(this.getBody(req));
      const service = this.getService(req);
      const sale = await service.createSale(validatedData);
      return res.status(201).json(sale);
    } catch (error: any) {
      if (error.message === "Customer not found") {
        return res.status(404).json({ error: error.message });
      }
      return this.handleError(res, error);
    }
  }
}
