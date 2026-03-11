import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware.js";
import { UserRole } from "@prisma/client";

/**
 * Middleware to restrict access to specific roles.
 */
export function authorizeRole(...allowedRoles: UserRole[]) {
  return (req: any, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const userRole = authReq.userRole as UserRole;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: "Forbidden: You do not have the required role to access this resource" 
      });
    }

    next();
  };
}
