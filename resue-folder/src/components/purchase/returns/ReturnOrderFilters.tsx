"use client";

type ReturnOrderFiltersProps = {
  status: string;
  onStatusChange: (v: string) => void;
};

export default function ReturnOrderFilters({ status, onStatusChange }: ReturnOrderFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
        <option value="all">All</option>
        <option value="Draft">Draft</option>
        <option value="Approved">Approved</option>
        <option value="Closed">Closed</option>
        <option value="Delivery Note Created">Delivery Note Created</option>
        <option value="Debit Note Created">Debit Note Created</option>
        <option value="Completed">Completed</option>
      </select>
      <button type="button" className="rounded border border-gray-200 bg-blue-600 p-1.5 text-white hover:bg-blue-700" aria-label="Filter">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
      </button>
    </div>
  );
}
