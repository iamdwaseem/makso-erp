import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export type PieChartDataPoint = { name: string; value: number; color?: string };

type Props = { data: PieChartDataPoint[]; title: string };

const DEFAULT_COLORS = ["#7dd3fc", "#dc2626", "#0d9488", "#9ca3af", "#f97316"];

export function DashboardPieChart({ data, title }: Props) {
  const chartData = data.map((d, i) => ({ ...d, color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }));
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
          <RechartsPieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={1} dataKey="value" nameKey="name">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} AED`, ""]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
