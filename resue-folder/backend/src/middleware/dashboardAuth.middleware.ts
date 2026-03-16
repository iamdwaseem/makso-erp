/**
 * For /api/dashboard* only: ensures tenant + user + allowedWarehouseIds so dashboard
 * works without requiring the full warehouse access flow (avoids 401 when no token in dev).
 */
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { tenantStorage } from "../lib/context.js";

export async function dashboardAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const path = (req.originalUrl || req.url || "").split("?")[0];
  if (!path.includes("/dashboard")) {
    return next();
  }

  const tenantReq = req as any;
  const authReq = req as any;
  const organizationId = tenantReq.tenant?.organizationId;

  if (!organizationId) {
    return res.status(400).json({ error: "Organization context missing" });
  }

  // In development, allow dashboard without a real user (no token)
  if (process.env.NODE_ENV === "development" && !authReq.userId) {
    authReq.userId = "dev-user";
    authReq.userRole = "ADMIN";
  }

  if (!authReq.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const warehouses = await (prisma as any).warehouse.findMany({
      where: { organization_id: organizationId },
      select: { id: true },
    });
    const allowedWarehouseIds = warehouses.map((w: any) => w.id);
    authReq.allowedWarehouseIds = allowedWarehouseIds;

    return tenantStorage.run(
      { organizationId, allowedWarehouseIds },
      () => next()
    );
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
