import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { tenantStorage } from "../lib/context.js";

export interface TenantRequest extends Request {
  tenant?: {
    organizationId: string;
    slug: string;
  };
  userId?: string;
  userEmail?: string;
}

/**
 * Middleware to resolve the active tenant (Organization) for the request.
 * 
 * Resolution Priority:
 * 1. Subdomain (e.g., acme.wareflow.com)
 * 2. Custom Header: x-organization-slug
 * 3. JWT Payload: organization_id / organization_slug
 */
export async function resolveTenant(req: TenantRequest, res: Response, next: NextFunction) {
  // Allow OPTIONS preflight requests to pass through
  if (req.method === "OPTIONS") {
    return next();
  }

  let slug: string | undefined;
  let idFromJwt: string | undefined;

  // 1. Resolve from Subdomain
  const hostname = req.hostname;
  const parts = hostname.split(".");
  const isIpv4Address = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  const isLocalhost = hostname === "localhost";
  // local: acme.localhost -> parts=["acme", "localhost"]
  // prod: acme.wareflow.com -> parts=["acme", "wareflow", "com"]
  if (!isIpv4Address && !isLocalhost && parts.length >= 2) {
    const firstPart = parts[0].toLowerCase();
    if (firstPart !== "www" && firstPart !== "api" && firstPart !== "localhost") {
      slug = firstPart;
    }
  }

  // 2. Resolve from Header (Priority 2)
  const headerSlug = req.headers["x-organization-slug"];
  if (headerSlug && typeof headerSlug === "string") {
    slug = headerSlug.toLowerCase();
  }

  // 3. Resolve from JWT (Priority 3)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded) {
        if (decoded.organization_slug) {
          slug = slug || decoded.organization_slug;
        }
        if (decoded.organization_id) {
          idFromJwt = decoded.organization_id;
        }
      }
    } catch (e) {
      // Decode errors ignored; authentication middleware handles verification
    }
  }

  // If no slug or id found, and not a public path, fail.
  // We keep it strict: every request needs a tenant context.
  if (!slug && !idFromJwt) {
    // Skip resolution for base path or documentation if any, but ERP is usually strict
    // For now, let's allow it if it's explicitly public (e.g. login/register)
    // Actually, even login might need a tenant if we want to isolate logins.
    // If the system is "Global Login" -> "Select Org", then first step is public.
    // If the system is "Tenant Login", then it needs slug.
    
    // Let's stick to the requirement: "If tenant cannot be resolved return HTTP 400"
    res.status(400).json({ error: "Organization context missing" });
    return;
  }

  try {
    let orgBySlug = null;
    let orgById = null;

    if (slug) {
      orgBySlug = await (prisma as any).organization.findUnique({
        where: { slug }
      });
    }
    if (idFromJwt) {
      orgById = await (prisma as any).organization.findUnique({
        where: { id: idFromJwt }
      });
    }

    if (orgBySlug && orgById && orgBySlug.id !== orgById.id) {
      res.status(403).json({ error: "Forbidden: organization context mismatch" });
      return;
    }

    // Trust verified identity context first when present.
    const org = orgById || orgBySlug;

    if (!org) {
      // If we had a JWT but the organization it refers to is gone (e.g. after a re-seed),
      // return 401 so the frontend clears the stale session and redirects to login.
      if (idFromJwt) {
        res.status(401).json({ error: "Session invalid: Organization no longer exists" });
      } else {
        res.status(404).json({ error: "Organization not found" });
      }
      return;
    }

    req.tenant = {
      organizationId: org.id,
      slug: org.slug
    };

    // Persist tenant context for the remainder of this request.
    // Using enterWith avoids losing AsyncLocalStorage context across Express middleware boundaries.
    tenantStorage.enterWith({ organizationId: org.id, allowedWarehouseIds: [] });
    return next();
  } catch (error: any) {
    console.error("Tenant resolution error:", error);
    res.status(500).json({ error: "Internal server error during tenant resolution" });
  }
}
