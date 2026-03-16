export type PurchaseExpense = {
  id: number;
  date: string;
  orderId: string | null;
  purchaseInvoice: string | null;
  receiptNotes: string | null;
  expenseType: string;
  paymentMode: string;
  amount: number;
  notes: string;
};

export type ExpenseAllocationRow = {
  slNo: number;
  item: string;
  batch: string;
  allocationPercent: number;
  amount: number;
};

export const purchaseExpensesMock: PurchaseExpense[] = [
  { id: 1, date: "21/10/2021", orderId: "LPO105", purchaseInvoice: "PI100", receiptNotes: null, expenseType: "Freight", paymentMode: "Bank", amount: 2000, notes: "handling charge" },
  { id: 2, date: "20/10/2021", orderId: null, purchaseInvoice: "PI099", receiptNotes: "RN50", expenseType: "Insurance", paymentMode: "Cash", amount: 1000, notes: "" },
  { id: 3, date: "18/10/2021", orderId: null, purchaseInvoice: null, receiptNotes: null, expenseType: "Customs", paymentMode: "Bank", amount: 500, notes: "" },
];
