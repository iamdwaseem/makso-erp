import { z } from "zod";

export const createAdjustmentSchema = z.object({
  warehouse_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  quantity: z.number().int(),
  reason: z.string().optional(),
});

export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
