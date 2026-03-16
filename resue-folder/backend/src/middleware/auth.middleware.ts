import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { getEnv } from "../config/env.js";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  organization_id?: string;
  /** Set by devAuth in development; shape { id, email, role, tenantId, warehouseIds }. */
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    warehouseIds: string[];
  };
}

const isDevNoAuth = () =>
  process.env.NODE_ENV === "development" && process.env.SKIP_AUTH === "true";

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (isDevNoAuth() && (!authHeader || !authHeader.startsWith("Bearer "))) {
    const organizationId = (req as any).tenant?.organizationId;
    if (!organizationId) {
      next();
      return;
    }
    try {
      const firstUser = await (prisma as any).user.findFirst({
        where: { organization_id: organizationId },
        select: { id: true, email: true, role: true },
      });
      if (firstUser) {
        req.userId = firstUser.id;
        req.userEmail = firstUser.email ?? undefined;
        req.userRole = firstUser.role ?? "ADMIN";
        req.organization_id = organizationId;
      } else {
        req.userId = organizationId;
        req.userRole = "ADMIN";
        req.organization_id = organizationId;
      }
    } catch {
      req.userId = organizationId;
      req.userRole = "ADMIN";
      req.organization_id = organizationId;
    }
    next();
    return;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const { JWT_SECRET: secret } = getEnv();
    const payload = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: string;
      organization_id?: string;
    };

    const tenantOrganizationId = (req as any).tenant?.organizationId as
      | string
      | undefined;
    if (tenantOrganizationId) {
      if (!payload.organization_id) {
        res
          .status(401)
          .json({ error: "Unauthorized: token missing organization context" });
        return;
      }
      if (payload.organization_id !== tenantOrganizationId) {
        res.status(403).json({ error: "Forbidden: tenant mismatch" });
        return;
      }
    }

    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.userRole = payload.role;
    req.organization_id = payload.organization_id;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
