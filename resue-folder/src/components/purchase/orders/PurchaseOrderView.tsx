"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Printer, MoreVertical, Pencil } from "lucide-react";

/** View model for purchase order detail (from API or mock) */
export type PurchaseOrderDetailView = {
  id: string;
  number: string;
  supplier: string;
  trn?: string;
  contactPerson: string;
  quotationId: string | null;
  quotationRef: string | null;
  date: string;
  amount: number;
  status: string;
  inventoryCenter: string;
  employee: string;
  items: { slNo: number; item: string; quantity: number; unit: string; price: number; amount: number; vatPercent: number; vatAmount: number; total: number }[];
  totalInAed: number;
  balance: number;
  grandTotalWords: string;
  receivedBy?: string;
  paymentPaid: boolean;
};

const ORDER_ACTIONS = [
  "Cancel",
  "Payment Out",
  "Create Invoice",
  "Purchase Expense",
  "Add/Update Note",
  "Master Update",
  "Print",
  "Export",
];

const COMPANY = {
  name: "MAKSO Trading",
  nameAr: "شركة فري سبيس للتجارة العامة ذ م م",
  address: "Port Saeed, Deira City Center, Dubai, UAE",
  phone: "+971 567 360313, +91 9747370088",
  email: "info@maksotrading.com",
  website: "https://maksotrading.com",
  trn: "123123123123123",
};

type PurchaseOrderViewProps = {
  order: PurchaseOrderDetailView;
};

export default function PurchaseOrderView({ order }: PurchaseOrderViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = order.items.reduce((s, i) => s + i.amount, 0);
  const totalVat = order.items.reduce((s, i) => s + i.vatAmount, 0);
  const grandTotal = order.items.reduce((s, i) => s + i.total, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
        <h2 className="text-lg font-semibold uppercase">
          PURCHASE ORDER / {order.id}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded p-2 text-white/90 hover:bg-white/10"
            aria-label="Copy"
          >
            <Copy className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded p-2 text-white/90 hover:bg-white/10"
            aria-label="Print"
          >
            <Printer className="h-5 w-5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded p-2 text-white/90 hover:bg-white/10"
              aria-label="Menu"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[200px] rounded border border-gray-200 bg-[#1e293b] py-1 shadow-lg">
                  {ORDER_ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="relative mb-6 flex items-start justify-between">
          <div className="flex gap-4">
            <div className="h-12 w-12 shrink-0 rounded bg-red-500" />
            <div>
              <h3 className="font-bold text-gray-900">{COMPANY.name}</h3>
              <p className="text-sm text-gray-500">{COMPANY.nameAr}</p>
              <p className="mt-1 text-xs text-gray-600">{COMPANY.address}</p>
              <p className="text-xs text-gray-600">
                {COMPANY.phone} | {COMPANY.email} | {COMPANY.website}
              </p>
              <p className="text-xs text-gray-600">TRN: {COMPANY.trn}</p>
            </div>
          </div>
          <div className="absolute right-0 top-0 flex gap-2">
            {order.status === "Received" && (
              <span className="rounded border border-gray-300 bg-gray-100/80 px-3 py-1 text-xs font-medium uppercase text-gray-500">
                RECEIVED
              </span>
            )}
            {!order.paymentPaid && (
              <span className="rounded border border-gray-300 bg-gray-100/80 px-3 py-1 text-xs font-medium uppercase text-gray-500">
                PAYMENT NOT PAID
              </span>
            )}
          </div>
        </div>

        <div className="mb-6 flex gap-8">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">To:</p>
            <p className="flex items-center gap-1 font-medium text-gray-900">
              {order.supplier}
              <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </p>
            <p className="text-sm text-gray-600">Billing Address: —</p>
            <p className="text-sm text-gray-600">Phone: +97145965225</p>
            <p className="text-sm text-gray-600">Email: amj@demo.xyz</p>
            <p className="text-sm text-gray-600">Contact Person: {order.contactPerson}</p>
          </div>
          <div className="ml-auto shrink-0">
            <table className="text-sm">
              <tbody>
                <tr>
                  <td className="pr-4 text-gray-500">Number #</td>
                  <td className="font-medium">—</td>
                </tr>
                <tr>
                  <td className="pr-4 text-gray-500">Date</td>
                  <td>{order.date}</td>
                </tr>
                <tr>
                  <td className="pr-4 text-gray-500">Quotation Ref No.</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td className="pr-4 text-gray-500">Quotation</td>
                  <td>
                    {order.quotationId ? (
                      <Link href="/purchase/quotations" className="text-blue-600 hover:underline">
                        {order.quotationId}[{order.quotationRef}]
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="pr-4 text-gray-500">Inventory Center</td>
                  <td>{order.inventoryCenter}</td>
                </tr>
                <tr>
                  <td className="pr-4 text-gray-500">Employee</td>
                  <td>{order.employee}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-3 py-2">Sl.No</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Quantity</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">VAT %</th>
              <th className="px-3 py-2">VAT Amount</th>
              <th className="px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((row) => (
              <tr key={row.slNo} className="border-b border-gray-100">
                <td className="px-3 py-2">{row.slNo}</td>
                <td className="px-3 py-2">{row.item}</td>
                <td className="px-3 py-2">{row.quantity}</td>
                <td className="px-3 py-2">{row.unit}</td>
                <td className="px-3 py-2">{row.price}</td>
                <td className="px-3 py-2">{row.amount}</td>
                <td className="px-3 py-2">{row.vatPercent}</td>
                <td className="px-3 py-2">{row.vatAmount}</td>
                <td className="px-3 py-2">{row.total}</td>
              </tr>
            ))}
            <tr className="border-b border-gray-200 bg-gray-50 font-medium">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">{totalQty}</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">{totalAmount}</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">{totalVat}</td>
              <td className="px-3 py-2">{grandTotal}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-between">
          <p className="text-sm font-medium text-gray-700">
            Grand Total In Words: {order.grandTotalWords}
          </p>
          <div className="text-right text-sm">
            <p className="font-medium">
              Total In AED: {order.totalInAed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="font-medium">Balance: {order.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-between border-t border-gray-200 pt-4 text-sm text-gray-600">
          <p>Received By: {order.receivedBy ?? "—"}</p>
          <p>For: {COMPANY.name}</p>
        </div>
      </div>
    </div>
  );
}
