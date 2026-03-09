import { PrismaClient, ScanLog, LedgerAction } from "@prisma/client";
import { ScanInput } from "../validators/scan.validator.js";
import { InventoryRepository } from "./inventory.repository.js";

const prisma = new PrismaClient();
const inventoryRepository = new InventoryRepository();

export class ScanRepository {
  async processScan(data: ScanInput): Promise<ScanLog> {
    return prisma.$transaction(async (tx) => {
      // 1. Find variant by SKU
      const variant = await tx.variant.findUnique({
        where: { sku: data.sku },
      });

      if (!variant) {
        throw new Error("Variant not found for the given SKU");
      }

      // 2 & 3. Adjust inventory & create ledger entry using engine
      await inventoryRepository.adjustInventory(
        {
          variant_id: variant.id,
          action: data.action,
          quantity: data.quantity,
          reference_type: "SCAN",
          reference_id: variant.id, // Using variant.id as a fallback reference if no external document
        },
        tx
      );

      // 4. Create scan log record
      const scanLog = await tx.scanLog.create({
        data: {
          variant_id: variant.id,
          action: data.action as LedgerAction,
          quantity: data.quantity,
          station_id: data.station_id || null,
        },
      });

      return scanLog;
    });
  }
}
