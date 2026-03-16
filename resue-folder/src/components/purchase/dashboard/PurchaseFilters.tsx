"use client";

type PurchaseFiltersProps = {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  supplier: string;
  onSupplierChange: (value: string) => void;
  supplierOptions: { value: string; label: string }[];
};

const dateOptions = [
  { value: "lastMonths", label: "Last months" },
  { value: "lastDays", label: "Last days" },
  { value: "thisMonth", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "thisYear", label: "This year" },
  { value: "lastYear", label: "Last year" },
];

export default function PurchaseFilters({
  dateRange,
  onDateRangeChange,
  supplier,
  onSupplierChange,
  supplierOptions,
}: PurchaseFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Date Range</label>
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
        >
          {dateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Supplier</label>
        <select
          value={supplier}
          onChange={(e) => onSupplierChange(e.target.value)}
          className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
        >
          {supplierOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
