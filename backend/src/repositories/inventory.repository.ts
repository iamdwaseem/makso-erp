import { PrismaClient, Inventory, InventoryLedger, LedgerAction } from "@prisma/client";
import { AdjustInventoryInput } from "../validators/inventory.validator.js";

const prisma = new PrismaClient();

export class InventoryRepository {
  async findAll() {
    const records = await prisma.inventory.findMany({
      include: { variant: { include: { product: true } } },
    });

    // For each variant, fetch the most recent purchase to get supplier info
    const enriched = await Promise.all(
      records.map(async (inv) => {
        const lastPurchaseItem = await prisma.purchaseItem.findFirst({
          where: { variant_id: inv.variant_id },
          orderBy: { purchase: { created_at: "desc" } },
          include: { purchase: { include: { supplier: true } } },
        });
        return {
          ...inv,
          supplier: lastPurchaseItem?.purchase?.supplier || null,
        };
      })
    );

    return enriched;
  }

  async findByVariantId(variantId: string): Promise<Inventory | null> {
    return prisma.inventory.findUnique({
      where: { variant_id: variantId },
      include: { variant: true },
    });
  }

  async adjustInventory(data: AdjustInventoryInput, txClient?: any): Promise<{ inventory: Inventory, ledger: InventoryLedger }> {
    const execute = async (tx: any) => {
      // Find existing inventory or create one with 0 quantity
      let inventory = await tx.inventory.findUnique({
        where: { variant_id: data.variant_id },
      });

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            variant_id: data.variant_id,
            quantity: 0,
          },
        });
      }

      // Calculate new quantity length
      let newQuantity = inventory.quantity;
      if (data.action === "IN") {
        newQuantity += data.quantity;
      } else if (data.action === "OUT") {
        newQuantity -= data.quantity;
        if (newQuantity < 0) {
          throw new Error("Insufficient inventory");
        }
      }

      // Update inventory
      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQuantity },
      });

      // Create ledger record
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
}
