import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";

export class UserService {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  async findAll() {
    return (prisma as any).user.findMany({
      where: { organization_id: this.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        warehouses: { include: { warehouse: true } },
      },
      orderBy: { created_at: "desc" },
    });
  }

  async createUser(data: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    organizationId?: string;
  }) {
    const existing = await (prisma as any).user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new Error("User already exists");

    if (!data.password || data.password.trim().length < 8) {
      throw new Error("Password is required and must be at least 8 characters");
    }

    const hashed = await bcrypt.hash(data.password, 12);
    const requestedRole = (data.role || "STAFF") as "ADMIN" | "MANAGER" | "STAFF";

    if (requestedRole === "ADMIN") {
      const existingAdmin = await (prisma as any).user.count({
        where: { organization_id: this.organizationId, role: "ADMIN" },
      });
      if (existingAdmin >= 1) {
        throw new Error("Only one superior admin is allowed per organization");
      }
    }

    return (prisma as any).user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: requestedRole,
        organization_id: this.organizationId,
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await (prisma as any).user.findFirst({
      where: { id: userId, organization_id: this.organizationId },
    });
    if (!user) throw new Error("User not found");
    if (user.role === "ADMIN") {
      const adminCount = await (prisma as any).user.count({
        where: { organization_id: this.organizationId, role: "ADMIN" },
      });
      if (adminCount <= 1) throw new Error("Cannot delete the last admin");
    }
    return (prisma as any).user.delete({ where: { id: userId } });
  }
}
