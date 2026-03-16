import { z } from "zod";

const gdnItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createGdnSchema = z.object({
  warehouse_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  items: z.array(gdnItemSchema).min(1),
});

export const updateGdnSchema = z.object({
  warehouse_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional().nullable(),
  items: z.array(gdnItemSchema).min(1).optional(),
});

export type CreateGdnInput = z.infer<typeof createGdnSchema>;
export type UpdateGdnInput = z.infer<typeof updateGdnSchema>;
