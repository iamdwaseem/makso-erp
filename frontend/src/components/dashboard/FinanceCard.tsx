type FinanceCardProps = {
  title: string;
  value: string;
  variant?: "dark" | "green" | "yellow" | "gray" | "white";
  actions?: { label: string; type: "new" | "list" }[];
};

const variantClasses: Record<NonNullable<FinanceCardProps["variant"]>, string> = {
  dark: "bg-[#334155] text-white",
  green: "bg-[#16a34a] text-white",
  yellow: "bg-[#ca8a04] text-white",
  gray: "bg-gray-600 text-white",
  white: "bg-white text-gray-800 border border-gray-200 shadow-sm",
};

export function FinanceCard({ title, value, variant = "white", actions }: FinanceCardProps) {
  return (
    <div className={`rounded-lg px-4 py-4 ${variantClasses[variant]}`}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide opacity-90">{title}</div>
      {actions && actions.length > 0 && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="rounded border border-white/30 bg-transparent px-2 py-1 text-xs font-medium hover:bg-white/10"
          >
            + NEW
          </button>
          <button
            type="button"
            className="rounded border border-white/30 bg-transparent px-2 py-1 text-xs font-medium hover:bg-white/10"
            aria-label="List"
          >
            LIST
          </button>
        </div>
      )}
    </div>
  );
}
