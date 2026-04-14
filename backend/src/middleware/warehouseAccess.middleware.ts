import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "./auth.middleware.js";
import { tenantStorage } from "../lib/context.js";

/**
 * Middleware to enforce warehouse-level authorization.
 * 
 * Rules:
 * 1. ADMIN users have access to ALL warehouses.
 * 2. Non-admin users must have an explicit assignment in the UserWarehouse table.
 * 3. If no specific warehouse is requested (warehouseId is missing or "all"), 
 *    the middleware passes through, allowing repository filtering logic to handle it.
 */
export interface WarehouseRequest extends AuthRequest {
  allowedWarehouseIds: string[];
}

export async function authorizeWarehouseAccess(req: Request, res: Response, next: NextFunction) {
  const authReq = req as unknown as WarehouseRequest;
  const userId = authReq.userId;
  const userRole = authReq.userRole;
  const tenantReq = req as unknown as any;
  const organizationId = tenantReq.tenant?.organizationId;
  
  const warehouseId = (req.query?.warehouseId || req.body?.warehouseId || req.params?.warehouseId) as string;

  if (!userId || !organizationId) {
    res.status(401).json({ error: "Unauthorized or Organization context missing" });
    return;
  }

  try {
    let allowedIds: string[] = [];

    if (userRole === "ADMIN") {
      // Admins get all warehouses in the organization
      const allWarehouses = await (prisma as any).warehouse.findMany({
        where: { organization_id: organizationId },
        select: { id: true }
      });
      allowedIds = allWarehouses.map((w: any) => w.id);
    } else {
      // Non-admins get assigned warehouses
      const assignments = await (prisma as any).userWarehouse.findMany({
        where: { user_id: userId },
        select: { warehouse_id: true }
      });
      allowedIds = assignments.map((a: any) => a.warehouse_id);
    }

    authReq.allowedWarehouseIds = allowedIds;

    // If a specific warehouse is targeted, check permissions
    if (warehouseId && warehouseId !== "all") {
      if (!allowedIds.includes(warehouseId)) {
        res.status(403).json({ error: "Access to warehouse denied" });
        return;
      }
    }

    // Persist allowed warehouse scope for downstream handlers.
    tenantStorage.enterWith({
      organizationId: organizationId,
      allowedWarehouseIds: allowedIds,
    });
    return next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
