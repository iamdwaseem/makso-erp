import { z } from "zod";

const grnItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createGrnSchema = z.object({
  warehouse_id: z.string().uuid(),
  supplier_id: z.string().uuid().optional(),
  items: z.array(grnItemSchema).min(1),
});

export const updateGrnSchema = z.object({
  warehouse_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional().nullable(),
  items: z.array(grnItemSchema).min(1).optional(),
});

export type CreateGrnInput = z.infer<typeof createGrnSchema>;
export type UpdateGrnInput = z.infer<typeof updateGrnSchema>;
