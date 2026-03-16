import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { basePrisma } from "../lib/prisma.js";
import { tenantStorage } from "../lib/context.js";

export interface TenantRequest extends Request {
  tenant?: {
    organizationId: string;
    slug: string;
  };
  userId?: string;
  userEmail?: string;
}

export async function resolveTenant(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  if (req.method === "OPTIONS") {
    return next();
  }

  let slug: string | undefined;
  let idFromJwt: string | undefined;

  const hostname = req.hostname;
  const parts = hostname.split(".");
  const isIpv4Address = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  const isLocalhost = hostname === "localhost";
  if (!isIpv4Address && !isLocalhost && parts.length >= 2) {
    const firstPart = parts[0].toLowerCase();
    if (
      firstPart !== "www" &&
      firstPart !== "api" &&
      firstPart !== "localhost"
    ) {
      slug = firstPart;
    }
  }

  const headerSlug = req.headers["x-organization-slug"];
  if (headerSlug && typeof headerSlug === "string") {
    slug = headerSlug.toLowerCase();
  }

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
    } catch {
      // ignore
    }
  }

  // In development, when no tenant context is provided, use first org from DB so dashboard works without x-organization-slug.
  if (!slug && !idFromJwt) {
    if (process.env.NODE_ENV === "development") {
      try {
        const rows =
          await basePrisma.$queryRawUnsafe<{ id: string; slug: string }[]>(
            'SELECT id, slug FROM organizations ORDER BY "createdAt" ASC LIMIT 1'
          );
        const firstOrg = rows?.[0];
        if (firstOrg) {
          req.tenant = { organizationId: firstOrg.id, slug: firstOrg.slug };
          return tenantStorage.run({ organizationId: firstOrg.id }, () =>
            next()
          );
        }
      } catch (e) {
        console.error("[resolveTenant] Dev first-org fallback failed:", e);
      }
      req.tenant = { organizationId: "dev-org", slug: "dev-org" };
      return tenantStorage.run({ organizationId: "dev-org" }, () => next());
    }
    const isDevNoAuth =
      process.env.NODE_ENV === "development" &&
      process.env.SKIP_AUTH === "true";
    if (isDevNoAuth) {
      try {
        const rows =
          await basePrisma.$queryRawUnsafe<{ id: string; slug: string }[]>(
            'SELECT id, slug FROM organizations ORDER BY "createdAt" ASC LIMIT 1'
          );
        const firstOrg = rows?.[0];
        if (firstOrg) {
          req.tenant = { organizationId: firstOrg.id, slug: firstOrg.slug };
          return tenantStorage.run({ organizationId: firstOrg.id }, () =>
            next()
          );
        }
      } catch (e) {
        console.error("[resolveTenant] Dev fallback failed:", e);
      }
    }
    res.status(400).json({ error: "Organization context missing" });
    return;
  }

  try {
    let orgBySlug = null;
    let orgById = null;

    if (slug) {
      orgBySlug = await (prisma as any).organization.findUnique({
        where: { slug },
      });
    }
    if (idFromJwt) {
      orgById = await (prisma as any).organization.findUnique({
        where: { id: idFromJwt },
      });
    }

    if (orgBySlug && orgById && orgBySlug.id !== orgById.id) {
      res.status(403).json({ error: "Forbidden: organization context mismatch" });
      return;
    }

    const org = orgById || orgBySlug;

    if (!org) {
      if (idFromJwt) {
        res
          .status(401)
          .json({ error: "Session invalid: Organization no longer exists" });
      } else {
        res.status(404).json({ error: "Organization not found" });
      }
      return;
    }

    req.tenant = {
      organizationId: org.id,
      slug: org.slug,
    };

    return tenantStorage.run({ organizationId: org.id }, () => {
      next();
    });
  } catch (error: any) {
    console.error("Tenant resolution error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during tenant resolution" });
  }
}
