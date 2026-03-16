"use client";

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
} from "recharts";
import { api, type LowStockRow } from "@/lib/api";
import { useGlobalFilter } from "@/contexts/GlobalFilterContext";

const COLORS = ["#7dd3fc", "#0d9488", "#f97316", "#a855f7", "#9ca3af"];

function normalizeLowStockPayload(res: LowStockRow[] | { data?: LowStockRow[] } | null): LowStockRow[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  const data = (res as { data?: LowStockRow[] }).data;
  return Array.isArray(data) ? data : [];
}

export default function InventoryDashboardPage() {
  const { warehouseId } = useGlobalFilter();
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [itemGroups, setItemGroups] = useState<{ name: string; value: number; color: string }[]>([]);
  const [productsToReorder, setProductsToReorder] = useState<LowStockRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const wh = warehouseId && warehouseId !== "all" ? warehouseId : undefined;
    Promise.all([
      api.getInventoryValuation(wh).catch(() => null),
      api.getDashboardStats(wh ? { warehouseId: wh } : undefined).catch(() => null),
      api.getInventoryItemGroups(wh).catch(() => null),
      api.getLowStockReport(wh).catch(() => null),
    ]).then(([valuation, stats, groups, lowStockRaw]) => {
      if (cancelled) return;
      if (valuation) setTotalValue(valuation.totalValue);
      if (stats) setLowStockCount(stats.lowStockItems);
      if (groups?.length) setItemGroups(groups.map((g, i) => ({ ...g, color: COLORS[i % COLORS.length] })));
      const lowStock = normalizeLowStockPayload(lowStockRaw as LowStockRow[] | { data?: LowStockRow[] } | null);
      setProductsToReorder(lowStock);
    }).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
    });
    return () => { cancelled = true; };
  }, [warehouseId]);

  const totalStockUnits = itemGroups.reduce((sum, g) => sum + (g.value ?? 0), 0);
  const metrics = {
    totalStockValue: totalValue != null ? totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 }) + " AED" : "—",
    totalInventoryItems: itemGroups.length > 0 ? String(itemGroups.length) : "—",
    lowStockItems: lowStockCount ?? "—",
    totalStockUnits: totalStockUnits.toLocaleString(),
    rawMaterialsValue: "—",
    sellableGoodsValue: totalValue != null ? totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 }) + " AED" : "—",
    producibleGoodsValue: "—",
    packingMaterialsValue: "—",
  };
  const itemGroupData = itemGroups.length > 0 ? itemGroups : [];

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
          { label: "Total Stock (Value)", value: metrics.totalStockValue },
          { label: "Total Inventory Items", value: metrics.totalInventoryItems },
          { label: "Low Stock Items", value: String(metrics.lowStockItems) },
          { label: "Raw Materials (Value)", value: metrics.rawMaterialsValue },
          { label: "Sellable Goods (Value)", value: metrics.sellableGoodsValue },
          { label: "Producible Goods (Value)", value: metrics.producibleGoodsValue },
          { label: "Packing Materials (Value)", value: metrics.packingMaterialsValue },
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

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Item Group Distribution
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={itemGroupData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {itemGroupData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => (value != null ? Number(value).toLocaleString() : "")} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Inventory In-Hand
          </h3>
          <div className="h-[280px]">
            {itemGroupData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                No inventory data. Stock report will show here once available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={itemGroupData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => value?.toLocaleString() ?? ""} labelFormatter={(label) => `Product: ${label}`} />
                  <Bar dataKey="value" name="Quantity" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
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
