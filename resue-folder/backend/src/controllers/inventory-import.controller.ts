import { Request, Response } from "express";
import { ProductService } from "../services/product.service.js";
import { VariantService } from "../services/variant.service.js";
import { importProductsSchema } from "../validators/inventory-import.validator.js";
import { BaseController } from "./BaseController.js";

export class InventoryImportController extends BaseController {
  /** POST /api/inventory/import/products — bulk create products + one variant per row (from scraped CSV) */
  importProducts = async (req: Request, res: Response) => {
    try {
      const body = importProductsSchema.parse(this.getBody(req));
      const ctx = this.getServiceContext(req);
      const productService = new ProductService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );
      const variantService = new VariantService(
        ctx.organizationId,
        ctx.userId,
        ctx.userRole,
        ctx.allowedWarehouseIds
      );

      const productIds: string[] = [];
      const errors: string[] = [];

      for (let i = 0; i < body.products.length; i++) {
        const row = body.products[i];
        try {
          const product = await productService.createProduct({
            name: row.name.trim(),
            description: row.description?.trim() || undefined,
          });
          await variantService.createVariant({
            product_id: product.id,
            color: (row.category?.trim() || "Default").slice(0, 100),
          });
          productIds.push(product.id);
        } catch (err: any) {
          errors.push(`Row ${i + 1} (${row.name}): ${err?.message ?? "Unknown error"}`);
        }
      }

      return this.success(res, {
        created: productIds.length,
        productIds,
        errors: errors.length > 0 ? errors : undefined,
      }, 201);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
}
