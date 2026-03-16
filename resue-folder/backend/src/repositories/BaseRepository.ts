import { PrismaClient, Prisma } from "@prisma/client";

export abstract class BaseRepository {
  protected prisma: PrismaClient | Prisma.TransactionClient;
  protected organizationId: string;
  protected userId?: string;
  protected userRole?: string;
  protected allowedWarehouseIds: string[];

  constructor(
    prisma: PrismaClient | Prisma.TransactionClient,
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    if (!organizationId) {
      throw new Error("Tenant context missing in repository");
    }
    this.prisma = prisma;
    this.organizationId = organizationId;
    this.userId = userId;
    this.userRole = userRole;
    this.allowedWarehouseIds = allowedWarehouseIds;
  }

  protected tenantWhere<T>(where: T): T & { organization_id: string } {
    return {
      ...where,
      organization_id: this.organizationId,
    } as T & { organization_id: string };
  }

  protected warehouseWhere<T>(where: any = {}): T {
    const base = this.tenantWhere(where);

    if (this.userRole === "ADMIN") {
      return base as T;
    }

    return {
      ...base,
      warehouse_id: { in: this.allowedWarehouseIds },
    } as T;
  }

  protected tenantData<T>(data: T): T & { organization_id: string } {
    return {
      ...data,
      organization_id: this.organizationId,
    } as T & { organization_id: string };
  }

  protected getPaginationOptions(page: number = 1, limit: number = 50) {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    return { skip, take };
  }

  protected async paginate<T>(
    model: any,
    where: any,
    page: number = 1,
    limit: number = 50,
    include?: any,
    orderBy?: any
  ) {
    const { skip, take } = this.getPaginationOptions(page, limit);

    const [items, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take,
        include,
        orderBy,
      }),
      model.count({ where }),
    ]);

    return {
      data: items as T[],
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}
