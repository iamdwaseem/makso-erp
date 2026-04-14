import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  History,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  User,
  Building2,
  Receipt,
  Truck,
  BarChart3,
  Settings,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const mainNavItems: { href: string; label: string; icon: typeof Home; adminOnly?: boolean; managerOrAdminOnly?: boolean }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inventory/dashboard", label: "Inventory", icon: Package },
  { href: "/history", label: "History", icon: History },
  { href: "/users", label: "Users", icon: User, managerOrAdminOnly: true },
  { href: "/warehouses", label: "Warehouses", icon: Building2, adminOnly: true },
];

// Inventory nav: Dashboard, Items, GRN, GDN, Transfer, Reports, Settings
const inventorySections = [
  { label: "Dashboard", href: "/inventory/dashboard", icon: LayoutDashboard, children: null as { href: string; label: string }[] | null },
  { label: "Items", href: "/inventory/items", icon: Package, children: null },
  { label: "Goods Receipt Note", href: "/inventory/receipt-notes", icon: Receipt, children: null },
  { label: "Goods Delivery Note", href: "/inventory/stock-exit", icon: Truck, children: null },
  { label: "Inventory Transfer", href: "/inventory/transfers", icon: RotateCcw, children: null },
  {
    label: "Reports",
    icon: BarChart3,
    href: null as string | null,
    children: [
      { href: "/inventory/reports/stock", label: "Stock Report" },
      { href: "/inventory/reports/summary", label: "Inventory Summary" },
      { href: "/inventory/reports/item-transactions", label: "Item Transactions" },
      { href: "/inventory/reports/low-stock", label: "Low Stock" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/inventory/settings",
    children: [
      { href: "/inventory/settings/categories", label: "Categories" },
      { href: "/inventory/settings/units", label: "Units" },
      { href: "/inventory/settings/brands", label: "Brands" },
      { href: "/inventory/settings/variants", label: "Variants" },
    ],
  },
];

function isPathActive(pathname: string, href: string | null, children: { href: string }[] | null): boolean {
  if (href && pathname === href) return true;
  if (href && pathname.startsWith(href + "/")) return true;
  if (children) {
    return children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
  }
  return false;
}

function isSectionExpanded(pathname: string, section: (typeof inventorySections)[0]): boolean {
  if (section.href && pathname.startsWith(section.href)) return true;
  if (section.children) {
    return section.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
  }
  return false;
}

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>("User");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const isInventory = location.pathname.startsWith("/inventory");
  const pathname = location.pathname;

  useEffect(() => {
    if (user?.name) setUserName(user.name);
    else {
      try {
        const raw = localStorage.getItem("wareflow_user");
        if (raw) {
          const u = JSON.parse(raw) as { name?: string };
          if (u?.name) setUserName(u.name);
        }
      } catch {
        // ignore
      }
    }
  }, [user]);

  // Auto-expand section when path matches
  useEffect(() => {
    if (!isInventory) return;
    setExpanded((prev) => {
      const next = { ...prev };
      inventorySections.forEach((sec) => {
        if (sec.children && isSectionExpanded(pathname, sec)) next[sec.label] = true;
      });
      return next;
    });
  }, [pathname, isInventory]);

  const mainItems = mainNavItems.filter((item) => {
    if (item.adminOnly) return user?.role === "ADMIN";
    if (item.managerOrAdminOnly) return user?.role === "MANAGER" || user?.role === "ADMIN";
    return true;
  });

  const toggleSection = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      data-sidebar
      className="flex w-[240px] shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl"
    >
      <div className="shrink-0 border-b border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
            <User className="h-5 w-5 text-white/90" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="truncate text-xs text-white/60">MAKSO Trading</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
        </div>
      </div>

      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        {isInventory ? (
          <Link
            to="/"
            className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            INVENTORY
          </Link>
        ) : (
          <>
            <div className="h-3 w-3 shrink-0 rounded-sm bg-[#dc2626]" />
            <span className="text-sm font-semibold tracking-tight">MAKSO Trading</span>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {isInventory ? (
          <ul className="space-y-0.5">
            {inventorySections
              .filter((sec) => sec.label !== "Settings" || user?.role === "MANAGER" || user?.role === "ADMIN")
              .map((sec) => {
              const Icon = sec.icon;
              const hasChildren = sec.children && sec.children.length > 0;
              const isOpen = expanded[sec.label] ?? false;
              const active = isPathActive(pathname, sec.href, sec.children ?? null);

              if (!hasChildren && sec.href) {
                return (
                  <li key={sec.label}>
                    <Link
                      to={sec.href}
                      className={`mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                        active
                          ? "bg-blue-500/20 font-medium text-white shadow-[0_0_20px_-2px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400/40 backdrop-blur-sm"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0 opacity-90" />
                      {sec.label}
                    </Link>
                  </li>
                );
              }

              if (hasChildren) {
                return (
                  <li key={sec.label}>
                    <button
                      type="button"
                      onClick={() => toggleSection(sec.label)}
                      className={`mx-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                        active ? "bg-white/10 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0 opacity-90" />
                      <span className="flex-1">{sec.label}</span>
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    {isOpen && (
                      <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                        {sec.children!.map((child) => {
                          const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
                          return (
                            <li key={child.href}>
                              <Link
                                to={child.href}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all ${
                                  childActive
                                    ? "bg-blue-500/20 font-medium text-white ring-1 ring-indigo-400/40"
                                    : "text-white/80 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              return null;
            })}
          </ul>
        ) : (
          mainItems.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname === href || (href !== "/" && location.pathname.startsWith(href));
            return (
              <Link
                key={href}
                to={href}
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
          })
        )}
      </nav>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <div className="h-6 w-6 shrink-0 rounded bg-[#dc2626]" />
          <span className="text-[10px] font-medium leading-tight text-white/80">
            MAKSO General Trading
          </span>
        </div>
      </div>
    </aside>
  );
}
