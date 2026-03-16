"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DataPoint = { month: string; value: number };

type PurchaseGraphProps = {
  data: DataPoint[];
  title?: string;
  timeFilter?: string;
  onTimeFilterChange?: (value: string) => void;
};

export default function PurchaseGraph({
  data,
  title = "PURCHASE",
  timeFilter,
  onTimeFilterChange,
}: PurchaseGraphProps) {
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
            <option value="lastMonths">Last months</option>
            <option value="lastDays">Last days</option>
            <option value="thisMonth">This month</option>
            <option value="lastMonth">Last month</option>
            <option value="thisYear">This year</option>
            <option value="lastYear">Last year</option>
          </select>
        )}
      </div>
      <div className="h-[280px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString()} AED`, ""]}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar
              dataKey="value"
              name="Purchase"
              fill="#0d9488"
              radius={[2, 2, 0, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
