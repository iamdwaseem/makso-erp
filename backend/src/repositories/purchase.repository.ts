import { PrismaClient, Purchase, PurchaseItem } from "@prisma/client";
import { PurchaseInput } from "../validators/purchase.validator.js";
import { InventoryRepository } from "./inventory.repository.js";
import crypto from "crypto";

const prisma = new PrismaClient();

function generateInvoiceNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}
const inventoryRepository = new InventoryRepository();

export class PurchaseRepository {
  async findAll({ limit = 100, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<Purchase[]> {
    return prisma.purchase.findMany({
      include: {
        supplier: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    });
  }

  async count(): Promise<number> {
    return prisma.purchase.count();
  }

  async findById(id: string): Promise<Purchase | null> {
    return prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });
  }

  async createPurchase(data: PurchaseInput): Promise<Purchase> {
    return prisma.$transaction(async (tx) => {
      // 1. Create purchase record
      const purchase = await tx.purchase.create({
        data: {
          supplier_id: data.supplier_id,
          invoice_number: generateInvoiceNumber("PUR"),
        },
      });

      // 2. Create purchase_items
      for (const item of data.items) {
        await tx.purchaseItem.create({
          data: {
            purchase_id: purchase.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          },
        });

        // 3 & 4. Increase inventory & insert ledger entries (using the existing engine logic synced via tx)
        await inventoryRepository.adjustInventory(
          {
            variant_id: item.variant_id,
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
    });
  }
}
