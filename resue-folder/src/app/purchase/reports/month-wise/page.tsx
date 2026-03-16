"use client";

import { monthWisePurchaseRows } from "@/mock/purchaseReports";

export default function MonthWisePurchaseReportPage() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">MONTH WISE PURCHASE REPORT</h1>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Date range" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
          <select className="rounded border border-gray-200 px-3 py-1.5 text-sm">
            <option>All Suppliers</option>
          </select>
          <button type="button" className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">Generate</button>
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">Export</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3 text-right">Count</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Discount</th>
              <th className="px-4 py-3 text-right">Taxable</th>
              <th className="px-4 py-3 text-right">Bill Total</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-right">Ret Count</th>
              <th className="px-4 py-3 text-right">Ret Total</th>
              <th className="px-4 py-3 text-right">Net Total</th>
            </tr>
          </thead>
          <tbody>
            {monthWisePurchaseRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium">{row.month}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.count}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.discount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.taxable.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.billTotal.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.balance.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.retCount}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.retTotal.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{row.netTotal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
