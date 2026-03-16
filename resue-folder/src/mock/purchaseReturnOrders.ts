export type ReturnOrderStatus = "Draft" | "Approved" | "Closed" | "Delivery Note Created" | "Debit Note Created" | "Completed";

export type PurchaseReturnOrder = {
  id: number;
  number: string;
  supplier: string;
  date: string;
  gstn: string;
  invoiceId: string | null;
  invoiceRef: string | null;
  amount: number;
  status: ReturnOrderStatus;
};

export const purchaseReturnOrdersMock: PurchaseReturnOrder[] = [
  { id: 52, number: "PREO10051", supplier: "HAPPY GARMENTS PVT LTD", date: "28 Jun 2022, 10:55 AM", gstn: "4667765433", invoiceId: "PI10256", invoiceRef: "276", amount: 115.5, status: "Closed" },
  { id: 51, number: "PREO10050", supplier: "SK Enterprises Pvt.Ltd", date: "25 Jun 2022, 2:00 PM", gstn: "7265617837", invoiceId: "PI10232", invoiceRef: "251", amount: 40, status: "Approved" },
  { id: 49, number: "PREO10048", supplier: "SK Enterprises Pvt.Ltd", date: "13 Jun 2022, 3:08 PM", gstn: "7265617837", invoiceId: "PI10232", invoiceRef: "251", amount: 24950, status: "Approved" },
  { id: 48, number: "PREO10047", supplier: "AMJ STATIONERY LLC", date: "08 Jun 2022, 11:00 AM", gstn: "", invoiceId: null, invoiceRef: null, amount: 520, status: "Draft" },
];
