"use client";

import Link from "next/link";

export type ReceiptNoteRow = {
  id: string;
  receiptNo?: string;
  date?: string;
  onTransaction?: string;
  sender?: string;
  supplierOrCustomer?: string;
  amount: number;
  status: string;
};

type Props = { notes: ReceiptNoteRow[] };

export default function ReceiptNoteTable({ notes }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Receipt No</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">On Transaction</th>
              <th className="px-4 py-3">Sender</th>
              <th className="px-4 py-3">Supplier / Customer</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {notes.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-xs">{row.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 font-medium">{row.receiptNo ?? row.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{row.date ?? "—"}</td>
                <td className="px-4 py-3">{row.onTransaction ?? "—"}</td>
                <td className="px-4 py-3">{row.sender ?? "—"}</td>
                <td className="px-4 py-3">{row.supplierOrCustomer ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{Number(row.amount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    row.status === "SUBMITTED" || row.status === "Approved" ? "bg-green-100 text-green-800" :
                    row.status === "DRAFT" || row.status === "Draft" ? "bg-gray-100 text-gray-700" :
                    row.status === "CANCELLED" || row.status === "Cancelled" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/inventory/receipt-notes/${row.id}`} className="text-blue-600 hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
