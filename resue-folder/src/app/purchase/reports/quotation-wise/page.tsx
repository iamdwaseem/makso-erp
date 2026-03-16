"use client";

export default function QuotationWisePurchaseReportPage() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">QUOTATION WISE PURCHASE REPORT</h1>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Date range" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
          <input type="text" placeholder="Quotation No." className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
          <select className="rounded border border-gray-200 px-3 py-1.5 text-sm">
            <option>All Suppliers</option>
          </select>
          <select className="rounded border border-gray-200 px-3 py-1.5 text-sm">
            <option>All InCharge</option>
          </select>
          <button type="button" className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">Generate</button>
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">Export</button>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
        # , Date, Quotation No., Due Date, InCharge, Supplier, Tax Reg.No, Amount, Discount, Taxable Amount, Tax Amount, Sub Total, Bill Total.
      </div>
    </>
  );
}
