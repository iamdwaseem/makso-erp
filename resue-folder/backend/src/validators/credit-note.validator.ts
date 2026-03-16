import { z } from "zod";

const creditNoteItemSchema = z.object({
  variant_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createCreditNoteSchema = z.object({
  sale_id: z.string().uuid(),
  amount: z.number().min(0),
  reason: z.string().optional(),
  items: z.array(creditNoteItemSchema).min(1),
});

export type CreateCreditNoteInput = z.infer<typeof createCreditNoteSchema>;
