type StatCardProps = {
  value: string;
  label: string;
  variant?: "dark" | "green" | "yellow" | "red" | "white";
};

const variantClasses: Record<NonNullable<StatCardProps["variant"]>, string> = {
  dark: "bg-[#334155] text-white",
  green: "bg-[#16a34a] text-white",
  yellow: "bg-[#ca8a04] text-white",
  red: "bg-[#dc2626] text-white",
  white: "bg-white text-gray-800 border border-gray-200 shadow-sm",
};

export default function StatCard({ value, label, variant = "white" }: StatCardProps) {
  return (
    <div
      className={`rounded-lg px-4 py-4 ${variantClasses[variant]}`}
    >
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide opacity-90">
        {label}
      </div>
    </div>
  );
}
