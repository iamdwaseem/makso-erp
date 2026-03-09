import { PrismaClient, Sale, SaleItem } from "@prisma/client";
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
  async findAll() {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      orderBy: { created_at: "desc" },
    });

    // For each sale item, find the most recent supplier of that variant
    const enriched = await Promise.all(
      sales.map(async (sale) => {
        const itemsWithSuppliers = await Promise.all(
          sale.items.map(async (item) => {
            const lastPurchaseItem = await prisma.purchaseItem.findFirst({
              where: { variant_id: item.variant_id },
              orderBy: { purchase: { created_at: "desc" } },
              include: { purchase: { include: { supplier: true } } },
            });
            return {
              ...item,
              supplier: lastPurchaseItem?.purchase?.supplier || null,
            };
          })
        );
        return {
          ...sale,
          items: itemsWithSuppliers,
        };
      })
    );

    return enriched;
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

    const itemsWithSuppliers = await Promise.all(
      sale.items.map(async (item) => {
        const lastPurchaseItem = await prisma.purchaseItem.findFirst({
          where: { variant_id: item.variant_id },
          orderBy: { purchase: { created_at: "desc" } },
          include: { purchase: { include: { supplier: true } } },
        });
        return {
          ...item,
          supplier: lastPurchaseItem?.purchase?.supplier || null,
        };
      })
    );

    return {
      ...sale,
      items: itemsWithSuppliers,
    };
  }

  async createSale(data: SaleInput): Promise<Sale> {
    return prisma.$transaction(async (tx) => {
      // 1. Create sale record
      const sale = await tx.sale.create({
        data: {
          customer_id: data.customer_id,
          invoice_number: generateInvoiceNumber("SAL"),
        },
      });

      // 2. Create sale_items
      for (const item of data.items) {
        await tx.saleItem.create({
          data: {
            sale_id: sale.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          },
        });

        // 3 & 4. Decrease inventory & insert ledger entries (using the existing engine logic synced via tx)
        await inventoryRepository.adjustInventory(
          {
            variant_id: item.variant_id,
            action: "OUT",
            quantity: item.quantity,
            reference_type: "SALE",
            reference_id: sale.id,
          },
          tx
        );
      }

      // Return fully loaded sale
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
