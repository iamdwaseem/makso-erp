import { z } from "zod";

export const purchaseItemSchema = z.object({
  variant_id: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export const purchaseSchema = z.object({
  supplier_id: z.string().uuid("Invalid supplier ID"),
  invoice_number: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "Items are required"),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
