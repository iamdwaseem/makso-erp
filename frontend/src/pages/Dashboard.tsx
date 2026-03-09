import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface DashboardStats {
  counts: {
    totalProducts: number;
    totalVariants: number;
    totalSuppliers: number;
    totalCustomers: number;
    totalPurchases: number;
    totalSales: number;
    totalUnits: number;
  };
  lowStock: any[];
  recentActivity: any[];
  inventory: any[];
}

interface LedgerEntry {
  id: string;
  action: "IN" | "OUT";
  quantity: number;
  reference_type: string;
  reference_id: string;
  created_at: string;
}

// Inline ledger modal (same as Inventory page)
function LedgerModal({ item, onClose }: { item: any; onClose: () => void }) {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inventory/${item.variant_id}/ledger`)
      .then(r => {
        // compute running balance
        const asc = [...r.data].reverse();
        let bal = 0;
        const withBal = asc.map((e: LedgerEntry) => {
          bal = e.action === "IN" ? bal + e.quantity : bal - e.quantity;
          return { ...e, balance: bal };
        });
        setLedger(withBal.reverse());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [item.variant_id]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {item.variant?.product?.name} — {item.variant?.color}
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{item.variant?.sku}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading history…</div>
          ) : ledger.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No movements recorded.</div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Date & Time", "Action", "Reference", "Change", "Balance"].map(h => (
                    <th key={h} className={`pb-3 text-xs font-medium text-gray-500 uppercase ${["Change","Balance"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ledger.map((e: any) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-3 text-sm text-gray-600 pr-4">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${e.action === "IN" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>{e.action}</span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-500 capitalize">{e.reference_type.toLowerCase()} <span className="text-[10px] font-mono text-gray-400">{e.reference_id.slice(0,8)}</span></td>
                    <td className={`py-3 pr-4 text-sm font-bold text-right ${e.action === "IN" ? "text-emerald-600" : "text-orange-600"}`}>{e.action === "IN" ? "+" : "−"}{e.quantity}</td>
                    <td className="py-3 text-sm font-semibold text-right text-gray-700">{e.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [ledgerItem, setLedgerItem] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/dashboard/stats")
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-red-500 p-4 bg-red-50 rounded-xl text-sm">Failed to load dashboard. Is the backend running?</div>;
  }

  const maxInventoryQty = Math.max(...stats.inventory.map(i => i.quantity), 1);

  // Top stocked (highest qty)
  const topStocked = [...stats.inventory]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  // Critical items (0 stock)
  const critical = stats.inventory.filter(i => i.quantity === 0);

  const statCards = [
    {
      label: "Products",
      value: stats.counts.totalProducts,
      sub: `${stats.counts.totalVariants} variants`,
      icon: "📦",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      clickable: false,
    },
    {
      label: "Units in Stock",
      value: stats.counts.totalUnits,
      sub: "across all variants",
      icon: "📊",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      clickable: true,
      to: "/inventory",
    },
    {
      label: "Suppliers",
      value: stats.counts.totalSuppliers,
      sub: "active partners",
      icon: "🏭",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      clickable: false,
    },
    {
      label: "Customers",
      value: stats.counts.totalCustomers,
      sub: "on record",
      icon: "👥",
      bg: "bg-pink-50",
      text: "text-pink-700",
      border: "border-pink-100",
      clickable: false,
    },
    {
      label: "Purchases",
      value: stats.counts.totalPurchases,
      sub: "total orders",
      icon: "📥",
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-100",
      clickable: true,
      to: "/history",
    },
    {
      label: "Sales",
      value: stats.counts.totalSales,
      sub: "total orders",
      icon: "📤",
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-100",
      clickable: true,
      to: "/history",
    },
  ];

  return (
    <div className="space-y-6">
      {ledgerItem && <LedgerModal item={ledgerItem} onClose={() => setLedgerItem(null)} />}

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(card => {
          const inner = (
            <>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{card.icon}</span>
                {card.clickable && (
                  <svg className={`w-4 h-4 ${card.text} opacity-0 group-hover:opacity-100 transition-opacity`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
              <div className={`text-2xl font-bold ${card.text}`}>{card.value}</div>
              <div className="text-xs font-semibold text-gray-700 mt-0.5">{card.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
            </>
          );

          return card.clickable ? (
            <button
              key={card.label}
              onClick={() => navigate(card.to!)}
              className={`group text-left bg-white rounded-xl border ${card.border} p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`}
            >
              {inner}
            </button>
          ) : (
            <div
              key={card.label}
              className={`bg-white rounded-xl border ${card.border} p-4 shadow-sm`}
            >
              {inner}
            </div>
          );
        })}
      </div>

      {/* ── Row 2: Low stock + Recent activity ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h3 className="text-sm font-bold text-gray-800">Low Stock Alerts</h3>
              <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">{stats.lowStock.length}</span>
            </div>
            <button onClick={() => navigate("/inventory")}
              className="text-xs text-blue-600 hover:underline font-medium">
              View inventory →
            </button>
          </div>

          {stats.lowStock.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-gray-400">All stock levels are healthy</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {stats.lowStock.map(item => (
                <button
                  key={item.id}
                  onClick={() => setLedgerItem(item)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-red-50 transition-colors group text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.variant?.product?.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.variant?.color} · {item.variant?.sku}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      item.quantity === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.quantity === 0 ? "Out of stock" : `${item.quantity} left`}
                    </span>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <h3 className="text-sm font-bold text-gray-800">Recent Movements</h3>
            </div>
            <button onClick={() => navigate("/history")}
              className="text-xs text-blue-600 hover:underline font-medium">
              Full history →
            </button>
          </div>

          {stats.recentActivity.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">No recent activity.</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {stats.recentActivity.map(entry => (
                <div key={entry.id}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                      entry.action === "IN" ? "bg-emerald-500" : "bg-orange-500"
                  }`}>
                    {entry.action === "IN" ? "↓" : "↑"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.variant?.product?.name}
                      <span className="text-gray-400 font-normal"> · {entry.variant?.color}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      <span className="capitalize">{entry.reference_type?.toLowerCase()}</span>
                      {" · "}{new Date(entry.created_at).toLocaleString([], { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${entry.action === "IN" ? "text-emerald-600" : "text-orange-600"}`}>
                    {entry.action === "IN" ? "+" : "−"}{entry.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stock Health Bars ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h3 className="text-sm font-bold text-gray-800">Stock Health Overview</h3>
            <span className="text-xs text-gray-400">— click any row to view ledger</span>
          </div>
          <button onClick={() => navigate("/inventory")} className="text-xs text-blue-600 hover:underline font-medium">
            Full inventory →
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {topStocked.map(item => {
            const pct = Math.max((item.quantity / maxInventoryQty) * 100, 0.5);
            const isOut = item.quantity === 0;
            const isLow = !isOut && item.quantity < 10;
            const barCls = isOut ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-emerald-400";
            const textCls = isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600";
            const badgeCls = isOut ? "bg-red-100 text-red-700" : isLow ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
            const badgeLabel = isOut ? "Out of Stock" : isLow ? "Low" : "OK";

            return (
              <button
                key={item.id}
                onClick={() => setLedgerItem(item)}
                className="w-full px-5 py-3 hover:bg-gray-50 transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  {/* Product info */}
                  <div className="w-44 shrink-0 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.variant?.product?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{item.variant?.color} · <span className="font-mono">{item.variant?.sku}</span></p>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barCls}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Qty + badge */}
                  <div className="flex items-center gap-2 shrink-0 w-36 justify-end">
                    <span className={`text-sm font-bold ${textCls}`}>{item.quantity}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>{badgeLabel}</span>
                    <svg className="w-4 h-4 text-gray-200 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Critical / out of stock strip at the bottom if any */}
        {critical.length > 0 && (
          <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between">
            <p className="text-xs font-medium text-red-600">
              🚫 {critical.length} variant{critical.length !== 1 ? "s" : ""} out of stock
            </p>
            <button onClick={() => navigate("/inventory")} className="text-xs text-red-600 hover:underline font-medium">
              Restock →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
