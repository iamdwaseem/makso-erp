import { PrismaClient, Customer, Prisma } from "@prisma/client";
import { CustomerInput } from "../validators/customer.validator.js";
import { BaseRepository } from "./BaseRepository.js";

export class CustomerRepository extends BaseRepository {
  constructor(
    prisma: PrismaClient | Prisma.TransactionClient, 
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async findAll({ page = 1, limit = 50, search }: { page?: number; limit?: number; search?: string } = {}) {
    let where: any = this.tenantWhere({});
    if (search) {
      where = {
        ...where,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    return this.paginate<Customer>(
      (this.prisma as any).customer,
      where,
      page,
      limit,
      undefined,
      { created_at: "desc" }
    );
  }

  async findById(id: string): Promise<Customer | null> {
    return (this.prisma as any).customer.findFirst({
      where: this.tenantWhere({ id }),
    });
  }

  async create(data: CustomerInput): Promise<Customer> {
    return (this.prisma as any).customer.create({
      data: this.tenantData({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
      }),
    });
  }

  async update(id: string, data: Partial<CustomerInput>): Promise<Customer> {
    return (this.prisma as any).customer.update({
      where: this.tenantWhere({ id }),
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || undefined,
      },
    });
  }

  async delete(id: string): Promise<Customer> {
    return (this.prisma as any).customer.delete({
      where: this.tenantWhere({ id }),
    });
  }
}
