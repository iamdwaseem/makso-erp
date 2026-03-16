import { Request, Response } from "express";
import { CustomerService } from "../services/customer.service.js";
import { customerSchema } from "../validators/customer.validator.js";
import { BaseController } from "./BaseController.js";

export class CustomerController extends BaseController {
  private getService(req: Request): CustomerService {
    const ctx = this.getServiceContext(req);
    return new CustomerService(
      ctx.organizationId,
      ctx.userId,
      ctx.userRole,
      ctx.allowedWarehouseIds
    );
  }

  getAllCustomers = async (req: Request, res: Response) => {
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
      const result = await service.getAllCustomers({ page, limit, search });
      return this.success(res, result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  getCustomerById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      const customer = await service.getCustomerById(id);
      return this.success(res, customer);
    } catch (error: any) {
      return this.handleError(res, error, "Customer not found");
    }
  };

  createCustomer = async (req: Request, res: Response) => {
    try {
      const validatedData = customerSchema.parse(this.getBody(req));
      const service = this.getService(req);
      const customer = await service.createCustomer(validatedData);
      return this.success(res, customer, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };

  updateCustomer = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const validatedData = customerSchema.partial().parse(this.getBody(req));
      const service = this.getService(req);
      const customer = await service.updateCustomer(id, validatedData);
      return this.success(res, customer);
    } catch (error: any) {
      return this.handleError(res, error, "Customer not found");
    }
  };

  deleteCustomer = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const service = this.getService(req);
      await service.deleteCustomer(id);
      return res.status(204).send();
    } catch (error: any) {
      return this.handleError(res, error, "Customer not found");
    }
  };
}
