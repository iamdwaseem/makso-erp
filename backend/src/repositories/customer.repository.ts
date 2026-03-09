import { PrismaClient, Customer } from "@prisma/client";
import { CustomerInput } from "../validators/customer.validator.js";

const prisma = new PrismaClient();

export class CustomerRepository {
  async findAll(): Promise<Customer[]> {
    return prisma.customer.findMany({
      orderBy: { created_at: "desc" },
    });
  }

  async findById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { id },
    });
  }

  async create(data: CustomerInput): Promise<Customer> {
    return prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
      },
    });
  }

  async update(id: string, data: Partial<CustomerInput>): Promise<Customer> {
    return prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
      },
    });
  }

  async delete(id: string): Promise<Customer> {
    return prisma.customer.delete({
      where: { id },
    });
  }
}
