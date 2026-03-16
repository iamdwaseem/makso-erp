"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  Tag,
  Package,
  ClipboardList,
  FileText,
  Settings,
  ChevronLeft,
  ChevronDown,
  LayoutDashboard,
  Truck,
  FileSearch,
  ShoppingBag,
  Wrench as WrenchIcon,
  Receipt,
  RotateCcw,
  FileMinus,
  CircleDollarSign,
  BarChart3,
  User,
} from "lucide-react";

import { SHOW_SALES_PURCHASE } from "@/config/features";

const mainNavItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/purchase/dashboard", label: "Purchase", icon: ShoppingCart, visible: SHOW_SALES_PURCHASE },
  { href: "/home/sales", label: "Sales", icon: Tag, visible: SHOW_SALES_PURCHASE },
  { href: "/inventory/dashboard", label: "Inventory", icon: Package },
  { href: "/settings/locations", label: "Settings", icon: Settings },
].filter((item) => (item as { visible?: boolean }).visible !== false);

const settingsNavItems = [
  { href: "/settings/locations", label: "Locations" },
  { href: "/settings/centers", label: "Centers" },
  { href: "/settings/center-types", label: "Center Types" },
  { href: "/settings/routes", label: "Routes" },
  { href: "/settings/users", label: "Users" },
  { href: "/settings/user-roles", label: "User Roles" },
  { href: "/settings/number-settings", label: "Number Settings" },
];

const purchaseNavItems = [
  { href: "/purchase/dashboard", label: "Purchase Dashboard", icon: LayoutDashboard },
  { href: "/purchase/suppliers", label: "Suppliers", icon: Truck },
  { href: "/purchase/quotations", label: "Purchase Quotation", icon: FileSearch },
  { href: "/purchase/orders", label: "Purchase Orders", icon: ShoppingBag },
  { href: "/purchase/work-orders", label: "Work Order", icon: WrenchIcon },
  { href: "/purchase/invoices", label: "Purchase Invoices", icon: Receipt },
  { href: "/purchase/return-orders", label: "Purchase Return Order", icon: RotateCcw },
  { href: "/purchase/debit-notes", label: "Debit Note", icon: FileMinus },
  { href: "/purchase/expenses", label: "Purchase Expenses", icon: CircleDollarSign },
  { href: "/purchase/reports", label: "Reports", icon: BarChart3 },
  { href: "/purchase/settings", label: "Settings", icon: Settings },
];

const inventoryNavItems = [
  { href: "/inventory/dashboard", label: "Inventory Dashboard", icon: LayoutDashboard },
  { href: "/inventory/items", label: "Items", icon: Package },
  { href: "/inventory/receipt-notes", label: "Good Recieved Notes", icon: Receipt },
  { href: "/inventory/stock-exit", label: "Good Delivered Notes", icon: Truck },
  { href: "/inventory/delivery-notes", label: "Delivery Notes", icon: FileText },
  { href: "/inventory/material-requests", label: "Material Request", icon: FileSearch },
  { href: "/inventory/transfers", label: "Inventory Transfer", icon: RotateCcw },
  { href: "/inventory/adjustment", label: "Inventory Adjustment", icon: WrenchIcon },
  { href: "/inventory/revaluation", label: "Inventory Revaluation", icon: BarChart3 },
  { href: "/inventory/conversion", label: "Inventory Conversion", icon: ClipboardList },
  { href: "/inventory/batches", label: "Batches", icon: FileText },
  { href: "/inventory/serial-status", label: "Serial No. Status Update", icon: Settings },
  { href: "/inventory/reports/stock", label: "Reports", icon: BarChart3 },
  { href: "/inventory/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>("User");
  const isPurchase = pathname.startsWith("/purchase");
  const isInventory = pathname.startsWith("/inventory");
  const isSettings = pathname.startsWith("/settings");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw) as { name?: string };
        if (u?.name) setUserName(u.name);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <aside
      data-sidebar
      className="flex w-[240px] shrink-0 flex-col text-white border-r border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
    >
      {/* User profile at top (glass reference) */}
      <div className="shrink-0 border-b border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
            <User className="h-5 w-5 text-white/90" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="truncate text-xs text-white/60">Main Branch</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
        </div>
      </div>

      {/* Brand or Module back */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        {isPurchase ? (
          <Link
            href="/home"
            className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            PURCHASE
          </Link>
        ) : isInventory ? (
          <Link
            href="/home"
            className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            INVENTORY
          </Link>
        ) : isSettings ? (
          <Link
            href="/home"
            className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            SETTINGS
          </Link>
        ) : (
          <>
            <div className="h-3 w-3 shrink-0 rounded-sm bg-[#dc2626]" />
            <span className="text-sm font-semibold tracking-tight">
              MAKSO Trading
            </span>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {isSettings ? (
          settingsNavItems.map(({ href, label }) => {
            const isActive = pathname === href;
            const isPlaceholder = href === "#";
            return (
              <Link
                key={label}
                href={isPlaceholder ? "#" : href}
                className={`mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  isPlaceholder ? "cursor-not-allowed text-white/50" : isActive ? "bg-blue-500/20 font-medium text-white shadow-[0_0_20px_-2px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400/40 backdrop-blur-sm" : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
                onClick={isPlaceholder ? (e) => e.preventDefault() : undefined}
              >
                {label}
              </Link>
            );
          })
        ) : (isPurchase ? purchaseNavItems : isInventory ? inventoryNavItems : mainNavItems).map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href === "/inventory/reports/stock" && pathname.startsWith("/inventory/reports")) ||
            (href === "/purchase/reports" && pathname.startsWith("/purchase/reports")) ||
            (href === "/inventory/settings" && pathname.startsWith("/inventory/settings")) ||
            (href === "/purchase/settings" && pathname.startsWith("/purchase/settings"));
          return (
            <Link
              key={href}
              href={href}
              className={`mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-blue-500/20 font-medium text-white shadow-[0_0_20px_-2px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400/40 backdrop-blur-sm"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 border border-white/10">
          <div className="h-6 w-6 shrink-0 rounded bg-[#dc2626]" />
          <span className="text-[10px] font-medium leading-tight text-white/80">
            MAKSO General Trading
          </span>
        </div>
      </div>
    </aside>
  );
}
