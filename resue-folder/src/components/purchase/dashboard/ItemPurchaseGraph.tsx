"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const BAR_COLORS = [
  "#7dd3fc",
  "#9ca3af",
  "#dc2626",
  "#0d9488",
  "#f97316",
  "#4b5563",
  "#a855f7",
  "#ec4899",
  "#78716c",
  "#2dd4bf",
  "#16a34a",
  "#1e3a8a",
  "#171717",
  "#84cc16",
];

type DataPoint = { name: string; value: number };

type ItemPurchaseGraphProps = {
  data: DataPoint[];
  title?: string;
  timeFilter?: string;
  onTimeFilterChange?: (value: string) => void;
};

export default function ItemPurchaseGraph({
  data,
  title = "ITEM WISE PURCHASE",
  timeFilter,
  onTimeFilterChange,
}: ItemPurchaseGraphProps) {
  const chartData = data.map((d, i) => ({
    ...d,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          {title}
        </h3>
        {onTimeFilterChange && (
          <select
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value)}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600"
          >
            <option value="thisYear">This year</option>
            <option value="lastMonths">Last months</option>
            <option value="thisMonth">This month</option>
            <option value="lastMonth">Last month</option>
          </select>
        )}
      </div>
      <div className="h-[320px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
            <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}`, ""]} />
            <Bar dataKey="value" name="Value" radius={[0, 2, 2, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
