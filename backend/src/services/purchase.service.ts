import { PurchaseRepository } from "../repositories/purchase.repository.js";
import { SupplierRepository } from "../repositories/supplier.repository.js";
import { VariantRepository } from "../repositories/variant.repository.js";
import { PurchaseInput, PurchaseUpdateInput, PurchaseImportInput } from "../validators/purchase.validator.js";
import prisma from "../lib/prisma.js";

export class PurchaseService {
  private purchaseRepository: PurchaseRepository;
  private supplierRepository: SupplierRepository;
  private variantRepository: VariantRepository;

  constructor(
    organizationId: string,
    userId?: string,
    userRole?: string,
    allowedWarehouseIds: string[] = []
  ) {
    this.purchaseRepository = new PurchaseRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
    this.supplierRepository = new SupplierRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
    this.variantRepository = new VariantRepository(prisma as any, organizationId, userId, userRole, allowedWarehouseIds);
  }

  async getAllPurchases(opts?: {
    page?: number;
    limit?: number;
    includeDeleted?: boolean;
    deletedOnly?: boolean;
    search?: string;
    status?: "DRAFT" | "SUBMITTED" | "CANCELLED";
  }) {
    return this.purchaseRepository.findAll(opts);
  }

  async countPurchases(includeDeleted?: boolean, deletedOnly?: boolean) {
    return this.purchaseRepository.count(includeDeleted, deletedOnly);
  }

  async getPurchaseById(id: string, opts?: { includeDeleted?: boolean }) {
    const purchase = await this.purchaseRepository.findById(id, !!opts?.includeDeleted);
    if (!purchase) {
      throw new Error("Purchase not found");
    }
    return purchase;
  }

  async createPurchase(data: PurchaseInput) {
    // Validate supplier exists
    const supplier = await this.supplierRepository.findById(data.supplier_id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Validate all variants exist
    for (const item of data.items) {
      const variant = await this.variantRepository.findById(item.variant_id);
      if (!variant) {
        throw new Error(`Variant not found: ${item.variant_id}`);
      }
    }

    // Orchestrate purchase transaction deeply passing through to DB layer cleanly
    return this.purchaseRepository.createPurchase(data);
  }

  async updatePurchase(id: string, data: PurchaseUpdateInput) {
    const head = (await this.purchaseRepository.findById(id, true)) as {
      deleted_at?: Date | null;
      items?: { id: string }[];
    } | null;
    if (!head) {
      throw new Error("Purchase not found");
    }
    if (head.deleted_at) {
      throw new Error("Cannot update deleted purchase");
    }

    if (data.items !== undefined) {
      const existingIds = new Set((head.items ?? []).map((i) => i.id));
      for (const item of data.items) {
        if (item.id && !existingIds.has(item.id)) {
          throw new Error(`Invalid purchase line id: ${item.id}`);
        }
        const variant = await this.variantRepository.findById(item.variant_id);
        if (!variant) throw new Error(`Variant not found: ${item.variant_id}`);
      }
    }

    const purchase = await this.purchaseRepository.updatePurchase(id, data);
    if (!purchase) {
      throw new Error("Purchase not found");
    }
    return purchase;
  }

  async softDeletePurchase(id: string, deletedByUserId: string | null) {
    await this.purchaseRepository.softDeletePurchase(id, deletedByUserId);
  }

  async restorePurchase(id: string) {
    await this.purchaseRepository.restorePurchase(id);
  }

  async importFromCsv(data: PurchaseImportInput) {
    const supplier = await this.supplierRepository.findById(data.supplier_id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const items: { variant_id: string; quantity: number }[] = [];
    const unknownSkus: string[] = [];
    const mismatched: string[] = [];
    const productCache = new Map<string, { name: string; categoryName?: string | null }>();

    const normalize = (s: string | undefined | null) => s?.trim().toLowerCase() ?? "";

    for (const line of data.lines) {
      const variant = await this.variantRepository.findBySku(line.sku.trim());
      if (!variant) {
        unknownSkus.push(line.sku);
        continue;
      }

      if (line.category || line.product_name) {
        let info = productCache.get(variant.product_id);
        if (!info) {
          const product = await (prisma as any).product.findFirst({
            where: { id: variant.product_id },
            include: { category: true },
          });
          if (product) {
            info = { name: product.name, categoryName: product.category?.name ?? null };
            productCache.set(variant.product_id, info);
          }
        }
        if (info) {
          const expectedName = normalize(info.name);
          const expectedCat = normalize(info.categoryName ?? undefined);

          if (line.product_name && normalize(line.product_name) !== expectedName) {
            mismatched.push(
              `${line.sku} (product: CSV "${line.product_name}" vs system "${info.name}")`
            );
          }
          if (line.category && line.category.trim() && normalize(line.category) !== expectedCat) {
            mismatched.push(
              `${line.sku} (category: CSV "${line.category}" vs system "${info.categoryName ?? "(none)"}")`
            );
          }
        }
      }

      const existing = items.find((i) => i.variant_id === variant.id);
      if (existing) {
        existing.quantity += line.quantity;
      } else {
        items.push({ variant_id: variant.id, quantity: line.quantity });
      }
    }

    if (unknownSkus.length > 0) {
      throw new Error(
        `Unknown SKU(s): ${unknownSkus
          .slice(0, 10)
          .join(", ")}${unknownSkus.length > 10 ? ` and ${unknownSkus.length - 10} more` : ""}`
      );
    }
    if (mismatched.length > 0) {
      throw new Error(
        `Category/Product mismatch for SKU(s): ${mismatched
          .slice(0, 10)
          .join("; ")}${mismatched.length > 10 ? ` and ${mismatched.length - 10} more` : ""}`
      );
    }
    if (items.length === 0) {
      throw new Error("No valid lines to import");
    }

    return this.purchaseRepository.createPurchase({
      supplier_id: data.supplier_id,
      warehouse_id: data.warehouse_id,
      invoice_number: data.invoice_number,
      items,
    });
  }
}
