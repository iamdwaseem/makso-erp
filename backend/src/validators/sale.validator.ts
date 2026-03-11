import { z } from "zod";

export const saleItemSchema = z.object({
  variant_id: z.string().uuid("Invalid variant ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export const saleSchema = z.object({
  customer_id: z.string().uuid("Invalid customer ID"),
  warehouse_id: z.string().uuid("Invalid warehouse ID"),
  invoice_number: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Items are required"),
});

export type SaleInput = z.infer<typeof saleSchema>;
