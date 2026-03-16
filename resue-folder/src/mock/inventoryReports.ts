export const stockReportColumns = ["Item Code", "Item", "Unit", "Chavakkad Branch", "Nilambur", "Kochi", "Tirur", "Malappuram", "Thrissur Central", "Total"];
export const stockReportRows = [
  { itemCode: "BR012", item: "Sandwich Bread pCK25", unit: "nos", branches: [0, 1, -9.667, 10, 0, 0, 1, 0, 0, 0], total: -9.655 },
  { itemCode: "1104", item: "cake", unit: "BX", branches: [0, 300, 0, 0, 0, 0, 90, 0, 0, 0], total: 390 },
  { itemCode: "1101", item: "Good day biscuit", unit: "BX", branches: [0, 0, 0, 0, 0, 0, 12.5, 0, 0, 0], total: 12.5 },
];

export const inventorySummaryRows = [
  { item: "cake", itemId: 7, itemCode: "1104", unit: "Box-12p", quantity: 390, avgUnitCost: "1,046.23", value: "408,029.89" },
  { item: "Dell inspiron 5408", itemId: 31, itemCode: "95601", unit: "Pieces", quantity: 103, avgUnitCost: "61,176.05", value: "6,301,132.96" },
  { item: "Good day biscuit", itemId: 5, itemCode: "1101", unit: "NO", quantity: 12.5, avgUnitCost: "399.00", value: "4,987.50" },
];

export const itemWiseReportRows = [
  { item: "Hi Ball Glass", itemCode: "1254", unit: "NO", opening: -2, in: 0, out: 0, closing: -2 },
  { item: "ROCK GLASS 0.5OZ", itemCode: "RG456", unit: "Nos", opening: 70, in: 0, out: 0, closing: 70 },
  { item: "Dell inspiron 5408", itemCode: "95601", unit: "Pieces", opening: -9655, in: 0, out: 0, closing: -9655 },
];

export const centerWiseReportRows = [
  { center: "calicut furniture showroom", opening: 20, in: 0, out: 0, closing: 20 },
  { center: "Tirur", opening: 819, in: 20, out: 1, closing: 838 },
  { center: "warehouse", opening: 5691, in: 0, out: 0, closing: 5691 },
];

export const itemTransactionRows = [
  { date: "Jun 17, 2021", voucherType: "purchaseInvoice", voucherId: 9, inQty: 8, outQty: "", balance: 8 },
  { date: "Jun 17, 2021", voucherType: "saleInvoice", voucherId: 6, inQty: "", outQty: 10, balance: 28 },
  { date: "Jun 18, 2021", voucherType: "inventoryTransfer", voucherId: 22, inQty: "", outQty: 23, balance: 5 },
];

export const itemWiseAdjustmentRows = [
  { item: "ENZO L SOFA", itemCode: "1100114", unit: "NO", in: 21, out: "" },
  { item: "RIPPLE 3-SEATER", itemCode: "1100115", unit: "NO", in: 5, out: "" },
  { item: "STEVE 2-SEATER", itemCode: "1100112", unit: "NO", in: 5, out: "" },
];
