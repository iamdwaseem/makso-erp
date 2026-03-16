export type DebitNoteStatus = "Draft" | "Approved" | "Processed" | "Closed";

export type DebitNote = {
  id: number;
  number: string;
  supplier: string;
  reference: string;
  trn: string;
  center: string;
  date: string;
  invoiceId: string | null;
  poId: string | null;
  reason: string;
  amount: number;
  payMode: string;
  status: DebitNoteStatus;
};

export const debitNotesMock: DebitNote[] = [
  { id: 1, number: "DN001", supplier: "AMJ STATIONERY LLC", reference: "PI10256", trn: "AMJ240001", center: "Warehouse", date: "21 Oct 2021", invoiceId: "PI10256", poId: "LPO106", reason: "Damaged", amount: 500, payMode: "Credit", status: "Approved" },
  { id: 2, number: "DN002", supplier: "Gulfko", reference: "PREO10048", trn: "", center: "Warehouse", date: "20 Oct 2021", invoiceId: null, poId: null, reason: "Return", amount: 1200, payMode: "Bank", status: "Closed" },
  { id: 3, number: "DN003", supplier: "SK Enterprises", reference: "", trn: "7265617837", center: "Main", date: "19 Oct 2021", invoiceId: "PI10232", poId: null, reason: "Price adjustment", amount: 350, payMode: "Credit", status: "Draft" },
];
