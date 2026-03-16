"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  User,
  ChevronDown,
  Calendar,
  Filter,
} from "lucide-react";
import { SHOW_SALES_PURCHASE } from "@/config/features";
import { logout } from "@/lib/api";
import { useGlobalFilter, type ModuleFilter } from "@/contexts/GlobalFilterContext";
import { WarehouseSelector } from "./WarehouseSelector";

const userMenuItems = [
  { label: "Company Settings", action: null },
  { label: "User Settings", action: null },
  { label: "Transaction Preferences", action: null },
  { label: "Company Details", action: null },
  { label: "Logout", action: "logout" as const },
];

const MODULE_OPTIONS: { value: ModuleFilter; label: string; path: string; visible?: boolean }[] = [
  { value: "all", label: "All modules", path: "/home" },
  { value: "sales", label: "Sales", path: "/home/sales", visible: SHOW_SALES_PURCHASE },
  { value: "purchase", label: "Purchase", path: "/purchase/dashboard", visible: SHOW_SALES_PURCHASE },
  { value: "inventory", label: "Inventory", path: "/inventory/dashboard" },
].filter((o) => o.visible !== false);

const glassInput =
  "rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm px-3 py-2 text-sm text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/20 focus:border-white/25";

function formatDateRange(dateFrom: string, dateTo: string): string {
  if (!dateFrom || !dateTo) return "Select date range";
  const [y1, m1] = dateFrom.split("-").map(Number);
  const [y2, m2] = dateTo.split("-").map(Number);
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  const d1 = dateFrom.slice(8, 10);
  const fromStr = `${d1}-${months[m1 - 1]}`;
  const toStr = m1 !== m2 || y1 !== y2 ? ` ${months[m2 - 1]} ${y2}` : "";
  return `${fromStr} - ${months[m2 - 1]} ${y2}`;
}

