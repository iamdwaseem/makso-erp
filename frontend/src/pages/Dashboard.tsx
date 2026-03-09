import { useEffect, useState } from "react";
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

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-lg">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-red-500 p-4">Failed to load dashboard data. Is the backend running?</div>;
  }

  const statCards = [
    { label: "Total Products", value: stats.counts.totalProducts, color: "bg-blue-500", icon: "📦" },
    { label: "Variants", value: stats.counts.totalVariants, color: "bg-indigo-500", icon: "🏷️" },
    { label: "Total Units in Stock", value: stats.counts.totalUnits, color: "bg-emerald-500", icon: "📊" },
    { label: "Suppliers", value: stats.counts.totalSuppliers, color: "bg-amber-500", icon: "🏭" },
    { label: "Customers", value: stats.counts.totalCustomers, color: "bg-pink-500", icon: "👥" },
    { label: "Purchases", value: stats.counts.totalPurchases, color: "bg-cyan-500", icon: "📥" },
    { label: "Sales", value: stats.counts.totalSales, color: "bg-violet-500", icon: "📤" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-red-500">⚠️</span> Low Stock Alerts
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{stats.lowStock.length}</span>
          </h3>
          {stats.lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm">All stock levels are healthy.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {stats.lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.variant?.product?.name}</p>
                    <p className="text-xs text-gray-500">{item.variant?.color} · {item.variant?.sku}</p>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    item.quantity === 0 ? "bg-red-200 text-red-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {item.quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Recent Stock Movements</h3>
          {stats.recentActivity.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent activity.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {stats.recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      entry.action === "IN" ? "bg-green-500" : "bg-orange-500"
                    }`}>
                      {entry.action === "IN" ? "↓" : "↑"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {entry.variant?.product?.name} · {entry.variant?.color}
                      </p>
                      <p className="text-xs text-gray-400">
                        {entry.reference_type} · {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${entry.action === "IN" ? "text-green-600" : "text-orange-600"}`}>
                    {entry.action === "IN" ? "+" : "-"}{entry.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📦 Inventory Overview</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Variant</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.inventory.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.variant?.product?.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.variant?.color}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 font-mono">{item.variant?.sku}</td>
                  <td className="py-3 px-4 text-sm font-bold text-right text-gray-900">{item.quantity}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      item.quantity === 0 ? "bg-red-100 text-red-700" :
                      item.quantity < 10 ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {item.quantity === 0 ? "Out of Stock" : item.quantity < 10 ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
