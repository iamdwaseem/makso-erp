"use client";

type WorkOrderFiltersProps = {
  dateRange: string;
  onDateRangeChange: (v: string) => void;
  employee: string;
  onEmployeeChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  workOrderNo: string;
  onWorkOrderNoChange: (v: string) => void;
};

export default function WorkOrderFilters({
  dateRange,
  onDateRangeChange,
  employee,
  onEmployeeChange,
  status,
  onStatusChange,
  workOrderNo,
  onWorkOrderNoChange,
}: WorkOrderFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={workOrderNo}
        onChange={(e) => onWorkOrderNoChange(e.target.value)}
        placeholder="Work Order Number"
        className="rounded border border-gray-200 px-3 py-1.5 text-sm"
      />
      <input
        type="text"
        value={dateRange}
        onChange={(e) => onDateRangeChange(e.target.value)}
        placeholder="Date Range"
        className="rounded border border-gray-200 px-3 py-1.5 text-sm"
      />
      <input
        type="text"
        value={employee}
        onChange={(e) => onEmployeeChange(e.target.value)}
        placeholder="Employee"
        className="rounded border border-gray-200 px-3 py-1.5 text-sm"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm"
      >
        <option value="all">All</option>
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
        <option value="Closed">Closed</option>
      </select>
    </div>
  );
}
