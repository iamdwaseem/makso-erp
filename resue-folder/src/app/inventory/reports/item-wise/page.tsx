"use client";

import { itemWiseReportRows } from "@/mock/inventoryReports";

export default function ItemWiseReportPage() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">ITEM WISE INVENTORY REPORT</h1>
        <input type="text" defaultValue="29-09-2021 - 29-09-2021" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
        <input type="text" placeholder="Item Group" className="rounded border border-gray-200 px-3 py-1.5 text-sm" />
        <button type="button" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Generate</button>
        <button type="button" className="rounded border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm">Export</button>
        <button type="button" className="rounded border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm">More ▾</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Item Code</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Opening</th>
              <th className="px-4 py-3">In</th>
              <th className="px-4 py-3">Out</th>
              <th className="px-4 py-3">Closing</th>
            </tr>
          </thead>
          <tbody>
            {itemWiseReportRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-4 py-3">{row.item}</td>
                <td className="px-4 py-3">{row.itemCode}</td>
                <td className="px-4 py-3">{row.unit}</td>
                <td className="px-4 py-3 tabular-nums">{row.opening}</td>
                <td className="px-4 py-3 tabular-nums">{row.in}</td>
                <td className="px-4 py-3 tabular-nums">{row.out}</td>
                <td className="px-4 py-3 tabular-nums">{row.closing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
