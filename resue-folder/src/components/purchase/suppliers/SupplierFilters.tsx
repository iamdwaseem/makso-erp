"use client";

type SupplierFiltersProps = {
  supplierName: string;
  onSupplierNameChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  countryBranch: string;
  onCountryBranchChange: (value: string) => void;
  contactPerson: string;
  onContactPersonChange: (value: string) => void;
};

export default function SupplierFilters({
  supplierName,
  onSupplierNameChange,
  status,
  onStatusChange,
  countryBranch,
  onCountryBranchChange,
  contactPerson,
  onContactPersonChange,
}: SupplierFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Supplier Name</label>
        <input
          type="text"
          value={supplierName}
          onChange={(e) => onSupplierNameChange(e.target.value)}
          placeholder="Search by name"
          className="rounded border border-gray-200 px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Status</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
        >
          <option value="all">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Country / Branch</label>
        <input
          type="text"
          value={countryBranch}
          onChange={(e) => onCountryBranchChange(e.target.value)}
          placeholder="Filter"
          className="rounded border border-gray-200 px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-600">Contact Person</label>
        <input
          type="text"
          value={contactPerson}
          onChange={(e) => onContactPersonChange(e.target.value)}
          placeholder="Search"
          className="rounded border border-gray-200 px-3 py-1.5 text-sm"
        />
      </div>
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
