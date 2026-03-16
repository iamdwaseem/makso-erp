import { z } from "zod";

const saleItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().min(0),
});

export const createSaleSchema = z.object({
  customer_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  items: z.array(saleItemSchema).min(1),
});

export const updateSaleSchema = z.object({
  customer_id: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  items: z.array(saleItemSchema).min(1).optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
