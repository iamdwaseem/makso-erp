import { Request, Response, NextFunction } from "express";
import { tenantStorage } from "../lib/context.js";
import type { AuthRequest } from "./auth.middleware.js";
import type { TenantRequest } from "./tenant.middleware.js";
import type { WarehouseRequest } from "./warehouseAccess.middleware.js";

/** Dev-only user shape; attached to req.user when NODE_ENV === "development". */
export interface DevUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  warehouseIds: string[];
}

const DEV_USER: DevUser = {
  id: "dev-user",
  email: "dev@erp.local",
  role: "ADMIN",
  tenantId: "dev-org",
  warehouseIds: ["main"],
};

/**
 * Development-only auth bypass. Attaches a default admin user, tenant, and warehouse
 * access so the app behaves as if a real user is authenticated. Only used when
 * NODE_ENV === "development". Do not use in production.
 */
export function devAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== "development") {
    return next();
  }

  const tReq = req as TenantRequest;
  const aReq = req as AuthRequest;
  const wReq = req as WarehouseRequest;

  // Tenant (if not already set by resolveTenant)
  if (!tReq.tenant) {
    tReq.tenant = {
      organizationId: DEV_USER.tenantId,
      slug: "dev-org",
    };
  }

  // Auth: same shape as auth.middleware
  aReq.userId = DEV_USER.id;
  aReq.userEmail = DEV_USER.email;
  aReq.userRole = DEV_USER.role;
  aReq.organization_id = DEV_USER.tenantId;
  aReq.user = DEV_USER;

  // Warehouse access
  wReq.allowedWarehouseIds = DEV_USER.warehouseIds;

  return tenantStorage.run(
    {
      organizationId: DEV_USER.tenantId,
      allowedWarehouseIds: DEV_USER.warehouseIds,
    },
    () => next()
  );
}
