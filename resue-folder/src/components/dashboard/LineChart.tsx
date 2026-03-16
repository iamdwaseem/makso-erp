"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type LineChartDataPoint = {
  month: string;
  sale?: number;
  purchase?: number;
};

type LineChartProps = {
  data: LineChartDataPoint[];
  title: string;
  /** Label for first line (dataKey "sale"). Default "Sale" */
  nameFirst?: string;
  /** Label for second line (dataKey "purchase"). Default "Purchase" */
  nameSecond?: string;
  /** Tooltip value suffix, e.g. " AED" or "" for units. Default " AED" */
  valueSuffix?: string;
};

const COLORS = { sale: "#dc2626", purchase: "#0d9488" };

export default function LineChart({ data, title, nameFirst = "Sale", nameSecond = "Purchase", valueSuffix = " AED" }: LineChartProps) {
  const formatValue = (value: number) => `${Number(value).toLocaleString()}${valueSuffix}`;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          {title}
        </h3>
        <select className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
          <option>Last months</option>
        </select>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
              formatter={(value) => [formatValue(Number(value)), ""]}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="sale"
              name={nameFirst}
              stroke={COLORS.sale}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="purchase"
              name={nameSecond}
              stroke={COLORS.purchase}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
