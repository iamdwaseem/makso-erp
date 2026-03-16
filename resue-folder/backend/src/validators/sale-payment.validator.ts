import { z } from "zod";

export const createSalePaymentSchema = z.object({
  amount: z.number().positive(),
});

export type CreateSalePaymentInput = z.infer<typeof createSalePaymentSchema>;
