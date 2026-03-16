"use client";

import { Printer, Copy, MoreVertical } from "lucide-react";
import { useState } from "react";

const COMPANY = {
  name: "MAKSO Trading",
  address: "Port Saeed, Deira City Center, Dubai, UAE",
  phone: "+971 567 360313, +91 9747370088",
  email: "info@maksotrading.com",
  website: "https://maksotrading.com",
  trn: "123123123123123",
};

export type PurchaseInvoiceDetailView = {
  invoiceNo: string;
  invoiceDate: string;
  orderId?: string | null;
  supplier: string;
  supplierAddress?: string;
  supplierPhone?: string;
  contactPerson?: string;
  center?: string;
  employee?: string;
  gstn?: string;
  suppInvoiceNo?: string;
  payMode?: string;
  items: { slNo: number; item: string; quantity: number; unit: string; rate: number; amount: number; vatPercent?: number; vatAmount?: number; total?: number }[];
  subtotal?: number;
  discount?: number;
  taxableAmount?: number;
  taxAmount?: number;
  grandTotal: number;
  grandTotalWords?: string;
  balance?: number;
};

type Props = { invoice: PurchaseInvoiceDetailView };

export default function PurchaseInvoiceView({ invoice }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm" id="purchase-invoice-print">
      {/* Toolbar - hidden when printing */}
      <div className="no-print flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
        <h2 className="text-lg font-semibold uppercase">PURCHASE INVOICE / {invoice.invoiceNo}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            aria-label="Print"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button type="button" className="rounded p-2 text-white/90 hover:bg-white/10" aria-label="Copy">
            <Copy className="h-5 w-5" />
          </button>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded p-2 text-white/90 hover:bg-white/10" aria-label="Menu">
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded border border-gray-200 bg-white py-1 text-gray-800 shadow-lg">
                  <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Create Payment</button>
                  <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Export PDF</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Printable invoice body */}
      <div className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{COMPANY.name}</h3>
            <p className="mt-1 text-sm text-gray-600">{COMPANY.address}</p>
            <p className="text-xs text-gray-600">{COMPANY.phone} | {COMPANY.email}</p>
            <p className="text-xs text-gray-600">TRN: {COMPANY.trn}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">TAX INVOICE</p>
            <p className="mt-2 text-sm font-medium text-gray-700">Invoice # {invoice.invoiceNo}</p>
            <p className="text-sm text-gray-600">Date: {invoice.invoiceDate}</p>
            {invoice.orderId && (
              <p className="text-sm text-gray-600">Order Ref: {invoice.orderId}</p>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Bill to / Supplier</p>
            <p className="font-semibold text-gray-900">{invoice.supplier}</p>
            <p className="text-sm text-gray-600">{invoice.supplierAddress ?? "—"}</p>
            <p className="text-sm text-gray-600">Phone: {invoice.supplierPhone ?? "—"}</p>
            <p className="text-sm text-gray-600">Contact: {invoice.contactPerson ?? "—"}</p>
            {invoice.gstn && <p className="text-sm text-gray-600">GSTN / TRN: {invoice.gstn}</p>}
          </div>
          <div className="text-right text-sm">
            <p><span className="text-gray-500">Supplier Inv No:</span> {invoice.suppInvoiceNo ?? "—"}</p>
            <p><span className="text-gray-500">Center:</span> {invoice.center ?? "—"}</p>
            <p><span className="text-gray-500">In Charge:</span> {invoice.employee ?? "—"}</p>
            <p><span className="text-gray-500">Payment Mode:</span> {invoice.payMode ?? "—"}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-50 text-left text-xs font-medium uppercase text-gray-600">
              <th className="px-3 py-2">Sl.No</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-right">Quantity</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-right">VAT %</th>
              <th className="px-3 py-2 text-right">VAT Amount</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((row) => (
              <tr key={row.slNo} className="border-b border-gray-100">
                <td className="px-3 py-2">{row.slNo}</td>
                <td className="px-3 py-2">{row.item}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.quantity}</td>
                <td className="px-3 py-2">{row.unit}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.rate.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.vatPercent ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{(row.vatAmount ?? row.amount).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{(row.total ?? row.amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <table className="w-full max-w-xs text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600">Subtotal</td>
                <td className="py-1 text-right tabular-nums">{(invoice.subtotal ?? invoice.grandTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              {(invoice.discount ?? 0) > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">Discount</td>
                  <td className="py-1 text-right tabular-nums">({(invoice.discount ?? 0).toLocaleString()})</td>
                </tr>
              )}
              <tr>
                <td className="py-1 text-gray-600">Tax</td>
                <td className="py-1 text-right tabular-nums">{(invoice.taxAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="border-t-2 border-gray-300 font-semibold">
                <td className="py-2">Grand Total (AED)</td>
                <td className="py-2 text-right tabular-nums">{invoice.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              {(invoice.balance ?? 0) > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">Balance Due</td>
                  <td className="py-1 text-right tabular-nums font-medium">{(invoice.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm font-medium text-gray-700">Amount in words: {invoice.grandTotalWords ?? "—"}</p>

        <div className="mt-12 flex justify-between border-t border-gray-200 pt-8 text-sm text-gray-600">
          <p>Authorized Signature</p>
          <p>For {COMPANY.name}</p>
        </div>
      </div>
    </div>
  );
}
