import { z } from "zod";

export const purchaseItemSchema = z.object({
  variant_id: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().nonnegative("Quantity must be nonnegative"),
});

export const purchaseSchema = z
  .object({
    supplier_id: z.string().uuid("Invalid supplier ID"),
    warehouse_id: z.string().uuid("Invalid warehouse ID"),
    invoice_number: z.string().optional(),
    items: z.array(purchaseItemSchema).min(1, "Items are required"),
  })
  .refine((d) => d.items.some((i) => i.quantity > 0), {
    message: "At least one line item must have quantity greater than zero",
    path: ["items"],
  });

export type PurchaseInput = z.infer<typeof purchaseSchema>;

/** GRN line update: optional purchase_item id for in-place edits; optional catalog labels to update product/variant. */
export const purchaseUpdateItemSchema = z.object({
  id: z.string().uuid().optional(),
  variant_id: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().nonnegative("Quantity must be nonnegative"),
  product_name: z.string().optional(),
  variant_color: z.string().optional(),
  variant_size: z.string().optional(),
});

export const purchaseUpdateSchema = z
  .object({
    notes: z.string().optional(),
    status: z.enum(["DRAFT", "SUBMITTED", "CANCELLED"]).optional(),
    items: z.array(purchaseUpdateItemSchema).min(1).optional(),
  })
  .refine((d) => d.items === undefined || d.items.some((i) => i.quantity > 0), {
    message: "At least one line item must have quantity greater than zero",
    path: ["items"],
  });
export type PurchaseUpdateInput = z.infer<typeof purchaseUpdateSchema>;

export const purchaseImportSchema = z.object({
  supplier_id: z.string().uuid("Invalid supplier ID"),
  warehouse_id: z.string().uuid("Invalid warehouse ID"),
  invoice_number: z.string().optional(),
  lines: z
    .array(
      z.object({
        // Frontend CSV: Category,Product Name,Quantity,SKU
        category: z.string().optional(),
        product_name: z.string().optional(),
        sku: z.string().min(1, "SKU is required"),
        quantity: z.number().int().positive("Quantity must be positive"),
      })
    )
    .min(1, "At least one line is required"),
});
export type PurchaseImportInput = z.infer<typeof purchaseImportSchema>;
