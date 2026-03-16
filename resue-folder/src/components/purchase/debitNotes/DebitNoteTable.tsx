"use client";

import { useState } from "react";
import type { DebitNote } from "@/mock/debitNotes";
import { MoreVertical } from "lucide-react";

type DebitNoteTableProps = {
  notes: DebitNote[];
};

export default function DebitNoteTable({ notes }: DebitNoteTableProps) {
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" aria-label="Select all" /></th>
              <th className="px-4 py-3">Id</th>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">TRN</th>
              <th className="px-4 py-3">Center</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Invoice Id</th>
              <th className="px-4 py-3">PO Id</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">PayMode</th>
              <th className="px-4 py-3">Status</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {notes.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                <td className="px-4 py-3 text-gray-800">{row.id}</td>
                <td className="px-4 py-3 text-gray-800">{row.number}</td>
                <td className="px-4 py-3 text-gray-800">{row.supplier}</td>
                <td className="px-4 py-3 text-gray-800">{row.reference || "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.trn || "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.center}</td>
                <td className="px-4 py-3 text-gray-800">{row.date}</td>
                <td className="px-4 py-3 text-gray-800">{row.invoiceId || "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.poId || "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.reason}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-800">{row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-gray-800">{row.payMode}</td>
                <td className="px-4 py-3 text-gray-800">{row.status}</td>
                <td className="relative px-4 py-3">
                  <button type="button" onClick={() => setMenuOpenId(menuOpenId === row.id ? null : row.id)} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Actions">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpenId === row.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                      <div className="absolute right-4 top-full z-20 mt-1 min-w-[140px] rounded border border-gray-200 bg-white py-1 shadow-lg">
                        <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">View/Edit</button>
                        <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Approve</button>
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
    </div>
  );
}
