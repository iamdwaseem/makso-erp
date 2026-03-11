import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnv } from "../config/env.js";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  organization_id?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // Allow OPTIONS preflight requests to pass through
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const { JWT_SECRET: secret } = getEnv();
    const payload = jwt.verify(token, secret) as { userId: string; email: string; role: string; organization_id?: string };

    const tenantOrganizationId = (req as any).tenant?.organizationId as string | undefined;
    if (tenantOrganizationId) {
      if (!payload.organization_id) {
        res.status(401).json({ error: "Unauthorized: token missing organization context" });
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