export default function TopNavbar() {
  const router = useRouter();
  const {
    dateFrom,
    dateTo,
    moduleFilter,
    searchQuery,
    setDateRange,
    setModuleFilter,
    setSearchQuery,
  } = useGlobalFilter();

  const [userOpen, setUserOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [localFrom, setLocalFrom] = useState(dateFrom);
  const [localTo, setLocalTo] = useState(dateTo);

  const userRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalFrom(dateFrom);
    setLocalTo(dateTo);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        userRef.current?.contains(target) ||
        bellRef.current?.contains(target) ||
        filterRef.current?.contains(target) ||
        dateRef.current?.contains(target) ||
        searchRef.current?.contains(target)
      )
        return;
      setUserOpen(false);
      setBellOpen(false);
      setFilterOpen(false);
      setDateRangeOpen(false);
      setSearchFocused(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentModuleLabel = MODULE_OPTIONS.find((o) => o.value === moduleFilter)?.label ?? "Top Global Filter";

  const applyDateRange = () => {
    if (localFrom && localTo && localFrom <= localTo) {
      setDateRange(localFrom, localTo);
      setDateRangeOpen(false);
    }
  };

  const searchTargets = [
    { label: "Search in Sales", path: "/home/sales", param: "q" },
    { label: "Search in Purchase", path: "/purchase/dashboard", param: "q" },
    { label: "Search in Inventory", path: "/inventory/dashboard", param: "q" },
  ];

  return (
    <header
      data-topnav
      className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 text-white bg-white/[0.06] backdrop-blur-xl"
    >
      <div className="flex flex-1 items-center gap-3">
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => {
              setFilterOpen(!filterOpen);
              setBellOpen(false);
              setUserOpen(false);
              setDateRangeOpen(false);
            }}
            className={`flex items-center gap-2 ${glassInput} hover:bg-white/10 transition-colors`}
            aria-label="Top global filter"
          >
            <Filter className="h-4 w-4 text-white/70" />
            <span className="text-white/95">{currentModuleLabel}</span>
            <ChevronDown className="h-4 w-4 text-white/60" />
          </button>
          {filterOpen && (
            <div className="glass-card absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-white/10 py-1 text-white shadow-xl">
              {MODULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 ${moduleFilter === opt.value ? "bg-white/10 font-medium" : "text-white/90"}`}
                  onClick={() => {
                    setModuleFilter(opt.value);
                    setFilterOpen(false);
                    router.push(opt.path);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={dateRef}>
          <button
            type="button"
            onClick={() => {
              setDateRangeOpen(!dateRangeOpen);
              setFilterOpen(false);
            }}
            className={`flex items-center gap-2 ${glassInput} hover:bg-white/10 transition-colors min-w-[200px]`}
            aria-label="Date range"
          >
            <Calendar className="h-4 w-4 text-white/70 shrink-0" />
            <span className="text-white/95 truncate">{formatDateRange(dateFrom, dateTo)}</span>
            <ChevronDown className="h-4 w-4 text-white/60 shrink-0" />
          </button>
          {dateRangeOpen && (
            <div className="glass-card absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-white/10 p-4 shadow-xl">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/70">From</label>
                  <input
                    type="date"
                    value={localFrom}
                    onChange={(e) => setLocalFrom(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/70">To</label>
                  <input
                    type="date"
                    value={localTo}
                    onChange={(e) => setLocalTo(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyDateRange}
                  className="w-full rounded-lg bg-white/15 py-2 text-sm font-medium text-white hover:bg-white/25"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative flex flex-1 max-w-md" ref={searchRef}>
          <div
            className={`flex flex-1 items-center gap-2 ${glassInput} focus-within:ring-2 focus-within:ring-white/20 focus-within:border-white/25`}
            onFocus={() => setSearchFocused(true)}
          >
            <Search className="h-4 w-4 text-white/50 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 min-w-0 bg-transparent text-white placeholder-white/50 outline-none"
              aria-label="Search"
            />
          </div>
          {searchFocused && (
            <div className="glass-card absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-white/10 py-1 text-white shadow-xl">
              {searchQuery.trim() ? (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-white/60">Search in module</div>
                  {searchTargets.map((t) => (
                    <Link
                      key={t.path}
                      href={`${t.path}?${t.param}=${encodeURIComponent(searchQuery.trim())}`}
                      className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                      onClick={() => setSearchFocused(false)}
                    >
                      {t.label}
                    </Link>
                  ))}
                </>
              ) : (
                <div className="px-4 py-3 text-sm text-white/50">Type to search across Sales, Purchase, Inventory</div>
              )}
            </div>
          )}
        </div>
      </div>

      <WarehouseSelector />

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => {
              setBellOpen(!bellOpen);
              setUserOpen(false);
              setFilterOpen(false);
              setDateRangeOpen(false);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-white/90" />
          </button>
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white/[0.06]" aria-hidden />
          {bellOpen && (
            <div className="glass-card absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-white/10 py-2 text-white shadow-xl">
              <div className="px-4 py-2 text-sm font-medium text-white/80">Notifications</div>
              <div className="px-4 py-3 text-sm text-white/60">No new notifications.</div>
            </div>
          )}
        </div>
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => {
              setUserOpen(!userOpen);
              setBellOpen(false);
              setFilterOpen(false);
              setDateRangeOpen(false);
            }}
            className={`flex items-center gap-1.5 ${glassInput} hover:bg-white/10 transition-colors`}
            aria-label="User menu"
          >
            <User className="h-4 w-4 text-white/80" />
            <ChevronDown className="h-4 w-4 text-white/60" />
          </button>
          {userOpen && (
            <div className="glass-card absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-white/10 py-1 text-white shadow-xl">
              {userMenuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                  onClick={() => {
                    if (item.action === "logout") {
                      logout();
                      setUserOpen(false);
                      router.replace("/login");
                      router.refresh();
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
