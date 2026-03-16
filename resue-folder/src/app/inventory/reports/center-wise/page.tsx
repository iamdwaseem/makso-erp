"use client";

import { centerWiseReportRows } from "@/mock/inventoryReports";

export default function CenterWiseReportPage() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">CENTER WISE INVENTORY REPORT</h1>
        <span className="text-sm text-gray-600">29-09-2021 - 29-09-2021</span>
        <button type="button" className="ml-auto rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Generate</button>
        <button type="button" className="rounded border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm">Export</button>
        <button type="button" className="rounded border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm">More ▾</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Center</th>
              <th className="px-4 py-3">Opening</th>
              <th className="px-4 py-3">In</th>
              <th className="px-4 py-3">Out</th>
              <th className="px-4 py-3">Closing</th>
            </tr>
          </thead>
          <tbody>
            {centerWiseReportRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-4 py-3">{row.center}</td>
                <td className="px-4 py-3 tabular-nums">{row.opening.toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums">{row.in.toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums">{row.out.toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums">{row.closing.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
