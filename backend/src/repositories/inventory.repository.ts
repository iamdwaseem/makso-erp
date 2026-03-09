import { PrismaClient, Inventory, InventoryLedger, LedgerAction } from "@prisma/client";
import { AdjustInventoryInput } from "../validators/inventory.validator.js";

const prisma = new PrismaClient();

export class InventoryRepository {
  /**
   * Eliminated N+1: was doing one purchaseItem query per inventory row.
   * Now: 2 queries total — fetch all inventory, fetch all purchaseItems ordered
   * by date desc, then pick the first (= latest) per variant client-side.
   */
  async findAll({ limit = 500, offset = 0 }: { limit?: number; offset?: number } = {}) {
    const [records, allPurchaseItems] = await Promise.all([
      prisma.inventory.findMany({
        include: { variant: { include: { product: true } } },
        skip: offset,
        take: limit,
      }),
      prisma.purchaseItem.findMany({
        include: { purchase: { include: { supplier: true } } },
        orderBy: { purchase: { created_at: "desc" } },
      }),
    ]);

    // Build variant_id → latest supplier map in a single O(n) pass
    const supplierByVariant = new Map<string, any>();
    for (const item of allPurchaseItems) {
      if (!supplierByVariant.has(item.variant_id)) {
        supplierByVariant.set(item.variant_id, item.purchase?.supplier ?? null);
      }
    }

    return records.map(inv => ({
      ...inv,
      supplier: supplierByVariant.get(inv.variant_id) ?? null,
    }));
  }

  async findByVariantId(variantId: string): Promise<Inventory | null> {
    return prisma.inventory.findUnique({
      where: { variant_id: variantId },
      include: { variant: true },
    });
  }

  async adjustInventory(
    data: AdjustInventoryInput,
    txClient?: any,
  ): Promise<{ inventory: Inventory; ledger: InventoryLedger }> {
    const execute = async (tx: any) => {
      let inventory = await tx.inventory.findUnique({
        where: { variant_id: data.variant_id },
      });

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: { variant_id: data.variant_id, quantity: 0 },
        });
      }

      let newQuantity = inventory.quantity;
      if (data.action === "IN") {
        newQuantity += data.quantity;
      } else if (data.action === "OUT") {
        newQuantity -= data.quantity;
        if (newQuantity < 0) throw new Error("Insufficient inventory");
      }

      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQuantity },
      });

      const ledgerRecord = await tx.inventoryLedger.create({
        data: {
          variant_id: data.variant_id,
          action: data.action as LedgerAction,
          quantity: data.quantity,
          reference_type: data.reference_type,
          reference_id: data.reference_id,
        },
      });

      return { inventory: updatedInventory, ledger: ledgerRecord };
    };

    return txClient ? execute(txClient) : prisma.$transaction(execute);
  }

  async getLedgerByVariantId(variantId: string): Promise<InventoryLedger[]> {
    return prisma.inventoryLedger.findMany({
      where: { variant_id: variantId },
      orderBy: { created_at: "desc" },
    });
  }

  async count(): Promise<number> {
    return prisma.inventory.count();
  }
}
