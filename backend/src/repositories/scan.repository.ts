import { PrismaClient, ScanLog, LedgerAction, Prisma } from "@prisma/client";
import { ScanInput } from "../validators/scan.validator.js";
import { InventoryRepository } from "./inventory.repository.js";
import { BaseRepository } from "./BaseRepository.js";

export class ScanRepository extends BaseRepository {
  async processScan(data: ScanInput): Promise<ScanLog> {
    const txFunc = async (tx: Prisma.TransactionClient) => {
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId);

      // 1. Find variant by SKU (scoped by organization)
      const variant = await tx.variant.findFirst({
        where: this.tenantWhere({ sku: data.sku }),
      });

      if (!variant) {
        throw new Error("Variant not found for the given SKU");
      }

      // 2 & 3. Adjust inventory & create ledger entry
      await txInventoryRepo.adjustInventory(
        {
          variant_id: variant.id,
          warehouse_id: data.warehouse_id,
          action: data.action,
          quantity: data.quantity,
          reference_type: "SCAN",
          reference_id: variant.id, 
        },
        tx
      );

      // 4. Create scan log record
      const scanLog = await tx.scanLog.create({
        data: this.tenantData({
          variant_id: variant.id,
          warehouse_id: data.warehouse_id,
          action: data.action as LedgerAction,
          quantity: data.quantity,
          station_id: data.station_id || null,
        }),
      });

      return scanLog;
    };

    if ((this.prisma as any).$transaction) {
      return (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      return txFunc(this.prisma as Prisma.TransactionClient);
    }
  }
}
