"use client";

import { useState } from "react";
import Link from "next/link";
import type { PurchaseOrderRow } from "@/app/purchase/orders/page";
import { MoreVertical } from "lucide-react";

type PurchaseOrderTableProps = {
  orders: PurchaseOrderRow[];
};

export default function PurchaseOrderTable({ orders }: PurchaseOrderTableProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded border-gray-300" aria-label="Select all" />
              </th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">NUMBER #</th>
              <th className="px-4 py-3">SUPPLIER</th>
              <th className="px-4 py-3">TRN</th>
              <th className="px-4 py-3">CONTACT PERSON</th>
              <th className="px-4 py-3">QUOTATION [ID]</th>
              <th className="px-4 py-3">DATE</th>
              <th className="px-4 py-3">AMOUNT</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-800">{row.id.slice(0, 8)}…</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/purchase/orders/${row.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {row.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-800">{row.supplier}</td>
                <td className="px-4 py-3 text-gray-800">{row.trn || "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.contactPerson}</td>
                <td className="px-4 py-3 text-gray-800">
                  {row.quotationId && row.quotationRef
                    ? `${row.quotationId} [${row.quotationRef}]`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-800">{row.date}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-800">
                  {row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-gray-800">{row.status}</td>
                <td className="relative px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setMenuOpenId(menuOpenId === row.id ? null : row.id)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpenId === row.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        aria-hidden
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-4 top-full z-20 mt-1 min-w-[160px] rounded border border-gray-200 bg-white py-1 shadow-lg">
                        <Link
                          href={`/purchase/orders/${row.id}`}
                          className="block px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => setMenuOpenId(null)}
                        >
                          View
                        </Link>
                        <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                          Export
                        </button>
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
          <button
            type="button"
            className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded border border-blue-600 bg-blue-600 px-3 py-1 text-sm text-white"
          >
            1
          </button>
          <button
            type="button"
            className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            2
          </button>
          <button
            type="button"
            className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            3
          </button>
          <button
            type="button"
            className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <select className="rounded border border-gray-200 bg-white px-2 py-1 text-sm">
            <option>20</option>
          </select>
          <span>/ {orders.length}</span>
        </div>
      </div>
    </div>
  );
}
