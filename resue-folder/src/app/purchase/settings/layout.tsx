"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const settingLinks = [
  { href: "/purchase/settings", label: "Overview" },
  { href: "/purchase/settings/pricing", label: "Pricing" },
  { href: "/purchase/settings/pricing-rule", label: "Pricing Rule" },
  { href: "/purchase/settings/supplier-rate-tracking", label: "Supplier Rate Tracking" },
  { href: "/purchase/settings/supplier-groups", label: "Supplier Group" },
  { href: "/purchase/settings/purchase-types", label: "Purchase Types" },
  { href: "/purchase/settings/purchase-tax-config", label: "Purchase Tax Config" },
  { href: "/purchase/settings/expense-types", label: "Purchase Expense Types" },
  { href: "/purchase/settings/return-reason", label: "Purchase Return Reason" },
  { href: "/purchase/settings/opening-balance", label: "Opening Balance" },
  { href: "/purchase/settings/bill-settings", label: "Purchase Settings" },
];

export default function PurchaseSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 p-6">
      <aside className="w-52 shrink-0">
        <Link
          href="/purchase/settings"
          className="mb-3 flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Purchase Settings
        </Link>
        <nav className="rounded-lg border border-gray-200 bg-white py-2 shadow-sm">
          {settingLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-4 py-2.5 text-sm ${
                pathname === href ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
