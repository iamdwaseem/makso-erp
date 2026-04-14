import type { SkuHistoryEntityType } from "@prisma/client";
import prisma from "../lib/prisma.js";

export class SkuHistoryService {
  constructor(private organizationId: string) {}

  async listByEntity(entityType: SkuHistoryEntityType, entityId: string) {
    return (prisma as any).skuHistory.findMany({
      where: {
        organization_id: this.organizationId,
        entity_type: entityType,
        entity_id: entityId,
      },
      orderBy: { created_at: "desc" },
    });
  }
}
