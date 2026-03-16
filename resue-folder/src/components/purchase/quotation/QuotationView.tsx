"use client";

import { useState } from "react";
import type { PurchaseQuotation } from "@/mock/purchaseQuotations";
import { MoreVertical } from "lucide-react";

const VIEW_ACTIONS = [
  "Cancel",
  "Create Order",
  "Add/Update Note",
  "Master Update",
  "Print",
  "Export",
];

type QuotationViewProps = {
  quotation: PurchaseQuotation;
  onClose: () => void;
  onAction?: (action: string) => void;
};

const COMPANY = {
  name: "MAKSO Trading",
  nameAr: "شركة فري سبيس للتجارة العامة ذ م م",
  address: "Port Saeed, Deira City Center, Dubai, UAE",
  phone: "+971 567 360313, +91 9747370088",
  email: "info@maksotrading.com",
  website: "https://maksotrading.com",
  trn: "123123123123123",
};

export default function QuotationView({ quotation, onClose, onAction }: QuotationViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
        <h2 className="text-lg font-semibold uppercase">
          PURCHASE QUOTATION / {quotation.id}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded p-2 text-white/90 hover:bg-white/10"
            aria-label="Print"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2h-2m-4-1v8m-8 0V9a2 2 0 012-2h2M7 7h10" />
            </svg>
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
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded border border-gray-200 bg-[#1e293b] py-1 shadow-lg">
                  {VIEW_ACTIONS.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => {
                        onAction?.(action);
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-white/90 hover:bg-white/10"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 flex items-start justify-between">
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
          {quotation.status === "Approved" && (
            <div className="rounded border-2 border-dashed border-blue-300 bg-blue-50/50 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-blue-700" style={{ transform: "rotate(-8deg)" }}>
              APPROVED
            </div>
          )}
        </div>

        <div className="mb-6 flex gap-8">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">From:</p>
            <p className="font-medium text-gray-900">{quotation.supplier}</p>
            <p className="text-sm text-gray-600">Billing Address: —</p>
          </div>
          <div className="ml-auto shrink-0">
            <table className="text-sm">
              <tbody>
                <tr>
                  <td className="pr-4 text-gray-500">Number #</td>
                  <td className="font-medium">{quotation.number}</td>
                </tr>
                <tr>
                  <td className="pr-4 text-gray-500">Date</td>
                  <td>{quotation.date}</td>
                </tr>
                <tr>
                  <td className="pr-4 text-gray-500">Inventory Center</td>
                  <td>Warehouse</td>
                </tr>
                <tr>
                  <td className="pr-4 text-gray-500">Employee</td>
                  <td>Mohammed Hussen</td>
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
            <tr className="border-b border-gray-100">
              <td className="px-3 py-2">1</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">0</td>
              <td className="px-3 py-2">{quotation.amount.toFixed(2)}</td>
            </tr>
            <tr className="border-b border-gray-200 bg-gray-50 font-medium">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">0</td>
              <td className="px-3 py-2">{quotation.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-between">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Grand Total In Words:</span>{" "}
            {quotation.amount < 1000
              ? `${quotation.amount.toFixed(2)} AED ONLY`
              : "—"}
          </p>
          <p className="text-sm font-medium">
            Total In AED: {quotation.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}
