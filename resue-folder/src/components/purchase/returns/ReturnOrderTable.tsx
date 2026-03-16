"use client";

import { useState } from "react";
import type { PurchaseReturnOrder } from "@/mock/purchaseReturnOrders";
import { MoreVertical } from "lucide-react";

type ReturnOrderTableProps = {
  orders: PurchaseReturnOrder[];
};

export default function ReturnOrderTable({ orders }: ReturnOrderTableProps) {
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" aria-label="Select all" /></th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">NUMBER #</th>
              <th className="px-4 py-3">SUPPLIER</th>
              <th className="px-4 py-3">DATE</th>
              <th className="px-4 py-3">GSTN</th>
              <th className="px-4 py-3">INVOICE [ID]</th>
              <th className="px-4 py-3">AMOUNT</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                <td className="px-4 py-3 text-gray-800">{row.id}</td>
                <td className="px-4 py-3 text-gray-800">{row.number}</td>
                <td className="px-4 py-3 text-gray-800">{row.supplier}</td>
                <td className="px-4 py-3 text-gray-800">{row.date}</td>
                <td className="px-4 py-3 text-gray-800">{row.gstn || "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.invoiceId && row.invoiceRef ? `${row.invoiceId} [${row.invoiceRef}]` : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-800">{row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-gray-800">{row.status}</td>
                <td className="relative px-4 py-3">
                  <button type="button" onClick={() => setMenuOpenId(menuOpenId === row.id ? null : row.id)} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Actions">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpenId === row.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                      <div className="absolute right-4 top-full z-20 mt-1 min-w-[180px] rounded border border-gray-200 bg-white py-1 shadow-lg">
                        <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">View</button>
                        <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Approve</button>
                        <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Create Delivery Note</button>
                        <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Create Debit Note</button>
                        <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Export</button>
                      </div>
                    </>
                  )}
                </td>
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
        <span className="text-sm text-gray-500">20 / {orders.length}</span>
      </div>
    </div>
  );
}
