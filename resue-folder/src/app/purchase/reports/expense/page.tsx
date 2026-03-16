"use client";

import { purchaseExpenseRows } from "@/mock/purchaseReports";

export default function PurchaseExpenseReportPage() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">PURCHASE EXPENSE REPORT</h1>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Date range" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
          <select className="rounded border border-gray-200 px-3 py-1.5 text-sm">
            <option>All Expense Types</option>
          </select>
          <button type="button" className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">Generate</button>
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">Export</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Expense Type</th>
              <th className="px-4 py-3 text-right">Non-Taxable</th>
              <th className="px-4 py-3 text-right">Taxable</th>
              <th className="px-4 py-3 text-right">Tax</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {purchaseExpenseRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium">{row.expenseType}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.nonTaxable.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.taxable.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.tax.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{row.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
