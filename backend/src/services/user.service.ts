import { PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";

export class UserService {
  private prisma: PrismaClient;
  private organizationId: string;

  constructor(organizationId: string) {
    this.prisma = prisma as any;
    this.organizationId = organizationId;
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { organization_id: this.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        warehouses: {
          include: { warehouse: true }
        }
      },
      orderBy: { created_at: "desc" }
    });
  }

  async createUser(data: { name: string; email: string; password?: string; role: any }, callerRole?: "ADMIN" | "MANAGER" | "STAFF") {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error("User already exists");
    }

    if (!data.password || data.password.trim().length < 8) {
      throw new Error("Password is required and must be at least 8 characters");
    }

    const password = data.password;
    const hashed = await bcrypt.hash(password, 12);

    const requestedRole = (data.role || "STAFF") as "ADMIN" | "MANAGER" | "STAFF";
    if (callerRole === "MANAGER" && requestedRole !== "STAFF") {
      throw new Error("Managers can only create users with the Staff role");
    }
    if (requestedRole === "ADMIN") {
      const existingAdmin = await this.prisma.user.count({
        where: { organization_id: this.organizationId, role: "ADMIN" }
      });
      if (existingAdmin >= 1) {
        throw new Error("Only one superior admin is allowed per organization");
      }
    }

    return (this.prisma as any).user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: requestedRole,
        organization_id: this.organizationId
      }
    });
  }

  async deleteUser(userId: string, callerRole?: "ADMIN" | "MANAGER" | "STAFF") {
      // Security check: must belong to the same organization
      const user = await this.prisma.user.findFirst({
          where: { id: userId, organization_id: this.organizationId },
          select: { id: true, role: true }
      });

      if (!user) throw new Error("User not found");
      if (callerRole === "MANAGER" && user.role !== "STAFF") {
        throw new Error("Managers can only delete users with the Staff role");
      }
      if (user.role === "ADMIN") {
          // Count admins in this org
          const adminCount = await this.prisma.user.count({
              where: { organization_id: this.organizationId, role: "ADMIN" }
          });
          if (adminCount <= 1) throw new Error("Cannot delete the last admin");
      }

      return this.prisma.user.delete({ where: { id: userId } });
  }

  async getUserWarehouses(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organization_id: this.organizationId },
      select: { id: true, role: true }
    });
    if (!user) {
      throw new Error("User not found");
    }

    const assignments = await (this.prisma as any).userWarehouse.findMany({
      where: {
        user_id: userId,
        warehouse: { organization_id: this.organizationId }
      },
      include: { warehouse: true }
    });
    return assignments.map((a: any) => a.warehouse);
  }

  async assignWarehouse(userId: string, warehouseId: string, callerRole?: "ADMIN" | "MANAGER" | "STAFF") {
    const [user, warehouse] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: userId, organization_id: this.organizationId },
        select: { id: true, role: true }
      }),
      (this.prisma as any).warehouse.findFirst({
        where: { id: warehouseId, organization_id: this.organizationId },
        select: { id: true }
      })
    ]);

    if (!user || !warehouse) {
      throw new Error("User or warehouse not found");
    }
    if (callerRole === "MANAGER" && user.role !== "STAFF") {
      throw new Error("Managers can only assign warehouses to users with the Staff role");
    }

    return (this.prisma as any).userWarehouse.upsert({
      where: {
        user_id_warehouse_id: {
          user_id: userId,
          warehouse_id: warehouseId
        }
      },
      update: {},
      create: {
        user_id: userId,
        warehouse_id: warehouseId
      }
    });
  }

  async unassignWarehouse(userId: string, warehouseId: string, callerRole?: "ADMIN" | "MANAGER" | "STAFF") {
    const [user, warehouse] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: userId, organization_id: this.organizationId },
        select: { id: true, role: true }
      }),
      (this.prisma as any).warehouse.findFirst({
        where: { id: warehouseId, organization_id: this.organizationId },
        select: { id: true }
      })
    ]);

    if (!user || !warehouse) {
      throw new Error("User or warehouse not found");
    }
    if (callerRole === "MANAGER" && user.role !== "STAFF") {
      throw new Error("Managers can only unassign warehouses from users with the Staff role");
    }

    return (this.prisma as any).userWarehouse.delete({
      where: {
        user_id_warehouse_id: {
          user_id: userId,
          warehouse_id: warehouseId
        }
      }
    });
  }

  async updateUser(
    userId: string,
    data: Partial<{ name: string; email: string; role: "ADMIN" | "MANAGER" | "STAFF" }>,
    caller: { id?: string; role?: "ADMIN" | "MANAGER" | "STAFF" }
  ) {
    const target = await this.prisma.user.findFirst({
      where: { id: userId, organization_id: this.organizationId },
      select: { id: true, role: true, email: true },
    });
    if (!target) throw new Error("User not found");

    const callerId = caller.id;
    const callerRole = caller.role;

    const isSelf = !!callerId && callerId === userId;
    const isAdmin = callerRole === "ADMIN";
    const isManager = callerRole === "MANAGER";

    if (!isSelf && !isAdmin && !isManager) {
      throw new Error("Forbidden");
    }

    if (isManager && target.role !== "STAFF") {
      throw new Error("Managers can only edit Staff users");
    }

    const patch: any = {};

    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) throw new Error("Name is required");
      patch.name = name;
    }

    if (data.email !== undefined) {
      const email = String(data.email).trim().toLowerCase();
      if (!email || !email.includes("@")) throw new Error("Invalid email address");

      const existing = await this.prisma.user.findFirst({
        where: {
          organization_id: this.organizationId,
          email: { equals: email, mode: "insensitive" },
          id: { not: userId },
        },
        select: { id: true },
      });
      if (existing) throw new Error("Email already in use");

      // Self can update email; managers/admin can update email too.
      patch.email = email;
    }

    if (data.role !== undefined) {
      if (!isAdmin) throw new Error("Only admins can change roles");
      patch.role = data.role;
    }

    if (Object.keys(patch).length === 0) {
      throw new Error("No changes requested");
    }

    return (this.prisma as any).user.update({
      where: { id: userId },
      data: patch,
      select: { id: true, name: true, email: true, role: true, created_at: true },
    });
  }

  async resetPassword(
    userId: string,
    newPassword: string,
    caller: { id?: string; role?: "ADMIN" | "MANAGER" | "STAFF" }
  ) {
    const target = await this.prisma.user.findFirst({
      where: { id: userId, organization_id: this.organizationId },
      select: { id: true, role: true },
    });
    if (!target) throw new Error("User not found");

    const callerId = caller.id;
    const callerRole = caller.role;
    const isSelf = !!callerId && callerId === userId;
    const isAdmin = callerRole === "ADMIN";
    const isManager = callerRole === "MANAGER";

    if (!isSelf && !isAdmin && !isManager) {
      throw new Error("Forbidden");
    }
    if (isManager && target.role !== "STAFF") {
      throw new Error("Managers can only reset passwords for Staff users");
    }

    const pwd = String(newPassword || "");
    if (pwd.trim().length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const hashed = await bcrypt.hash(pwd, 12);
    await (this.prisma as any).user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    return { ok: true };
  }
}
