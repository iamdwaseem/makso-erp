import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { basePrisma } from "../lib/prisma.js";
import { getEnv } from "../config/env.js";
import { toCamelCase } from "../utils/mapper.js";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function generateToken(
  userId: string,
  email: string,
  role: string,
  organizationId?: string | null,
  organizationSlug?: string | null
): string {
  const { JWT_SECRET: secret, JWT_EXPIRES_IN: expiresIn } = getEnv();
  const payload: Record<string, string> = {
    userId,
    email,
    role,
  };
  if (organizationId) payload.organization_id = organizationId;
  if (organizationSlug) payload.organization_slug = organizationSlug;
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export class AuthController {
  async login(req: Request, res: Response) {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { email, password } = parsed.data;

    const user = await basePrisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { organization: true },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const organizationId = user.organization_id ?? undefined;
    const organizationSlug = user.organization?.slug ?? undefined;
    const token = generateToken(
      user.id,
      user.email,
      user.role,
      organizationId,
      organizationSlug
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: organizationId ?? null,
        organizationSlug: organizationSlug ?? null,
      },
    });
  }

  async me(req: Request & { userId?: string }, res: Response) {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await basePrisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization_id: true,
        created_at: true,
        organization: { select: { id: true, slug: true, name: true } },
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const out = {
      ...user,
      organizationId: user.organization_id,
      organizationSlug: user.organization?.slug,
      organizationName: user.organization?.name,
    };
    return res.json(toCamelCase(out));
  }
}
