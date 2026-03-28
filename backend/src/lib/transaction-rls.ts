import { getTenantContext } from "./context.js";

/** Apply org + warehouse RLS session vars on a raw transaction client (matches extended prisma behavior). */
export async function applyRlsSessionToTx(tx: any): Promise<void> {
  const ctx = getTenantContext();
  if (!ctx?.organizationId) return;
  await tx.$executeRawUnsafe(`SET LOCAL app.organization_id = '${ctx.organizationId}'`);
  await tx.$executeRawUnsafe(`SET LOCAL app.allowed_warehouse_ids = '${ctx.allowedWarehouseIds?.join(",") || ""}'`);
}
