"use client";

import { useState } from "react";
import PurchaseExpenseForm from "@/components/purchase/expenses/PurchaseExpenseForm";
import { purchaseExpensesMock } from "@/mock/purchaseExpenses";

type ViewMode = "list" | "form";

export default function PurchaseExpensesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">PURCHASE EXPENSES</h1>
            <div className="flex gap-2">
              <button type="button" onClick={() => setViewMode("form")} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">NEW</button>
              <button type="button" className="rounded border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">EXPORT</button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Expense Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseExpensesMock.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-800">{row.id}</td>
                      <td className="px-4 py-3 text-gray-800">{row.date}</td>
                      <td className="px-4 py-3 text-gray-800">{row.expenseType}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-800">{row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-gray-800">Closed</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <div className="flex gap-2">
                <button type="button" className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">Previous</button>
                <button type="button" className="rounded border border-blue-600 bg-blue-600 px-3 py-1 text-sm text-white">1</button>
                <button type="button" className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">Next</button>
              </div>
              <span className="text-sm text-gray-500">20 / {purchaseExpensesMock.length}</span>
            </div>
          </div>
        </>
      )}
      {viewMode === "form" && (
        <>
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-[#e2e8f0] px-6 py-3">
            <h1 className="text-lg font-semibold uppercase text-gray-800">NEW PURCHASE EXPENSE</h1>
            <div className="flex gap-2">
              <button type="button" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
              <button type="button" className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">Save And Approve</button>
              <button type="button" className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Reset</button>
              <button type="button" onClick={() => setViewMode("list")} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <PurchaseExpenseForm onSave={() => setViewMode("list")} onSaveAndApprove={() => setViewMode("list")} onReset={() => {}} onCancel={() => setViewMode("list")} />
          </div>
        </>
      )}
    </div>
  );
}
