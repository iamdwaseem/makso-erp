import type { Response, NextFunction } from "express";
import type { PermissionCodeValue } from "../core/access/access.types.js";
import { requirePermission as requirePermissionEngine } from "../core/access/access-engine.js";
import type { AuthRequest } from "./auth.middleware.js";

export function requirePermission(permission: PermissionCodeValue) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const role = req.userRole;
      requirePermissionEngine({ role: role ?? "" }, permission);
      next();
    } catch {
      return res.status(403).json({ error: "Forbidden" });
    }
  };
}
