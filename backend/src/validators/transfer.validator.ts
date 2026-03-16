import { z } from "zod";

const transferItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createTransferSchema = z.object({
  source_warehouse_id: z.string().uuid(),
  target_warehouse_id: z.string().uuid(),
  items: z.array(transferItemSchema).min(1),
});

export const updateTransferSchema = z.object({
  items: z.array(transferItemSchema).min(1).optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;

