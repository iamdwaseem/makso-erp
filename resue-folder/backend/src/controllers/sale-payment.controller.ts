import { Request, Response } from "express";
import { SalePaymentService } from "../services/sale-payment.service.js";
import { createSalePaymentSchema } from "../validators/sale-payment.validator.js";
import { BaseController } from "./BaseController.js";

export class SalePaymentController extends BaseController {
  private getService(req: Request): SalePaymentService {
    const ctx = this.getServiceContext(req);
    return new SalePaymentService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getBySaleId = async (req: Request, res: Response) => {
    try {
      const saleId = req.params.id as string;
      const payments = await this.getService(req).getBySaleId(saleId);
      return this.success(res, payments);
    } catch (error: any) {
      return this.handleError(res, error, "Sale not found");
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const saleId = req.params.id as string;
      const data = createSalePaymentSchema.parse(this.getBody(req));
      const payment = await this.getService(req).create(saleId, data);
      return this.success(res, payment, 201);
    } catch (error: any) {
      return this.handleError(res, error, "Sale not found");
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const saleId = req.params.id as string;
      const paymentId = req.params.paymentId as string;
      await this.getService(req).delete(saleId, paymentId);
      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error, "Sale not found");
    }
  };
}
