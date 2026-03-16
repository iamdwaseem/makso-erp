"use client";

import { billWisePurchaseRows } from "@/mock/purchaseReports";

export default function BillWisePurchaseReportPage() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">BILL WISE PURCHASE REPORT</h1>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Date range" className="rounded border border-gray-200 px-3 py-1.5 text-sm" defaultValue="01/10/2021 - 31/10/2021" />
          <select className="rounded border border-gray-200 px-3 py-1.5 text-sm">
            <option>All Suppliers</option>
          </select>
          <select className="rounded border border-gray-200 px-3 py-1.5 text-sm">
            <option>All Payment Modes</option>
          </select>
          <button type="button" className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">Generate</button>
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">Export</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Inv No.</th>
              <th className="px-4 py-3">Supp. Inv</th>
              <th className="px-4 py-3">PayMode</th>
              <th className="px-4 py-3">Center</th>
              <th className="px-4 py-3">InCharge</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Tax Reg. No</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Bill Total</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {billWisePurchaseRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{row.invNo}</td>
                <td className="px-4 py-3">{row.suppInv}</td>
                <td className="px-4 py-3">{row.payMode}</td>
                <td className="px-4 py-3">{row.center}</td>
                <td className="px-4 py-3">{row.inCharge}</td>
                <td className="px-4 py-3">{row.supplier}</td>
                <td className="px-4 py-3">{row.taxRegNo}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.billTotal.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
