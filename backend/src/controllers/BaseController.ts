import { Request, Response } from "express";
import { TenantRequest } from "../middleware/tenant.middleware.js";
import { WarehouseRequest } from "../middleware/warehouseAccess.middleware.js";
import { toCamelCase, toSnakeCase } from "../utils/mapper.js";

export abstract class BaseController {
  
  /**
   * Extracts organizationId from the tenant context.
   */
  protected getTenant(req: Request) {
    const tenantReq = req as TenantRequest;
    if (!tenantReq.tenant?.organizationId) {
      throw new Error("Tenant context missing");
    }
    return tenantReq.tenant.organizationId;
  }

  /**
   * Extracts organizationId, userId, role, and warehouse permissions from the request context.
   */
  protected getServiceContext(req: Request) {
    const tenantReq = req as TenantRequest;
    const authReq = req as unknown as WarehouseRequest;

    if (!tenantReq.tenant?.organizationId) {
      throw new Error("Tenant context missing");
    }

    return {
      organizationId: tenantReq.tenant.organizationId,
      userId: authReq.userId,
      userRole: authReq.userRole,
      allowedWarehouseIds: authReq.allowedWarehouseIds || []
    };
  }

  /**
   * Standardizes request query parameter parsing for pagination and search.
   */
  protected getPagination(req: Request) {
    const page = Math.max(1, parseInt(String(req.query.page ?? 1)));
    const limit = 50;
    const skip = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    return { page, limit, skip, search };
  }

  /**
   * Sends a successful JSON response after converting keys to camelCase.
   */
  protected success(res: Response, data: any, status: number = 200) {
    return res.status(status).json(toCamelCase(data));
  }

  /**
   * Converts camelCase request body to snake_case for internal processing.
   */
  protected getBody(req: Request) {
    return toSnakeCase(req.body);
  }

  /**
   * Centralizes error handling with appropriate HTTP status codes.
   */
  protected handleError(res: Response, error: any, notFoundMessage: string = "Resource not found") {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    
    if (error.message === "Tenant context missing") {
      return res.status(400).json({ error: error.message });
    }

    if (error.message === notFoundMessage || error.message?.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === "SKU already exists" || error.message?.includes("already exists")) {
       return res.status(409).json({ error: error.message });
    }

    if (error.message?.startsWith("Cannot delete") || error.message === "Insufficient inventory") {
      return res.status(400).json({ error: error.message });
    }

    console.error("Controller Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
