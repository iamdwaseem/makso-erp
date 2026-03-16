import { z } from "zod";

export const adjustInventorySchema = z.object({
  variant_id: z.string().uuid("Invalid variant ID"),
  warehouse_id: z.string().uuid("Invalid warehouse ID"),
  quantity: z.number().int(),
  reason: z.string().optional(),
});

export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
