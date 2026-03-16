import { z } from "zod";

const purchaseItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  cost: z.number().min(0),
});

export const createPurchaseSchema = z.object({
  supplier_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  items: z.array(purchaseItemSchema).min(1),
});

export const updatePurchaseSchema = z.object({
  supplier_id: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  items: z.array(purchaseItemSchema).min(1).optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
