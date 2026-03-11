import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { toCamelCase } from "../utils/mapper.js";
import { getEnv } from "../config/env.js";

const prisma = new PrismaClient();

const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function generateToken(userId: string, email: string, role: string, organization_id?: string | null): string {
  const { JWT_SECRET: secret, JWT_EXPIRES_IN: expiresIn } = getEnv();
  return jwt.sign({ userId, email, role, organization_id }, secret, { expiresIn } as jwt.SignOptions);
}

export class AuthController {
  async register(req: Request, res: Response) {
    const env = getEnv();
    const allowPublicRegistration =
      env.ALLOW_PUBLIC_REGISTRATION === "true" || env.NODE_ENV !== "production";
    if (!allowPublicRegistration) {
      res.status(403).json({ error: "Public registration is disabled" });
      return;
    }

    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    
    // Multi-tenant bootstrap:
    // - first-ever account can initialize default org as ADMIN
    // - subsequent self-registrations are STAFF in the first org
    let org = await prisma.organization.findFirst();
    let role: "ADMIN" | "STAFF" = "STAFF";
    if (!org) {
      org = await (prisma as any).organization.create({
        data: { name: "Default Org", slug: "default" }
      });
      role = "ADMIN";
    } else {
      const userCount = await (prisma as any).user.count({
        where: { organization_id: org.id }
      });
      if (userCount === 0) {
        role = "ADMIN";
      }
    }

    const user = await (prisma as any).user.create({
      data: { 
        name, 
        email, 
        password: hashed, 
        role,
        organization_id: org?.id
      },
    });

    const token = generateToken(user.id, user.email, user.role, user.organization_id);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, organization_id: user.organization_id },
    });
  }

  async login(req: Request, res: Response) {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { email, password } = parsed.data;

    const user = await (prisma as any).user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken(user.id, user.email, user.role, user.organization_id);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, organization_id: user.organization_id },
    });
  }

  async me(req: Request & { userId?: string }, res: Response) {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        organization_id: true,
        created_at: true 
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(toCamelCase(user));
  }
}
