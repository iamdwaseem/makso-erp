import { PrismaClient, Supplier } from "@prisma/client";
import { SupplierInput } from "../validators/supplier.validator.js";

const prisma = new PrismaClient();

export class SupplierRepository {
  async findAll(): Promise<Supplier[]> {
    return prisma.supplier.findMany({
      orderBy: { created_at: "desc" },
    });
  }

  async findById(id: string): Promise<Supplier | null> {
    return prisma.supplier.findUnique({
      where: { id },
    });
  }

  async create(data: SupplierInput): Promise<Supplier> {
    return prisma.supplier.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
      },
    });
  }

  async update(id: string, data: Partial<SupplierInput>): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
      },
    });
  }

  async delete(id: string): Promise<Supplier> {
    return prisma.supplier.delete({
      where: { id },
    });
  }
}
