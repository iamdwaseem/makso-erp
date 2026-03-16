// Supplier Groups
export type SupplierGroup = { id: number; name: string; code?: string };
export const supplierGroupsMock: SupplierGroup[] = [
  { id: 1, name: "Electronics Suppliers", code: "ELEC" },
  { id: 2, name: "Office Supplies", code: "OFF" },
  { id: 3, name: "Furniture", code: "FURN" },
];

// Purchase Types
export type PurchaseType = { id: number; name: string; code?: string };
export const purchaseTypesMock: PurchaseType[] = [
  { id: 1, name: "Standard Purchase", code: "STD" },
  { id: 2, name: "Import", code: "IMP" },
  { id: 3, name: "Local", code: "LOC" },
];

// Purchase Expense Types
export type PurchaseExpenseType = { id: number; name: string; code?: string; taxable: boolean };
export const purchaseExpenseTypesMock: PurchaseExpenseType[] = [
  { id: 1, name: "Freight", code: "FRT", taxable: true },
  { id: 2, name: "Handling", code: "HDL", taxable: false },
  { id: 3, name: "Insurance", code: "INS", taxable: true },
];

// Purchase Return Reasons
export type PurchaseReturnReason = { id: number; name: string; code?: string };
export const purchaseReturnReasonsMock: PurchaseReturnReason[] = [
  { id: 1, name: "Damaged in transit", code: "DAM" },
  { id: 2, name: "Wrong item supplied", code: "WRONG" },
  { id: 3, name: "Expired", code: "EXP" },
  { id: 4, name: "Quality issue", code: "QLTY" },
];

// Pricing (item-level placeholder)
export type ItemPricing = { id: number; item: string; supplier?: string; price: number; effectiveFrom: string };
export const itemPricingMock: ItemPricing[] = [
  { id: 1, item: "Office Chair", price: 2500, effectiveFrom: "01/01/2024" },
  { id: 2, item: "A4 Paper", supplier: "Paper Co", price: 90, effectiveFrom: "01/02/2024" },
];

// Supplier Rate Tracking
export type SupplierRate = { id: number; supplier: string; item: string; rate: number; unit: string; updatedOn: string };
export const supplierRatesMock: SupplierRate[] = [
  { id: 1, supplier: "Tip Top Furniture", item: "Office Chair", rate: 2500, unit: "PCS", updatedOn: "15/10/2024" },
  { id: 2, supplier: "Al Meera", item: "Laptop", rate: 45000, unit: "PCS", updatedOn: "10/10/2024" },
];
