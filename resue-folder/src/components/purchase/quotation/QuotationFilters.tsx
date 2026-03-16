"use client";

type QuotationFiltersProps = {
  status: string;
  onStatusChange: (value: string) => void;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "Approved", label: "Approved" },
  { value: "Draft", label: "Draft" },
  { value: "For revisal", label: "For revisal" },
  { value: "Cancelled", label: "Cancelled" },
];

export default function QuotationFilters({ status, onStatusChange }: QuotationFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="rounded border border-gray-200 bg-blue-600 p-1.5 text-white hover:bg-blue-700"
        aria-label="Filter"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>
    </div>
  );
}
