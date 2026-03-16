"use client";

type DebitNoteFiltersProps = {
  status: string;
  onStatusChange: (v: string) => void;
};

export default function DebitNoteFilters({ status, onStatusChange }: DebitNoteFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
        <option value="all">All</option>
        <option value="Draft">Draft</option>
        <option value="Approved">Approved</option>
        <option value="Processed">Processed</option>
        <option value="Closed">Closed</option>
      </select>
    </div>
  );
}
