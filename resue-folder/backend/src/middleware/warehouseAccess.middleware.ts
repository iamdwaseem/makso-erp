import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { AuthRequest } from "./auth.middleware.js";
import { tenantStorage } from "../lib/context.js";

export interface WarehouseRequest extends AuthRequest {
  allowedWarehouseIds: string[];
}

export async function authorizeWarehouseAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as unknown as WarehouseRequest;
  const userId = authReq.userId;
  const userRole = authReq.userRole;
  const tenantReq = req as unknown as any;
  const organizationId = tenantReq.tenant?.organizationId;

  const warehouseId = (req.query?.warehouseId ||
    req.body?.warehouseId ||
    req.params?.warehouseId) as string;

  // In development, if we have organization but no user (e.g. no token sent), treat as org admin so dashboard can load
  if (
    process.env.NODE_ENV === "development" &&
    organizationId &&
    !authReq.userId
  ) {
    authReq.userId = "dev-user";
    authReq.userRole = "ADMIN";
  }

  const effectiveUserId = authReq.userId;
  const effectiveUserRole = authReq.userRole ?? "ADMIN";
  if (!effectiveUserId || !organizationId) {
    res
      .status(401)
      .json({ error: "Unauthorized or Organization context missing" });
    return;
  }

  // In development, dev user has warehouse access from devAuth (no DB lookup).
  if (
    process.env.NODE_ENV === "development" &&
    effectiveUserId === "dev-user" &&
    (authReq as any).user?.warehouseIds
  ) {
    const allowedIds = (authReq as any).user.warehouseIds as string[];
    authReq.allowedWarehouseIds = allowedIds;
    return tenantStorage.run(
      { organizationId, allowedWarehouseIds: allowedIds },
      () => next()
    );
  }

  try {
    let allowedIds: string[] = [];

    if (effectiveUserRole === "ADMIN") {
      const allWarehouses = await (prisma as any).warehouse.findMany({
        where: { organization_id: organizationId },
        select: { id: true },
      });
      allowedIds = allWarehouses.map((w: any) => w.id);
    } else {
      const assignments = await (prisma as any).userWarehouse.findMany({
        where: { user_id: effectiveUserId },
        select: { warehouse_id: true },
      });
      allowedIds = assignments.map((a: any) => a.warehouse_id);
    }

    authReq.allowedWarehouseIds = allowedIds;

    if (warehouseId && warehouseId !== "all") {
      if (!allowedIds.includes(warehouseId)) {
        res.status(403).json({ error: "Access to warehouse denied" });
        return;
      }
    }

    return tenantStorage.run(
      {
        organizationId: organizationId,
        allowedWarehouseIds: allowedIds,
      },
      () => {
        next();
      }
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
