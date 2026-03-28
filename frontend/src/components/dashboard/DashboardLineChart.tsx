import { useMemo } from "react";
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

type Props = {
  data: LineChartDataPoint[];
  title: string;
  nameFirst?: string;
  nameSecond?: string;
  valueSuffix?: string;
};

const COLORS = { sale: "#dc2626", purchase: "#0d9488" };

const DUP_MARKER = "__point2__";

/** Recharts does not draw line segments for a single point — paths stay empty. Duplicate so segments render. */
function withMinimumTwoPoints<T extends LineChartDataPoint>(rows: T[]): T[] {
  if (rows.length >= 2) return rows;
  if (rows.length === 0) {
    return [
      { month: "—", sale: 0, purchase: 0 } as T,
      { month: DUP_MARKER, sale: 0, purchase: 0 } as T,
    ];
  }
  const a = rows[0];
  return [a, { ...a, month: DUP_MARKER } as T];
}

export function DashboardLineChart({
  data,
  title,
  nameFirst = "Sale",
  nameSecond = "Purchase",
  valueSuffix = " AED",
}: Props) {
  const chartData = useMemo(() => withMinimumTwoPoints(data), [data]);
  const formatValue = (value: number) => `${Number(value).toLocaleString()}${valueSuffix}`;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">{title}</h3>
        <select className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
          <option>Last months</option>
        </select>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(v) => (v === DUP_MARKER ? "" : String(v))}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
            />
            <Tooltip
              formatter={(value) => [formatValue(Number(value)), ""]}
              labelFormatter={(label) =>
                label === DUP_MARKER ? String(chartData[0]?.month ?? "") : String(label)
              }
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="sale" name={nameFirst} stroke={COLORS.sale} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="purchase" name={nameSecond} stroke={COLORS.purchase} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
