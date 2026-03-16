"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const settingLinks = [
  { href: "/settings/locations", label: "Locations" },
  { href: "/settings/centers", label: "Centers" },
  { href: "/settings/center-types", label: "Center Types" },
  { href: "/settings/routes", label: "Routes" },
  { href: "/settings/users", label: "Users" },
  { href: "/settings/user-roles", label: "User Roles" },
  { href: "/settings/number-settings", label: "Number Settings" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 p-6">
      <aside className="w-52 shrink-0">
        <Link
          href="/home"
          className="mb-3 flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Link>
        <nav className="rounded-lg border border-gray-200 bg-white py-2 shadow-sm">
          {settingLinks.map(({ href, label }) => {
            const isPlaceholder = href === "#";
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={isPlaceholder ? "#" : href}
                className={`block px-4 py-2.5 text-sm ${
                  isPlaceholder
                    ? "cursor-not-allowed text-gray-400"
                    : isActive
                      ? "bg-blue-50 font-medium text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={isPlaceholder ? (e) => e.preventDefault() : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
