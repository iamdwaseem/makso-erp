import { Prisma } from "@prisma/client";
import type { SkuHistoryEntityType, SkuHistoryReason } from "@prisma/client";

export async function recordSkuHistoryIfChanged(
  db: PrismaClientOrTx,
  params: {
    organization_id: string;
    entity_type: SkuHistoryEntityType;
    entity_id: string;
    old_sku: string;
    new_sku: string;
    reason: SkuHistoryReason;
    changed_by: string | null;
  }
): Promise<void> {
  if (params.old_sku === params.new_sku) return;
  await (db as any).skuHistory.create({
    data: {
      organization_id: params.organization_id,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      old_sku: params.old_sku,
      new_sku: params.new_sku,
      reason: params.reason,
      changed_by: params.changed_by,
    },
  });
  console.info(`SKU changed: ${params.old_sku} → ${params.new_sku} (${params.reason})`);
}

type PrismaClientOrTx = import("@prisma/client").PrismaClient | Prisma.TransactionClient;
