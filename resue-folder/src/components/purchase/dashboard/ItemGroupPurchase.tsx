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

const BAR_COLORS = ["#0d9488", "#7dd3fc", "#f97316", "#a855f7", "#dc2626", "#6b7280"];

type DataPoint = { name: string; value: number };

type ItemGroupPurchaseProps = {
  data: DataPoint[];
  title?: string;
};

export default function ItemGroupPurchase({
  data,
  title = "ITEM GROUP-WISE PURCHASE",
}: ItemGroupPurchaseProps) {
  const chartData = data.map((d, i) => ({
    ...d,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
        {title}
      </h3>
      <div className="h-[260px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
            <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} AED`, ""]} />
            <Bar dataKey="value" name="Value" radius={[2, 2, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
