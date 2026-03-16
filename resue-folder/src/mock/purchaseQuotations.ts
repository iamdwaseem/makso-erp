export type QuotationStatus = "Draft" | "Approved" | "Cancelled" | "Closed" | "For revisal";

export type PurchaseQuotation = {
  id: number;
  number: string;
  supplier: string;
  trn: string;
  refNo: string;
  date: string;
  amount: number;
  status: QuotationStatus;
};

export const purchaseQuotationsMock: PurchaseQuotation[] = [
  { id: 8, number: "LPQ105", supplier: "Ajma", trn: "", refNo: "58479", date: "01 Aug 2021, 2:42 PM", amount: 4620, status: "Closed" },
  { id: 7, number: "LPQ104", supplier: "Binshad k", trn: "", refNo: "NS123123", date: "06 May 2021, 11:16 PM", amount: 5, status: "Approved" },
  { id: 6, number: "LPQ103", supplier: "AMJ STATIONERY LLC", trn: "", refNo: "", date: "05 May 2021, 10:00 AM", amount: 45, status: "Cancelled" },
  { id: 5, number: "LPQ102", supplier: "AMJ STATIONERY LLC", trn: "", refNo: "", date: "01 May 2021, 9:00 AM", amount: 50, status: "Draft" },
  { id: 4, number: "LPQ101", supplier: "AMJ STATIONERY LLC", trn: "", refNo: "", date: "15 Apr 2021, 3:20 PM", amount: 1100, status: "Closed" },
  { id: 3, number: "LPQ100", supplier: "AMJ STATIONERY LLC", trn: "", refNo: "", date: "18 Mar 2021, 2:00 PM", amount: 1000, status: "Closed" },
  { id: 1, number: "HPQ100", supplier: "AMJ STATIONERY LLC", trn: "", refNo: "", date: "10 Mar 2021, 11:00 AM", amount: 162.75, status: "Approved" },
];
