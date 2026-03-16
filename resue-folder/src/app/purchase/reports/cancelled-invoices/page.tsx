"use client";

import { cancelledInvoicesRows } from "@/mock/purchaseReports";

export default function CancelledPurchaseInvoicesReportPage() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">CANCELLED PURCHASE INVOICE REPORT</h1>
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
              <th className="px-4 py-3">Bill Date</th>
              <th className="px-4 py-3">Cancelled On</th>
              <th className="px-4 py-3">Inv No.</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Tax Amount</th>
              <th className="px-4 py-3 text-right">Bill Total</th>
              <th className="px-4 py-3">Cancel Notes</th>
            </tr>
          </thead>
          <tbody>
            {cancelledInvoicesRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3">{row.billDate}</td>
                <td className="px-4 py-3">{row.cancelledOn}</td>
                <td className="px-4 py-3">{row.invNo}</td>
                <td className="px-4 py-3">{row.supplier}</td>
                <td className="px-4 py-3">{row.employee}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.total.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.taxAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.billTotal.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{row.cancelNotes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
