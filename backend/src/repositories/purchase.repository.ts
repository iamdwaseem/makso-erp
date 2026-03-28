import { PrismaClient, Purchase, Prisma, SkuHistoryReason } from "@prisma/client";
import { PurchaseInput, PurchaseUpdateInput } from "../validators/purchase.validator.js";
import { InventoryRepository } from "./inventory.repository.js";
import crypto from "crypto";
import { BaseRepository } from "./BaseRepository.js";
import { applyRlsSessionToTx } from "../lib/transaction-rls.js";
import { ProductService } from "../services/product.service.js";
import { VariantService } from "../services/variant.service.js";
import {
  productNameCatalogChanged,
  variantColorCatalogChanged,
  variantSizeCatalogChanged,
} from "../utils/catalog-compare.js";

function generateInvoiceNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}

type LineMeta = {
  product_name?: string;
  variant_color?: string;
  variant_size?: string;
};

type VariantCatalogSnapshot = {
  product_id: string;
  product_name: string;
  color: string;
  size: string | null;
};

export class PurchaseRepository extends BaseRepository {
  private inventoryRepo: InventoryRepository;

  constructor(
    prisma: PrismaClient | Prisma.TransactionClient,
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    super(prisma, organizationId, userId, userRole, allowedWarehouseIds);
    this.inventoryRepo = new InventoryRepository(this.prisma, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async findAll({
    page = 1,
    limit = 50,
    includeDeleted = false,
    deletedOnly = false,
  }: { page?: number; limit?: number; includeDeleted?: boolean; deletedOnly?: boolean } = {}) {
    let extra: Record<string, unknown> = {};
    if (deletedOnly) extra = { deleted_at: { not: null } };
    else if (!includeDeleted) extra = { deleted_at: null };
    return this.paginate<Purchase>(
      (this.prisma as any).purchase,
      this.tenantWhere(extra),
      page,
      limit,
      {
        supplier: true,
        items: { include: { variant: { include: { product: true } } } },
        deletedBy: { select: { id: true, name: true, email: true } },
      },
      { created_at: "desc" }
    );
  }

  async count(includeDeleted = false, deletedOnly = false): Promise<number> {
    let extra: Record<string, unknown> = {};
    if (deletedOnly) extra = { deleted_at: { not: null } };
    else if (!includeDeleted) extra = { deleted_at: null };
    return (this.prisma as any).purchase.count({
      where: this.tenantWhere(extra),
    });
  }

  async findById(id: string, includeDeleted = false): Promise<Purchase | null> {
    const base: Record<string, unknown> = { id };
    if (!includeDeleted) base.deleted_at = null;
    return (this.prisma as any).purchase.findFirst({
      where: this.tenantWhere(base),
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { variant: { include: { product: true } } } },
        deletedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  private async applyLineCatalogMeta(
    tx: Prisma.TransactionClient,
    variantId: string,
    meta: LineMeta
  ): Promise<void> {
    const hasMeta =
      (meta.product_name !== undefined && meta.product_name.trim().length > 0) ||
      meta.variant_color !== undefined ||
      meta.variant_size !== undefined;
    if (!hasMeta) return;

    const variant = await (tx as any).variant.findFirst({
      where: this.tenantWhere({ id: variantId, deleted_at: null }),
      include: { product: true },
    });
    if (!variant) return;

    if (meta.product_name !== undefined && meta.product_name.trim().length > 0) {
      await (tx as any).product.update({
        where: { id: variant.product_id },
        data: { name: meta.product_name.trim() },
      });
    }

    const vPatch: Record<string, string> = {};
    if (meta.variant_color !== undefined) vPatch.color = meta.variant_color;
    if (meta.variant_size !== undefined) vPatch.size = meta.variant_size;
    if (Object.keys(vPatch).length > 0) {
      await (tx as any).variant.update({
        where: { id: variantId },
        data: vPatch,
      });
    }
  }

  /**
   * After GRN line catalog labels are written, re-allocate product/variant SKUs when catalog
   * text actually changed (same rules as product/variant update APIs).
   */
  private async regenerateSkusAfterLineCatalogMeta(
    tx: Prisma.TransactionClient,
    variantId: string,
    meta: LineMeta,
    before: VariantCatalogSnapshot | null
  ): Promise<void> {
    if (!before) return;

    const appliedName = meta.product_name !== undefined && meta.product_name.trim().length > 0;
    const appliedColor = meta.variant_color !== undefined;
    const appliedSize = meta.variant_size !== undefined;
    if (!appliedName && !appliedColor && !appliedSize) return;

    const nameChanged =
      appliedName && productNameCatalogChanged(before.product_name, meta.product_name);
    const colorChanged =
      appliedColor && variantColorCatalogChanged(before.color, meta.variant_color);
    const sizeChanged =
      appliedSize && variantSizeCatalogChanged(before.size ?? "", { size: meta.variant_size });

    if (!nameChanged && !colorChanged && !sizeChanged) return;

    const ps = new ProductService(
      this.organizationId,
      this.userId,
      this.userRole,
      this.allowedWarehouseIds,
      tx
    );
    const vs = new VariantService(
      this.organizationId,
      this.userId,
      this.userRole,
      this.allowedWarehouseIds,
      tx
    );

    if (nameChanged) {
      await ps.regenerateProductSkuFromCurrentName(before.product_id, "name_change");
      const variants = await vs.getVariantsByProductId(before.product_id);
      for (const v of variants) {
        await vs.regenerateVariantSkuFromCatalog(v.id, "name_change");
      }
      return;
    }

    const reason: SkuHistoryReason = colorChanged ? "color_change" : "size_change";
    await vs.regenerateVariantSkuFromCatalog(variantId, reason);
  }

  private async loadVariantCatalogSnapshot(
    tx: Prisma.TransactionClient,
    variantId: string
  ): Promise<VariantCatalogSnapshot | null> {
    const row = await (tx as any).variant.findFirst({
      where: this.tenantWhere({ id: variantId, deleted_at: null }),
      include: { product: { select: { name: true } } },
    });
    if (!row) return null;
    return {
      product_id: row.product_id,
      product_name: row.product?.name ?? "",
      color: row.color ?? "",
      size: row.size ?? null,
    };
  }

  async createPurchase(data: PurchaseInput): Promise<Purchase> {
    const txFunc = async (tx: Prisma.TransactionClient) => {
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds);

      const purchase = await tx.purchase.create({
        data: this.tenantData({
          supplier_id: data.supplier_id,
          warehouse_id: data.warehouse_id,
          invoice_number: data.invoice_number ?? generateInvoiceNumber("PUR"),
        }),
      });

      for (const item of data.items) {
        await tx.purchaseItem.create({
          data: this.tenantData({
            purchase_id: purchase.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          }),
        });

        if (item.quantity > 0) {
          await txInventoryRepo.adjustInventory(
            {
              variant_id: item.variant_id,
              warehouse_id: data.warehouse_id,
              action: "IN",
              quantity: item.quantity,
              reference_type: "PURCHASE",
              reference_id: purchase.id,
            },
            tx
          );
        }
      }

      return tx.purchase.findUnique({
        where: { id: purchase.id },
        include: {
          supplier: true,
          items: { include: { variant: { include: { product: true } } } },
        },
      }) as unknown as Purchase;
    };

    if ((this.prisma as any).$transaction) {
      return (this.prisma as PrismaClient).$transaction(txFunc);
    }
    return txFunc(this.prisma as Prisma.TransactionClient);
  }

  async updatePurchase(id: string, data: PurchaseUpdateInput): Promise<Purchase | null> {
    const existing = await (this.prisma as any).purchase.findFirst({
      where: this.tenantWhere({ id, deleted_at: null }),
      include: { items: true },
    });
    if (!existing) return null;
    const warehouseId = existing.warehouse_id as string;

    const txFunc = async (tx: Prisma.TransactionClient) => {
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds);
      const currentStatus = existing.status as string;
      const newStatus = data.status ?? currentStatus;

      if (data.items !== undefined) {
        await applyRlsSessionToTx(tx);
        const oldById = new Map((existing.items as any[]).map((i: any) => [i.id as string, i]));

        type Inc = NonNullable<PurchaseUpdateInput["items"]>[number];
        const resolved = data.items.map((item: Inc) => ({
          ...item,
          lineKey: item.id && oldById.has(item.id) ? item.id : null,
        }));

        for (const oldItem of existing.items as any[]) {
          const stillHere = resolved.some((r) => r.lineKey === oldItem.id);
          if (!stillHere && currentStatus !== "CANCELLED" && Number(oldItem.quantity) > 0) {
            await txInventoryRepo.adjustInventory(
              {
                variant_id: oldItem.variant_id,
                warehouse_id: warehouseId,
                action: "OUT",
                quantity: oldItem.quantity,
                reference_type: "PURCHASE",
                reference_id: id,
              },
              tx
            );
          }
        }

        for (const inc of resolved) {
          const meta: LineMeta = {
            product_name: inc.product_name,
            variant_color: inc.variant_color,
            variant_size: inc.variant_size,
          };

          if (inc.lineKey) {
            const old = oldById.get(inc.lineKey)!;
            const variantSame = old.variant_id === inc.variant_id;
            const qtySame = Number(old.quantity) === Number(inc.quantity);

            if (!variantSame || !qtySame) {
              if (currentStatus !== "CANCELLED" && Number(old.quantity) > 0) {
                await txInventoryRepo.adjustInventory(
                  {
                    variant_id: old.variant_id,
                    warehouse_id: warehouseId,
                    action: "OUT",
                    quantity: old.quantity,
                    reference_type: "PURCHASE",
                    reference_id: id,
                  },
                  tx
                );
              }
              await (tx as any).purchaseItem.update({
                where: { id: inc.lineKey },
                data: {
                  variant_id: inc.variant_id,
                  quantity: inc.quantity,
                },
              });
              if (newStatus !== "CANCELLED" && inc.quantity > 0) {
                await txInventoryRepo.adjustInventory(
                  {
                    variant_id: inc.variant_id,
                    warehouse_id: warehouseId,
                    action: "IN",
                    quantity: inc.quantity,
                    reference_type: "PURCHASE",
                    reference_id: id,
                  },
                  tx
                );
              }
            }
            const catalogBefore = await this.loadVariantCatalogSnapshot(tx, inc.variant_id);
            await this.applyLineCatalogMeta(tx, inc.variant_id, meta);
            await this.regenerateSkusAfterLineCatalogMeta(tx, inc.variant_id, meta, catalogBefore);
          } else {
            await (tx as any).purchaseItem.create({
              data: this.tenantData({
                purchase_id: id,
                variant_id: inc.variant_id,
                quantity: inc.quantity,
              }),
            });
            if (newStatus !== "CANCELLED" && inc.quantity > 0) {
              await txInventoryRepo.adjustInventory(
                {
                  variant_id: inc.variant_id,
                  warehouse_id: warehouseId,
                  action: "IN",
                  quantity: inc.quantity,
                  reference_type: "PURCHASE",
                  reference_id: id,
                },
                tx
              );
            }
            const catalogBefore = await this.loadVariantCatalogSnapshot(tx, inc.variant_id);
            await this.applyLineCatalogMeta(tx, inc.variant_id, meta);
            await this.regenerateSkusAfterLineCatalogMeta(tx, inc.variant_id, meta, catalogBefore);
          }
        }
      } else {
        if (newStatus === "CANCELLED" && currentStatus !== "CANCELLED") {
          for (const item of existing.items as any[]) {
            if (Number(item.quantity) > 0) {
              await txInventoryRepo.adjustInventory(
                {
                  variant_id: item.variant_id,
                  warehouse_id: warehouseId,
                  action: "OUT",
                  quantity: item.quantity,
                  reference_type: "PURCHASE",
                  reference_id: id,
                },
                tx
              );
            }
          }
        } else if (newStatus !== "CANCELLED" && currentStatus === "CANCELLED") {
          for (const item of existing.items as any[]) {
            if (Number(item.quantity) > 0) {
              await txInventoryRepo.adjustInventory(
                {
                  variant_id: item.variant_id,
                  warehouse_id: warehouseId,
                  action: "IN",
                  quantity: item.quantity,
                  reference_type: "PURCHASE",
                  reference_id: id,
                },
                tx
              );
            }
          }
        }
      }

      const updateData: Record<string, unknown> = {};
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.status !== undefined) updateData.status = data.status;
      if (Object.keys(updateData).length > 0) {
        await (tx as any).purchase.update({ where: { id }, data: updateData });
      }
    };

    if ((this.prisma as any).$transaction) {
      await (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      await txFunc(this.prisma as Prisma.TransactionClient);
    }
    return this.findById(id) as Promise<Purchase | null>;
  }

  /** Soft-delete GRN: reverse stock for non-cancelled receipts; row kept for restore. */
  async softDeletePurchase(id: string, deletedByUserId: string | null): Promise<void> {
    const row = await (this.prisma as any).purchase.findFirst({
      where: this.tenantWhere({ id }),
      include: { items: true },
    });
    if (!row) throw new Error("Purchase not found");
    if (row.deleted_at) throw new Error("Purchase already deleted");

    const warehouseId = row.warehouse_id as string;
    const status = row.status as string;

    const txFunc = async (tx: Prisma.TransactionClient) => {
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds);

      if (status !== "CANCELLED") {
        for (const item of row.items as any[]) {
          if (Number(item.quantity) > 0) {
            await txInventoryRepo.adjustInventory(
              {
                variant_id: item.variant_id,
                warehouse_id: warehouseId,
                action: "OUT",
                quantity: item.quantity,
                reference_type: "PURCHASE",
                reference_id: id,
              },
              tx
            );
          }
        }
      }

      await (tx as any).purchase.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          deleted_by: deletedByUserId,
        },
      });
    };

    if ((this.prisma as any).$transaction) {
      await (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      await txFunc(this.prisma as Prisma.TransactionClient);
    }
  }

  /** Restore soft-deleted GRN: put stock back for non-cancelled receipts. */
  async restorePurchase(id: string): Promise<void> {
    const row = await (this.prisma as any).purchase.findFirst({
      where: this.tenantWhere({ id, deleted_at: { not: null } }),
      include: { items: true },
    });
    if (!row) throw new Error("Purchase not found or not deleted");

    const warehouseId = row.warehouse_id as string;
    const status = row.status as string;

    const txFunc = async (tx: Prisma.TransactionClient) => {
      const txInventoryRepo = new InventoryRepository(tx, this.organizationId, this.userId, this.userRole, this.allowedWarehouseIds);

      if (status !== "CANCELLED") {
        for (const item of row.items as any[]) {
          if (Number(item.quantity) > 0) {
            await txInventoryRepo.adjustInventory(
              {
                variant_id: item.variant_id,
                warehouse_id: warehouseId,
                action: "IN",
                quantity: item.quantity,
                reference_type: "PURCHASE",
                reference_id: id,
              },
              tx
            );
          }
        }
      }

      await (tx as any).purchase.update({
        where: { id },
        data: { deleted_at: null, deleted_by: null },
      });
    };

    if ((this.prisma as any).$transaction) {
      await (this.prisma as PrismaClient).$transaction(txFunc);
    } else {
      await txFunc(this.prisma as Prisma.TransactionClient);
    }
  }
}
