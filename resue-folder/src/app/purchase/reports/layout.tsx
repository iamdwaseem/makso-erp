"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const reportLinks = [
  { href: "/purchase/reports/bill-wise", label: "Purchase Report" },
  { href: "/purchase/reports/bill-wise-adv", label: "Purchase Report (Adv)" },
  { href: "/purchase/reports/supplier-statement", label: "Supplier Statement" },
  { href: "/purchase/reports/item-wise", label: "Item Wise Purchase Report" },
  { href: "/purchase/reports/employee-wise", label: "Employee Wise Purchase Report" },
  { href: "/purchase/reports/supplier-aging", label: "Supplier Aging" },
  { href: "/purchase/reports/cancelled-invoices", label: "Cancelled Purchase Invoices" },
  { href: "/purchase/reports/cancelled-debit-notes", label: "Cancelled Debit Notes" },
  { href: "/purchase/reports/month-wise-outstanding", label: "Month Wise Outstanding" },
  { href: "/purchase/reports/foc", label: "FOC Report" },
  { href: "/purchase/reports/payment", label: "Payment Report" },
  { href: "/purchase/reports/month-wise", label: "Month Wise Purchase" },
  { href: "/purchase/reports/month-wise-item-wise", label: "Month Wise Item Wise Purchase" },
  { href: "/purchase/reports/expense", label: "Purchase Expense Report" },
  { href: "/purchase/reports/item-quotes", label: "Item Quotes" },
  { href: "/purchase/reports/quotation-wise", label: "Quotation Wise Purchase" },
];

export default function PurchaseReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 p-6">
      <aside className="w-56 shrink-0">
        <div className="rounded-lg border border-gray-200 bg-white py-2 shadow-sm">
          <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500">
            Reports
          </div>
          <nav className="flex flex-col">
            {reportLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2.5 text-sm ${
                  pathname === href
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
