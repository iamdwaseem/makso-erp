import { PrismaClient, Sale } from "@prisma/client";
import { SaleInput } from "../validators/sale.validator.js";
import { InventoryRepository } from "./inventory.repository.js";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateInvoiceNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}
const inventoryRepository = new InventoryRepository();

export class SaleRepository {
  /**
   * Eliminated N+1: previously did one purchaseItem query per sale item.
   * Now does 2 queries total + one O(n) map build.
   */
  async findAll({ limit = 100, offset = 0 }: { limit?: number; offset?: number } = {}) {
    const [sales, allPurchaseItems] = await Promise.all([
      prisma.sale.findMany({
        include: {
          customer: true,
          items: { include: { variant: { include: { product: true } } } },
        },
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
      }),
      // Fetch all purchaseItems once to resolve supplier per variant
      prisma.purchaseItem.findMany({
        include: { purchase: { include: { supplier: true } } },
        orderBy: { purchase: { created_at: "desc" } },
      }),
    ]);

    // variant_id → latest supplier (first occurrence = most recent)
    const supplierByVariant = new Map<string, any>();
    for (const item of allPurchaseItems) {
      if (!supplierByVariant.has(item.variant_id)) {
        supplierByVariant.set(item.variant_id, item.purchase?.supplier ?? null);
      }
    }

    return sales.map(sale => ({
      ...sale,
      items: sale.items.map(item => ({
        ...item,
        supplier: supplierByVariant.get(item.variant_id) ?? null,
      })),
    }));
  }

  async count(): Promise<number> {
    return prisma.sale.count();
  }

  async findById(id: string): Promise<any | null> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });
    if (!sale) return null;

    // For single-item view, the extra query is negligible
    const allPurchaseItems = await prisma.purchaseItem.findMany({
      where: { variant_id: { in: sale.items.map(i => i.variant_id) } },
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
      items: sale.items.map(item => ({
        ...item,
        supplier: supplierByVariant.get(item.variant_id) ?? null,
      })),
    };
  }

  async createSale(data: SaleInput): Promise<Sale> {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          customer_id: data.customer_id,
          invoice_number: generateInvoiceNumber("SAL"),
        },
      });

      for (const item of data.items) {
        await tx.saleItem.create({
          data: { sale_id: sale.id, variant_id: item.variant_id, quantity: item.quantity },
        });
        await inventoryRepository.adjustInventory(
          { variant_id: item.variant_id, action: "OUT", quantity: item.quantity, reference_type: "SALE", reference_id: sale.id },
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
    });
  }
}
