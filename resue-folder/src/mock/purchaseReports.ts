// Supplier Aging Report
export const supplierAgingRows = [
  { supId: 7, supplier: "Tip Top Furniture", code: "+91 98765", phone: "9876543210", address: "Kochi", total: 8028000, current: 2300000, d0_15: 1195000, d16_30: 1310000, d31_60: 2632000, d61_90: 0, d90: 581 },
  { supId: 8, supplier: "Al Meera Group", code: "+91 91234", phone: "9123456789", address: "Dubai", total: 5255050, current: 0, d0_15: 632000, d16_30: 1000000, d31_60: 1789600, d61_90: 1307200, d90: 526250 },
  { supId: 11, supplier: "LIFE LINE FITNESS EQUIPMENTS", code: "+91 99887", phone: "9988776655", address: "Mumbai", total: 2137100, current: 0, d0_15: 0, d16_30: 0, d31_60: 0, d61_90: 2071000, d90: 66100 },
  { supId: 9, supplier: "TRIPLE H NUTRITIONS PVT LTD", code: "THN001", phone: "9876123456", address: "Delhi", total: 1926500, current: 0, d0_15: 0, d16_30: 0, d31_60: 0, d61_90: 0, d90: 1926500 },
  { supId: 10, supplier: "LAS VEGAS CLOTHING OUTLET", code: "LV001", phone: "9765432109", address: "Bangalore", total: 1437500, current: 0, d0_15: 0, d16_30: 0, d31_60: 0, d61_90: 0, d90: 1437500 },
];

// Employee Wise Purchase Report
export const employeeWisePurchaseRows = [
  { employeeId: 9, name: "HATHIM SHAHEER", noOfPurchases: 3, valueTotal: 89270, billTotal: 89270 },
  { employeeId: 10, name: "HADHIQ SHAHEER", noOfPurchases: 4, valueTotal: 14402500, billTotal: 14402500 },
  { employeeId: 14, name: "Shajil Nass", noOfPurchases: 3, valueTotal: 1572000, billTotal: 1572000 },
  { employeeId: 8, name: "MARWAN ABDUL RASHEED", noOfPurchases: 4, valueTotal: 24200, billTotal: 24200 },
  { employeeId: 6, name: "Steve John", noOfPurchases: 2, valueTotal: 2186000, billTotal: 2186000 },
  { employeeId: 16, name: "Farha Moinudheen", noOfPurchases: 7, valueTotal: 645820, billTotal: 719920 },
  { employeeId: 4, name: "Fazal rahaman", noOfPurchases: 5, valueTotal: 181000, billTotal: 181000 },
  { employeeId: 5, name: "Riza Asif", noOfPurchases: 19, valueTotal: 9312250, billTotal: 9501498 },
  { employeeId: 7, name: "Shamlin shamsudheen", noOfPurchases: 44, valueTotal: 20366250, billTotal: 21398850 },
  { employeeId: 3, name: "Murshid", noOfPurchases: 73, valueTotal: 91451125, billTotal: 105588045 },
  { employeeId: 2, name: "Roshan gauge", noOfPurchases: 3, valueTotal: 14770, billTotal: 14770 },
];
export const employeeWisePurchaseTotal = { noOfPurchases: 169, valueTotal: 147745185, billTotal: 163178053 };

// Bill Wise Purchase Report
export const billWisePurchaseRows = [
  { date: "01/10/2021", invNo: "PI-1001", suppInv: "SUP-001", payMode: "Credit", center: "Tirur", inCharge: "Riza Asif", supplier: "Tip Top Furniture", taxRegNo: "TRN123", amount: 50000, discount: 500, amountWoTax: 49500, subTotal: 52470, billTotal: 55000, cash: 0, bank: 0, credit: 55000, balance: 55000 },
  { date: "02/10/2021", invNo: "PI-1002", suppInv: "SUP-002", payMode: "Bank", center: "Kochi", inCharge: "Steve John", supplier: "Al Meera Group", taxRegNo: "TRN456", amount: 120000, discount: 0, amountWoTax: 120000, subTotal: 127200, billTotal: 127200, cash: 0, bank: 127200, credit: 0, balance: 0 },
];

// Item Wise Purchase Report
export const itemWisePurchaseRows = [
  { item: "Office Chair", itemCode: "OC-101", quantity: 50, unit: "PCS", amount: 125000, avgUnitAmt: 2500, totalIncludingTax: 137500 },
  { item: "Laptop Dell", itemCode: "LP-201", quantity: 10, unit: "PCS", amount: 450000, avgUnitAmt: 45000, totalIncludingTax: 472500 },
  { item: "A4 Paper", itemCode: "AP-301", quantity: 200, unit: "Ream", amount: 18000, avgUnitAmt: 90, totalIncludingTax: 18900 },
];

// Cancelled Purchase Invoices
export const cancelledInvoicesRows = [
  { billDate: "15/09/2021", cancelledOn: "20/09/2021", invNo: "PI-0987", supplier: "Tip Top Furniture", employee: "Riza Asif", total: 45000, taxAmount: 4500, billTotal: 49500, cancelNotes: "Duplicate entry" },
  { billDate: "10/09/2021", cancelledOn: "18/09/2021", invNo: "PI-0980", supplier: "Al Meera Group", employee: "Steve John", total: 78000, taxAmount: 7800, billTotal: 85800, cancelNotes: "Order cancelled by supplier" },
];

// Cancelled Debit Notes
export const cancelledDebitNotesRows = [
  { billDate: "05/09/2021", cancelledOn: "12/09/2021", invNo: "DN-045", supplier: "LIFE LINE FITNESS", employee: "Shamlin shamsudheen", total: 12000, taxAmount: 1200, billTotal: 13200, cancelNotes: "Error in amount" },
];

// Purchase Expense Report
export const purchaseExpenseRows = [
  { expenseType: "Freight", nonTaxable: 15000, taxable: 5000, tax: 500, total: 20500 },
  { expenseType: "Handling", nonTaxable: 8000, taxable: 0, tax: 0, total: 8000 },
  { expenseType: "Insurance", nonTaxable: 0, taxable: 12000, tax: 1200, total: 13200 },
];

// Month Wise Purchase
export const monthWisePurchaseRows = [
  { month: "Apr 2021", count: 12, amount: 450000, discount: 5000, taxable: 445000, billTotal: 469450, balance: 120000, retCount: 1, retTaxable: 5000, retTotal: 5250, retBalance: 0, netTotal: 464200 },
  { month: "May 2021", count: 18, amount: 680000, discount: 8000, taxable: 672000, billTotal: 708960, balance: 85000, retCount: 0, retTaxable: 0, retTotal: 0, retBalance: 0, netTotal: 623960 },
];

// Date range options for reports
export const dateRangeOptions = [
  "This financial Year",
  "Last financial Year",
  "This Year",
  "Last year",
  "Today",
  "Yesterday",
  "Last 30 Days",
  "This Month",
  "Last Month",
  "Custom Range",
];
