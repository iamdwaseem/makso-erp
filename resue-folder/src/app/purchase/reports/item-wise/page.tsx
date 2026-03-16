"use client";

import { itemWisePurchaseRows } from "@/mock/purchaseReports";

export default function ItemWisePurchaseReportPage() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">ITEM WISE PURCHASE REPORT</h1>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Date range" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
          <select className="rounded border border-gray-200 px-3 py-1.5 text-sm">
            <option>All Suppliers</option>
          </select>
          <input type="text" placeholder="Item" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
          <select className="rounded border border-gray-200 px-3 py-1.5 text-sm">
            <option>All Centers</option>
          </select>
          <button type="button" className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">Generate</button>
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">Export</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Item Code</th>
              <th className="px-4 py-3 text-right">Quantity</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Avg Unit Amt</th>
              <th className="px-4 py-3 text-right">Total Including Tax</th>
            </tr>
          </thead>
          <tbody>
            {itemWisePurchaseRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium">{row.item}</td>
                <td className="px-4 py-3">{row.itemCode}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.quantity}</td>
                <td className="px-4 py-3">{row.unit}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.avgUnitAmt.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.totalIncludingTax.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
