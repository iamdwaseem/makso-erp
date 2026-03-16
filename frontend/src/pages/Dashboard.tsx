import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useWarehouseStore } from "../store/warehouseStore";
import { StatCard } from "../components/dashboard/StatCard";
import { FinanceCard } from "../components/dashboard/FinanceCard";
import { DashboardLineChart } from "../components/dashboard/DashboardLineChart";
import { DashboardBarChart } from "../components/dashboard/DashboardBarChart";
import { DashboardPieChart } from "../components/dashboard/DashboardPieChart";
import { CashBankTable } from "../components/dashboard/CashBankTable";
import { useApi } from "../hooks/useApi";

const CURRENCY = "AED";
const formatMoney = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + CURRENCY;

interface DashboardStats {
  counts: {
    totalProducts: number;
    totalVariants: number;
    totalSuppliers: number;
    totalCustomers: number;
    totalPurchases: number;
    totalSales: number;
    totalUnits: number;
    lowStockCount?: number;
  };
  lowStock: any[];
  topStocked: any[];
  recentActivity: any[];
}

interface LedgerEntry {
  id: string;
  action: "IN" | "OUT";
  quantity: number;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}

function LedgerModal({ item, onClose }: { item: any; onClose: () => void }) {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const variantId = item.variantId ?? item.variant?.id;
  const normalize = (e: any): LedgerEntry => ({
    id: e.id,
    action: (e.action === "OUT" ? "OUT" : "IN") as "IN" | "OUT",
    quantity: Number(e.quantity ?? 0),
    referenceType: e.reference_type ?? e.referenceType ?? "",
    referenceId: e.reference_id ?? e.referenceId ?? "",
    createdAt: e.created_at ?? e.createdAt ?? "",
  });
  useEffect(() => {
    if (!variantId) return;
    api
      .get(`/inventory/${variantId}/ledger`)
      .then((r) => {
        const raw = Array.isArray(r.data) ? r.data : [];
        const entries = raw.map(normalize);
        const asc = [...entries].reverse();
        let bal = 0;
        const withBal = asc.map((e: LedgerEntry & { balance?: number }) => {
          bal = e.action === "IN" ? bal + e.quantity : bal - e.quantity;
          return { ...e, balance: bal };
        });
        setLedger(withBal.reverse());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [variantId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-gray-100 bg-gray-50 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {item.variant?.product?.name} — {item.variant?.color}
            </h3>
            <p className="mt-0.5 text-xs font-mono text-gray-400">{item.variant?.sku}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-200">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading history…</div>
          ) : ledger.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No movements recorded.</div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Date & Time", "Action", "Reference", "Change", "Balance"].map((h) => (
                    <th key={h} className={`pb-3 text-xs font-medium uppercase text-gray-500 ${["Change", "Balance"].includes(h) ? "text-right" : "text-left"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ledger.map((e: any) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 text-sm text-gray-600">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${e.action === "IN" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                        {e.action}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm capitalize text-gray-500">
                      {e.referenceType.toLowerCase()} <span className="text-[10px] font-mono text-gray-400">{e.referenceId.slice(0, 8)}</span>
                    </td>
                    <td className={`py-3 pr-4 text-right text-sm font-bold ${e.action === "IN" ? "text-emerald-600" : "text-orange-600"}`}>
                      {e.action === "IN" ? "+" : "−"}
                      {e.quantity}
                    </td>
                    <td className="py-3 text-right text-sm font-semibold text-gray-700">{e.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

type LinePoint = { month: string; sale: number; purchase: number };
type BarPoint = { month: string; income: number; expense: number };

const emptyPieData: { name: string; value: number; color?: string }[] = [];
const emptyCashRows: { accountName: string; amount: string }[] = [];

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [ledgerItem, setLedgerItem] = useState<any>(null);
  const navigate = useNavigate();
  const currentWarehouseId = useWarehouseStore((s) => s.currentWarehouseId);

  type TrendPoint = { date: string; value: number };
  type GainLoss = { gain: number; loss: number };

  const {
    data: trendRaw,
  } = useApi<TrendPoint[]>("/dashboard/inventory/trend", {
    dependencies: [currentWarehouseId],
  });

  const {
    data: gainLossRaw,
  } = useApi<GainLoss>("/dashboard/inventory/gain-loss", {
    dependencies: [currentWarehouseId],
  });

  useEffect(() => {
    setLoading(true);
    api
      .get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentWarehouseId]);

  if (loading && !stats) {
    return (
      <div className="p-6">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500">Loading dashboard…</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 text-sm text-red-700 rounded-xl bg-red-50">
        Failed to load dashboard. Is the backend running?
      </div>
    );
  }

  const c = stats.counts;
  const lowCount = c.lowStockCount ?? stats.lowStock.length;

  const stockTrendData: LinePoint[] =
    trendRaw && Array.isArray(trendRaw) && trendRaw.length
      ? trendRaw.map((p) => ({
          month: p.date,
          sale: p.value,
          purchase: 0,
        }))
      : [{ month: "—", sale: 0, purchase: 0 }];

  const salePurchaseData: LinePoint[] = [
    { month: "Current", sale: c.totalSales, purchase: c.totalPurchases },
  ];

  const gainLossChartData: BarPoint[] =
    gainLossRaw && typeof gainLossRaw.gain === "number" && typeof gainLossRaw.loss === "number"
      ? [
          { month: "Current", income: gainLossRaw.gain, expense: gainLossRaw.loss },
        ]
      : [{ month: "—", income: 0, expense: 0 }];

  // KPI cards (resue-style)
  const kpiCards = [
    { value: String(c.totalUnits), label: "TOTAL STOCK (UNITS)", variant: "dark" as const },
    { value: String(c.totalSales), label: "TOTAL SALES", variant: "green" as const },
    { value: String(c.totalPurchases), label: "TOTAL PURCHASES", variant: "yellow" as const },
    { value: String(lowCount), label: "LOW STOCK ITEMS", variant: "red" as const },
    { value: String(c.totalProducts), label: "PRODUCTS", variant: "white" as const },
    { value: String(c.totalVariants), label: "VARIANTS", variant: "white" as const },
    { value: String(c.totalSuppliers), label: "SUPPLIERS", variant: "white" as const },
  ];

  // Inventory by product (from topStocked)
  const productSums = stats.topStocked.reduce<Record<string, number>>((acc, i) => {
    const name = i.variant?.product?.name ?? "Product";
    acc[name] = (acc[name] ?? 0) + (i.quantity ?? 0);
    return acc;
  }, {});
  const pieData = Object.entries(productSums)
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.slice(0, 20), value }));

  const financeCards = [
    { title: "OPEN SALE INVOICES", value: "—", variant: "dark" as const, actions: [{ label: "+ NEW", type: "new" as const }, { label: "LIST", type: "list" as const }] },
    { title: "OPEN PURCHASE INVOICES", value: "—", variant: "dark" as const, actions: [{ label: "+ NEW", type: "new" as const }, { label: "LIST", type: "list" as const }] },
    { title: "TOTAL SALES", value: String(c.totalSales), variant: "green" as const },
    { title: "TOTAL PURCHASES", value: String(c.totalPurchases), variant: "yellow" as const },
    { title: "STOCK UNITS", value: String(c.totalUnits), variant: "white" as const },
  ];

  const maxInventoryQty = Math.max(...stats.topStocked.map((i) => i.quantity), 1);
  const critical = stats.lowStock.filter((i) => i.quantity === 0);

  return (
    <div className="p-6">
      {ledgerItem && <LedgerModal item={ledgerItem} onClose={() => setLedgerItem(null)} />}

      {/* Header (resue-style) */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">DASHBOARD</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">All Employees</span>
          <select className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
            <option>All</option>
          </select>
          <select className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
            <option>Last 12 months</option>
            <option>This month</option>
            <option>Last month</option>
          </select>
        </div>
      </div>

      {/* KPI StatCards */}
      <section className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {kpiCards.map((card) => (
            <StatCard key={card.label} value={card.value} label={card.label} variant={card.variant} />
          ))}
        </div>
      </section>

      {/* Charts row */}
      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardLineChart
          data={stockTrendData}
          title="STOCK LEVEL (INVENTORY TREND)"
          nameFirst="Stock Level"
          nameSecond=" "
          valueSuffix=""
        />
        <DashboardLineChart data={salePurchaseData} title="SALE AND PURCHASE" valueSuffix="" />
        <DashboardBarChart data={gainLossChartData} title="INVENTORY GAIN AND LOSS" />
      </section>

      {/* Finance cards */}
      <section className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {financeCards.map((card) => (
            <FinanceCard key={card.title} title={card.title} value={card.value} variant={card.variant} actions={card.actions} />
          ))}
        </div>
      </section>

      {/* Pie + Cash table */}
      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardPieChart data={pieData.length ? pieData : emptyPieData} title="INVENTORY BY PRODUCT" />
        <div className="lg:col-span-2">
          <CashBankTable rows={emptyCashRows} total="—" title="CASH / CASH EQUIVALENTS" />
        </div>
      </section>

      {/* Inventory-specific low stock and movements moved to Inventory Dashboard */}
    </div>
  );
}
