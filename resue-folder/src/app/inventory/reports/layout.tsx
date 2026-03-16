"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const reportLinks = [
  { href: "/inventory/reports/stock", label: "Stock Report" },
  { href: "/inventory/reports/summary", label: "Inventory Summary" },
  { href: "/inventory/reports/item-wise", label: "Item Wise Report" },
  { href: "/inventory/reports/center-wise", label: "Center Wise Report" },
  { href: "/inventory/reports/item-transactions", label: "Item Transactions" },
  { href: "/inventory/reports/item-enquiry", label: "Item Enquiry" },
  { href: "/inventory/reports/center-summary", label: "Center Summary" },
  { href: "/inventory/reports/item-wise-adjustment", label: "Item Wise Inventory Adjustment" },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="p-6">
      <div className="mb-4 flex gap-2 border-b border-gray-200 pb-2">
        {reportLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded px-3 py-1.5 text-sm font-medium ${pathname === href ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
