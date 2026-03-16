"use client";

import Link from "next/link";

const settings = [
  { href: "/purchase/settings/pricing", name: "Pricing", desc: "Set pricing for items. Different prices per item." },
  { href: "/purchase/settings/pricing-rule", name: "Pricing Rule", desc: "Create new pricing rules." },
  { href: "/purchase/settings/supplier-rate-tracking", name: "Supplier Rate Tracking", desc: "Create or update supplier rates for specific items." },
  { href: "/purchase/settings/supplier-groups", name: "Supplier Group", desc: "Create and manage supplier groups." },
  { href: "/purchase/settings/purchase-types", name: "Purchase Types", desc: "Create and manage purchase types." },
  { href: "/purchase/settings/purchase-tax-config", name: "Purchase Tax Config", desc: "Set taxes for items and item groups." },
  { href: "/purchase/settings/expense-types", name: "Purchase Expense Types", desc: "Create expense types (Freight, Handling, Insurance)." },
  { href: "/purchase/settings/return-reason", name: "Purchase Return Reason", desc: "Create return reasons for purchase returns." },
  { href: "/purchase/settings/opening-balance", name: "Opening Balance", desc: "Add supplier opening balance." },
  { href: "/purchase/settings/bill-settings", name: "Purchase Settings", desc: "Discount settings and Bill Layout for purchase bills." },
];

export default function PurchaseSettingsPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">PURCHASE SETTINGS</h1>
      <p className="mb-6 text-sm text-gray-500">Configure supplier groups, purchase types, expense types, and taxes.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settings.map(({ href, name, desc }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:border-blue-200 hover:shadow-md"
          >
            <h2 className="font-semibold text-gray-900">{name}</h2>
            <p className="mt-2 text-sm text-gray-500">{desc}</p>
            <span className="mt-3 inline-block text-sm font-medium text-blue-600">Configure →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
