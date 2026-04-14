import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type BarChartDataPoint = {
  month: string;
  income?: number;
  expense?: number;
};

type Props = { data: BarChartDataPoint[]; title: string; valueSuffix?: string };

const COLORS = { income: "#dc2626", expense: "#0d9488" };

export function DashboardBarChart({ data, title, valueSuffix = "" }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">{title}</h3>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
            <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}${valueSuffix}`, ""]} contentStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="income" name="Income" fill={COLORS.income} radius={[2, 2, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill={COLORS.expense} radius={[2, 2, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
