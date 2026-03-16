export type PaymentTerm = {
  id: number;
  termName: string;
  days: number;
  description: string | null;
};

export const paymentTermsMock: PaymentTerm[] = [
  { id: 1, termName: "Net 7", days: 7, description: "Payment due in 7 days" },
  { id: 2, termName: "Net 15", days: 15, description: "Payment due in 15 days" },
  { id: 3, termName: "Net 30", days: 30, description: "Payment due in 30 days" },
  { id: 4, termName: "Immediate", days: 0, description: "Due on receipt" },
];
