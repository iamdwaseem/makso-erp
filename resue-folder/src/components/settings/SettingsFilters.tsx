"use client";

type SettingsFiltersProps = {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: React.ReactNode;
  children?: React.ReactNode;
};

export default function SettingsFilters({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  statusFilter,
  children,
}: SettingsFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {onSearchChange && (
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded border border-gray-200 px-3 py-2 text-sm"
        />
      )}
      {statusFilter}
      {children}
    </div>
  );
}
