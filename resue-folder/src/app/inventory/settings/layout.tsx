"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const settingLinks = [
  { href: "/inventory/settings", label: "Overview" },
  { href: "/inventory/settings/item-groups", label: "Item Groups" },
  { href: "/inventory/settings/units", label: "Units" },
  { href: "/inventory/settings/brands", label: "Brands" },
  { href: "/inventory/settings/variants", label: "Variants" },
  { href: "/inventory/settings/item-unit-conversion", label: "Item Unit Conversion" },
  { href: "/inventory/settings/opening-inventory", label: "Opening Inventory" },
  { href: "/inventory/settings/label-print", label: "Label Print" },
  { href: "/inventory/settings/warehouse", label: "Aisle, Rack, Shelves & Bins" },
];

export default function InventorySettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSubPage = pathname !== "/inventory/settings";

  return (
    <div className="flex gap-6 p-6">
      <aside className="w-52 shrink-0">
        <Link
          href="/inventory/settings"
          className="mb-3 flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Inventory Settings
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
