"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";

export type PurchaseInvoiceRow = {
  id: string;
  invoiceNo?: string;
  suppInvoiceNo?: string;
  supplier?: string;
  gstn?: string;
  orderId?: string | null;
  orderRef?: string | null;
  invoiceDate?: string;
  amount: number;
  payMode?: string;
  status: string;
};

type PurchaseInvoiceTableProps = {
  invoices: PurchaseInvoiceRow[];
};

export default function PurchaseInvoiceTable({ invoices }: PurchaseInvoiceTableProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" aria-label="Select all" /></th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">INVOICE #</th>
              <th className="px-4 py-3">SUPP. INVOICE #</th>
              <th className="px-4 py-3">SUPPLIER</th>
              <th className="px-4 py-3">GSTN</th>
              <th className="px-4 py-3">ORDER [ID]</th>
              <th className="px-4 py-3">INVOICE DATE</th>
              <th className="px-4 py-3">AMOUNT</th>
              <th className="px-4 py-3">PAY. MODE</th>
              <th className="px-4 py-3">STATUS</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((row) => (
              <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-50/50 ${row.status === "Cancelled" ? "text-red-600" : ""}`}>
                <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                <td className="px-4 py-3 font-mono text-xs">{String(row.id).slice(0, 8)}…</td>
                <td className="px-4 py-3"><Link href={`/purchase/invoices/${row.id}`} className="hover:underline">{row.invoiceNo ?? row.id.slice(0, 8)}</Link></td>
                <td className="px-4 py-3">{row.suppInvoiceNo ?? "—"}</td>
                <td className="px-4 py-3">{row.supplier ?? "—"}</td>
                <td className="px-4 py-3">{row.gstn ?? "—"}</td>
                <td className="px-4 py-3">{row.orderId && row.orderRef ? `${row.orderId} [${row.orderRef}]` : "—"}</td>
                <td className="px-4 py-3">{row.invoiceDate ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{Number(row.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="px-4 py-3">{row.payMode ?? "—"}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="relative px-4 py-3">
                  <button type="button" onClick={() => setMenuOpenId(menuOpenId === row.id ? null : row.id)} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Actions">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpenId === row.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                      <div className="absolute right-4 top-full z-20 mt-1 min-w-[140px] rounded border border-gray-200 bg-white py-1 shadow-lg">
                        <Link href={`/purchase/invoices/${row.id}`} className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setMenuOpenId(null)}>View</Link>
                        <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Cancel</button>
                        <button type="button" className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100">Delete</button>
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
          <button type="button" className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">1</button>
          <button type="button" className="rounded border border-blue-600 bg-blue-600 px-3 py-1 text-sm text-white">2</button>
          <button type="button" className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">3</button>
          <button type="button" className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">Next</button>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <select className="rounded border border-gray-200 bg-white px-2 py-1 text-sm"><option>20</option></select>
          <span>/ {invoices.length}</span>
        </div>
      </div>
    </div>
  );
}
