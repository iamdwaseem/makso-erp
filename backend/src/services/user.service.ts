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

  async createUser(data: { name: string; email: string; password?: string; role: any }) {
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

  async deleteUser(userId: string) {
      // Security check: must belong to the same organization
      const user = await this.prisma.user.findFirst({
          where: { id: userId, organization_id: this.organizationId }
      });

      if (!user) throw new Error("User not found");
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

  async assignWarehouse(userId: string, warehouseId: string) {
    const [user, warehouse] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: userId, organization_id: this.organizationId },
        select: { id: true }
      }),
      (this.prisma as any).warehouse.findFirst({
        where: { id: warehouseId, organization_id: this.organizationId },
        select: { id: true }
      })
    ]);

    if (!user || !warehouse) {
      throw new Error("User or warehouse not found");
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

  async unassignWarehouse(userId: string, warehouseId: string) {
    const [user, warehouse] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: userId, organization_id: this.organizationId },
        select: { id: true }
      }),
      (this.prisma as any).warehouse.findFirst({
        where: { id: warehouseId, organization_id: this.organizationId },
        select: { id: true }
      })
    ]);

    if (!user || !warehouse) {
      throw new Error("User or warehouse not found");
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
}
