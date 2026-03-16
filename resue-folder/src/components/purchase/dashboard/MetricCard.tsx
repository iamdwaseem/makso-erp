type MetricCardProps = {
  value: string | number;
  title: string;
  onNew?: () => void;
  onList?: () => void;
};

export default function MetricCard({ value, title, onNew, onList }: MetricCardProps) {
  return (
    <div className="rounded-lg bg-[#334155] px-4 py-4 text-white">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide opacity-90">
        {title}
      </div>
      {(onNew || onList) && (
        <div className="mt-3 flex gap-2">
          {onNew && (
            <button
              type="button"
              onClick={onNew}
              className="rounded border border-white/30 bg-transparent px-2 py-1 text-xs font-medium text-white hover:bg-white/10"
            >
              + NEW
            </button>
          )}
          {onList && (
            <button
              type="button"
              onClick={onList}
              className="flex items-center gap-1 rounded border border-white/30 bg-transparent px-2 py-1 text-xs font-medium text-white hover:bg-white/10"
              aria-label="List"
            >
              <span className="font-mono">≡</span> LIST
            </button>
          )}
        </div>
      )}
    </div>
  );
}
