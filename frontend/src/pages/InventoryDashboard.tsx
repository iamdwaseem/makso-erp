import { useEffect, useState } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useWarehouseStore } from "../store/warehouseStore";

const COLORS = ["#7dd3fc", "#0d9488", "#f97316", "#a855f7", "#9ca3af"];

export type DashboardPeriod =
  | "last_7_days"
  | "last_30_days"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "custom";

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
  { value: "last_year", label: "Last year" },
  { value: "custom", label: "Custom" },
];

interface LowStockRow {
  variantId: string;
  product: string;
  variant: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
}

interface ItemGroupPoint {
  name: string;
  value: number;
  color?: string;
}

interface TrendPoint {
  date: string;
  value: number;
}

export function InventoryDashboard() {
  const { currentWarehouseId } = useWarehouseStore();
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [itemGroups, setItemGroups] = useState<ItemGroupPoint[]>([]);
  const [productsToReorder, setProductsToReorder] = useState<LowStockRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [counts, setCounts] = useState<{ totalUnits?: number; totalProducts?: number; totalVariants?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<DashboardPeriod>("last_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [gainLoss, setGainLoss] = useState<{ gain: number; loss: number }>({ gain: 0, loss: 0 });
  const [chartsLoading, setChartsLoading] = useState(false);
  const navigate = useNavigate();

  const warehouseId = currentWarehouseId && currentWarehouseId !== "all" ? currentWarehouseId : undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = warehouseId ? { warehouseId } : {};
    api
      .get("/dashboard/stats", { params })
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        const c = data?.counts ?? {};
        setCounts(c);
        setLowStockCount(c.lowStockCount ?? (data?.lowStockRows?.length ?? 0));
        const groups = (data?.itemGroups ?? []).map((g: ItemGroupPoint, i: number) => ({
          ...g,
          color: COLORS[i % COLORS.length],
        }));
        setItemGroups(groups);
        setProductsToReorder(data?.lowStockRows ?? data?.low_stock_rows ?? []);
        setRecentActivity(data?.recentActivity ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [warehouseId]);

  const trendParams = () => {
    const params: Record<string, string> = { period };
    if (warehouseId) params.warehouseId = warehouseId;
    if (period === "custom" && customStart) params.startDate = customStart;
    if (period === "custom" && customEnd) params.endDate = customEnd;
    return params;
  };

  useEffect(() => {
    if (period === "custom" && (!customStart || !customEnd)) {
      setTrendData([]);
      setGainLoss({ gain: 0, loss: 0 });
      return;
    }
    let cancelled = false;
    setChartsLoading(true);
    const params = trendParams();
    Promise.all([
      api.get("/dashboard/inventory/trend", { params }),
      api.get("/dashboard/inventory/gain-loss", { params }),
    ])
      .then(([trendRes, gainLossRes]) => {
        if (cancelled) return;
        setTrendData(trendRes.data?.data ?? []);
        setGainLoss({
          gain: gainLossRes.data?.gain ?? 0,
          loss: gainLossRes.data?.loss ?? 0,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setTrendData([]);
          setGainLoss({ gain: 0, loss: 0 });
        }
      })
      .finally(() => {
        if (!cancelled) setChartsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [warehouseId, period, customStart, customEnd]);

  const totalStockUnits = itemGroups.reduce((sum, g) => sum + (g.value ?? 0), 0);
  const displayUnits = counts?.totalUnits != null ? counts.totalUnits.toLocaleString() : totalStockUnits.toLocaleString();
  const metrics = {
    totalInventoryItems: itemGroups.length > 0 ? String(itemGroups.length) : (counts?.totalVariants != null ? String(counts.totalVariants) : "—"),
    lowStockItems: lowStockCount ?? "—",
    totalStockUnits: displayUnits,
  };
  // Cap pie segments to avoid overflow: top 8 by value, rest as "Other"
  const MAX_PIE_SEGMENTS = 8;
  const itemGroupData =
    itemGroups.length <= MAX_PIE_SEGMENTS
      ? itemGroups
      : (() => {
          const top = itemGroups.slice(0, MAX_PIE_SEGMENTS);
          const otherSum = itemGroups.slice(MAX_PIE_SEGMENTS).reduce((s, g) => s + (g.value ?? 0), 0);
          if (otherSum <= 0) return top;
          return [...top, { name: "Other", value: otherSum, color: "#9ca3af" }];
        })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
        INVENTORY DASHBOARD
      </h1>
      {error && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Stock (Units)", value: metrics.totalStockUnits },
          { label: "Total Inventory Items", value: metrics.totalInventoryItems },
          { label: "Low Stock Items", value: String(metrics.lowStockItems) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-semibold tabular-nums text-gray-900">
              {card.value}
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              {card.label}
            </div>
          </div>
        ))}
      </section>

      <section className="mb-6 flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-600">Period:</span>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {period === "custom" && (
          <>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              From
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              To
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
          </>
        )}
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 min-w-0">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm min-w-0 overflow-hidden">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Item Group Distribution
          </h3>
          <p className="mb-2 text-xs text-gray-500">Contribution of each item group to total inventory</p>
          <div className="h-[280px] min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={itemGroupData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {itemGroupData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => (value != null ? Number(value).toLocaleString() : "")} />
                <Legend layout="horizontal" align="center" wrapperStyle={{ paddingTop: 8 }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Inventory In-Hand
          </h3>
          <p className="mb-2 text-xs text-gray-500">Stock fluctuations over time</p>
          <div className="h-[280px]">
            {chartsLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
              </div>
            ) : trendData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No trend data for the selected period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData.map((p) => ({
                    ...p,
                    displayDate: p.date ? (() => {
                      const [y, m, d] = p.date.split("-");
                      return `${d}-${m}-${y?.slice(2) ?? ""}`;
                    })() : p.date,
                  }))}
                  margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                  <Tooltip
                    formatter={(value: unknown) => {
                      const n = typeof value === "number" ? value : Number(value ?? 0);
                      return [n.toLocaleString(), "Quantity"];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area type="monotone" dataKey="value" name="Quantity" stroke="#0d9488" fill="#0d9488" fillOpacity={0.3} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Inventory Gain / Loss
          </h3>
          <p className="mb-2 text-xs text-gray-500">Gain (stock in) vs Loss (stock out) for the selected period</p>
          <div className="h-[200px]">
            {chartsLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    { name: "Gain", value: gainLoss.gain, fill: "#0d9488" },
                    { name: "Loss", value: gainLoss.loss, fill: "#64748b" },
                  ]}
                  margin={{ top: 8, right: 24, left: 48, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))} />
                  <YAxis type="category" dataKey="name" width={44} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: unknown) => {
                      const n = typeof value === "number" ? value : Number(value ?? 0);
                      return n.toLocaleString();
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h3 className="text-sm font-bold text-gray-800">Low Stock Alerts</h3>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {productsToReorder.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/inventory/items")}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              View inventory →
            </button>
          </div>
          {productsToReorder.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mb-2 text-3xl">✅</div>
              <p className="text-sm text-gray-400">All stock levels are healthy</p>
            </div>
          ) : (
            <div className="max-h-72 divide-y divide-gray-50 overflow-y-auto">
              {productsToReorder.map((row) => (
                <div
                  key={row.variantId}
                  className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-red-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{row.product}</p>
                    <p className="text-xs font-mono text-gray-400">
                      {row.variant} · {row.sku}
                    </p>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        row.quantity === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.quantity === 0 ? "Out of stock" : `${row.quantity} left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <h3 className="text-sm font-bold text-gray-800">Recent Movements</h3>
            </div>
            <button
              type="button"
              onClick={() => navigate("/history")}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Full history →
            </button>
          </div>
          {recentActivity.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No recent activity.
            </div>
          ) : (
            <div className="max-h-72 divide-y divide-gray-50 overflow-y-auto">
              {recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                      entry.action === "IN" ? "bg-emerald-500" : "bg-orange-500"
                    }`}
                  >
                    {entry.action === "IN" ? "↓" : "↑"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {entry.variant?.product?.name}
                      <span className="font-normal text-gray-400"> · {entry.variant?.color}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {(entry.referenceType ?? "").toLowerCase()} ·{" "}
                      {new Date(entry.createdAt ?? "").toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold ${
                      entry.action === "IN" ? "text-emerald-600" : "text-orange-600"
                    }`}
                  >
                    {entry.action === "IN" ? "+" : "−"}
                    {entry.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Products to Reorder
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Variant / SKU</th>
                <th className="px-4 py-3">Reorder Point</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Difference</th>
              </tr>
            </thead>
            <tbody>
              {productsToReorder.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No low-stock items (from API) or no data.
                  </td>
                </tr>
              ) : (
                productsToReorder.map((row) => (
                  <tr key={row.variantId} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.product}</td>
                    <td className="px-4 py-3 text-gray-800">{row.variant} / {row.sku}</td>
                    <td className="px-4 py-3 text-gray-800">{row.reorderLevel}</td>
                    <td className="px-4 py-3 text-gray-800">{row.quantity}</td>
                    <td className="px-4 py-3 font-medium text-orange-600">{row.reorderLevel - row.quantity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
