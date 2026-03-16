"use client";

import { useState } from "react";
import {
  employeeWisePurchaseRows,
  employeeWisePurchaseTotal,
  dateRangeOptions,
} from "@/mock/purchaseReports";

function formatAmount(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EmployeeWisePurchaseReportPage() {
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [dateRange, setDateRange] = useState("01-04-2021 - 31-03-2022");

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">EMPLOYEE WISE PURCHASE REPORT</h1>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDateRangeOpen(!dateRangeOpen)}
              className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
            >
              {dateRange}
            </button>
            {dateRangeOpen && (
              <>
                <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded border border-gray-200 bg-white py-1 shadow-lg">
                  {dateRangeOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setDateRange(opt === "This financial Year" ? "01-04-2021 - 31-03-2022" : opt);
                        setDateRangeOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm ${opt === "This financial Year" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {opt}
                    </button>
                  ))}
                  <div className="mt-2 flex gap-2 border-t border-gray-100 px-2 pt-2">
                    <button type="button" className="rounded bg-blue-600 px-3 py-1 text-xs text-white">Apply</button>
                    <button type="button" onClick={() => setDateRangeOpen(false)} className="rounded border border-gray-200 px-3 py-1 text-xs">Cancel</button>
                  </div>
                </div>
                <div className="fixed inset-0 z-10" onClick={() => setDateRangeOpen(false)} />
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">Generate</button>
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">Export</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Employee ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3 text-right">No. of Purchases</th>
              <th className="px-4 py-3 text-right">Value Total</th>
              <th className="px-4 py-3 text-right">Bill Total</th>
            </tr>
          </thead>
          <tbody>
            {employeeWisePurchaseRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3">{row.employeeId}</td>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.noOfPurchases}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatAmount(row.valueTotal)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatAmount(row.billTotal)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-right tabular-nums">{employeeWisePurchaseTotal.noOfPurchases}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatAmount(employeeWisePurchaseTotal.valueTotal)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatAmount(employeeWisePurchaseTotal.billTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
