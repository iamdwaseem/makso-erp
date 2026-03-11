import { PrismaClient, Purchase, Prisma } from "@prisma/client";
import { PurchaseInput } from "../validators/purchase.validator.js";
import { InventoryRepository } from "./inventory.repository.js";
import crypto from "crypto";
import { BaseRepository } from "./BaseRepository.js";

function generateInvoiceNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}

export class PurchaseRepository extends BaseRepository {
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
    return this.paginate<Purchase>(
      (this.prisma as any).purchase,
      this.tenantWhere({}),
      page,
      limit,
      {
        supplier: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      { created_at: "desc" }
    );
  }

  async count(): Promise<number> {
    return (this.prisma as any).purchase.count({
      where: this.tenantWhere({}),
    });
  }

  async findById(id: string): Promise<Purchase | null> {
    return (this.prisma as any).purchase.findFirst({
      where: this.tenantWhere({ id }),
      include: {
        supplier: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });
  }

  async createPurchase(data: PurchaseInput): Promise<Purchase> {
    // Note: this.prisma might already be a transaction client if injected as such
    const txFunc = async (tx: Prisma.TransactionClient) => {
      // Create a fresh inventory repo with the transaction client
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds);

      // 1. Create purchase record
      const purchase = await tx.purchase.create({
        data: this.tenantData({
          supplier_id: data.supplier_id,
          invoice_number: generateInvoiceNumber("PUR"),
        }),
      });

      // 2. Create purchase_items
      for (const item of data.items) {
        await tx.purchaseItem.create({
          data: this.tenantData({
            purchase_id: purchase.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          }),
        });

        // 3 & 4. Increase inventory & insert ledger entries
        await txInventoryRepo.adjustInventory(
          {
            variant_id: item.variant_id,
            warehouse_id: data.warehouse_id,
            action: "IN",
            quantity: item.quantity,
            reference_type: "PURCHASE",
            reference_id: purchase.id,
          },
          tx
        );
      }

      // Return fully loaded purchase
      return tx.purchase.findUnique({
        where: { id: purchase.id },
        include: {
          supplier: true,
          items: { include: { variant: { include: { product: true } } } },
        },
      }) as unknown as Purchase;
    };

    if ((this.prisma as any).$transaction) {
      return (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      return txFunc(this.prisma as Prisma.TransactionClient);
    }
  }
}
