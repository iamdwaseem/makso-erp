import { PrismaClient, Sale, Prisma } from "@prisma/client";
import { SaleInput } from "../validators/sale.validator.js";
import { InventoryRepository } from "./inventory.repository.js";
import crypto from "crypto";
import { BaseRepository } from "./BaseRepository.js";

function generateInvoiceNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}

export class SaleRepository extends BaseRepository {
  private inventoryRepo: InventoryRepository;

  constructor(
    prisma: PrismaClient | Prisma.TransactionClient, 
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
    this.inventoryRepo = new InventoryRepository(this.prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async findAll({ page = 1, limit = 50 }: { page?: number; limit?: number } = {}) {
    const paginated = await this.paginate<any>(
      (this.prisma as any).sale,
      this.tenantWhere({}),
      page,
      limit,
      {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      { created_at: "desc" }
    );

    const sales = paginated.data;
    const variantIds = Array.from(new Set(sales.flatMap((s: any) => s.items.map((i: any) => i.variant_id))));

    const relevantPurchaseItems = await (this.prisma as any).purchaseItem.findMany({
      where: this.tenantWhere({ variant_id: { in: variantIds } }),
      include: { purchase: { include: { supplier: true } } },
      orderBy: { purchase: { created_at: "desc" } },
    });

    const supplierByVariant = new Map<string, any>();
    for (const item of relevantPurchaseItems) {
      if (!supplierByVariant.has(item.variant_id)) {
        supplierByVariant.set(item.variant_id, item.purchase?.supplier ?? null);
      }
    }

    return {
      ...paginated,
      data: sales.map((sale: any) => ({
        ...sale,
        items: sale.items.map((item: any) => ({
          ...item,
          supplier: supplierByVariant.get(item.variant_id) ?? null,
        })),
      }))
    };
  }

  async count(): Promise<number> {
    return (this.prisma as any).sale.count({
      where: this.tenantWhere({}),
    });
  }

  async findById(id: string): Promise<any | null> {
    const sale = await (this.prisma as any).sale.findFirst({
      where: this.tenantWhere({ id }),
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });
    if (!sale) return null;

    const allPurchaseItems = await (this.prisma as any).purchaseItem.findMany({
      where: this.tenantWhere({ variant_id: { in: sale.items.map((i: any) => i.variant_id) } }),
      include: { purchase: { include: { supplier: true } } },
      orderBy: { purchase: { created_at: "desc" } },
    });

    const supplierByVariant = new Map<string, any>();
    for (const item of allPurchaseItems) {
      if (!supplierByVariant.has(item.variant_id)) {
        supplierByVariant.set(item.variant_id, item.purchase?.supplier ?? null);
      }
    }

    return {
      ...sale,
      items: sale.items.map((item: any) => ({
        ...item,
        supplier: supplierByVariant.get(item.variant_id) ?? null,
      })),
    };
  }

  async createSale(data: SaleInput): Promise<Sale> {
    const txFunc = async (tx: Prisma.TransactionClient) => {
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds);
      
      const sale = await tx.sale.create({
        data: this.tenantData({
          customer_id: data.customer_id,
          invoice_number: generateInvoiceNumber("SAL"),
        }),
      });

      for (const item of data.items) {
        await tx.saleItem.create({
          data: this.tenantData({ sale_id: sale.id, variant_id: item.variant_id, quantity: item.quantity }),
        });
        await txInventoryRepo.adjustInventory(
          {
            variant_id: item.variant_id,
            warehouse_id: data.warehouse_id,
            action: "OUT",
            quantity: item.quantity,
            reference_type: "SALE",
            reference_id: sale.id
          },
          tx,
        );
      }

      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: true,
          items: { include: { variant: { include: { product: true } } } },
        },
      }) as unknown as Sale;
    };

    if ((this.prisma as any).$transaction) {
      return (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      return txFunc(this.prisma as Prisma.TransactionClient);
    }
  }
}
