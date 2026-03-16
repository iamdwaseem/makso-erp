import { Request, Response } from "express";
import { SupplierService } from "../services/supplier.service.js";
import { supplierSchema } from "../validators/supplier.validator.js";
import { BaseController } from "./BaseController.js";

export class SupplierController extends BaseController {
  private getService(req: Request): SupplierService {
    const ctx = this.getServiceContext(req);
    return new SupplierService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getAllSuppliers = async (req: Request, res: Response) => {
    try {
      const { page, limit, search } = this.getPagination(req);
      if (search !== undefined) {
        const q = search?.trim();
        if (!q || q.length < 2) {
          return this.success(res, {
            data: [],
            meta: { total: 0, page, limit, totalPages: 0 },
          });
        }
      }
      const service = this.getService(req);
      const result = await service.getAllSuppliers({ page, limit, search });
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getSupplierById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      const supplier = await service.getSupplierById(id);
      return this.success(res, supplier);
    } catch (error: any) {
      return this.handleError(res, error, "Supplier not found");
    }
  };

  createSupplier = async (req: Request, res: Response) => {
    try {
      const validatedData = supplierSchema.parse(this.getBody(req));
      const service = this.getService(req);
      const supplier = await service.createSupplier(validatedData);
      return this.success(res, supplier, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  updateSupplier = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = supplierSchema.partial().parse(this.getBody(req));
      const service = this.getService(req);
      const supplier = await service.updateSupplier(id, validatedData);
      return this.success(res, supplier);
    } catch (error: any) {
      return this.handleError(res, error, "Supplier not found");
    }
  };

  deleteSupplier = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      await service.deleteSupplier(id);
      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error, "Supplier not found");
    }
  };
}
