"use client";

export type AllocationRow = {
  slNo: number;
  item: string;
  batch: string;
  allocationPercent: string;
  amount: string;
};

type ExpenseAllocationTableProps = {
  rows: AllocationRow[];
  onRowsChange: (rows: AllocationRow[]) => void;
};

export default function ExpenseAllocationTable({ rows, onRowsChange }: ExpenseAllocationTableProps) {
  const addRow = () => {
    onRowsChange([...rows, { slNo: rows.length + 1, item: "", batch: "", allocationPercent: "", amount: "" }]);
  };

  const updateRow = (index: number, field: keyof AllocationRow, value: string) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    onRowsChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase text-gray-700">Cost Distribution</h3>
        <button type="button" className="flex items-center gap-1 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
          Populate Items
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-3 py-2">Sl Num</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Batch</th>
              <th className="px-3 py-2">% of Allocation</th>
              <th className="px-3 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="px-3 py-2">{row.slNo}</td>
                <td className="px-3 py-2">
                  <input type="text" value={row.item} onChange={(e) => updateRow(index, "item", e.target.value)} placeholder="Item" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
                </td>
                <td className="px-3 py-2">
                  <input type="text" value={row.batch} onChange={(e) => updateRow(index, "batch", e.target.value)} placeholder="Batch" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
                </td>
                <td className="px-3 py-2">
                  <input type="text" value={row.allocationPercent} onChange={(e) => updateRow(index, "allocationPercent", e.target.value)} placeholder="% of Allocation" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
                </td>
                <td className="px-3 py-2">
                  <input type="text" value={row.amount} onChange={(e) => updateRow(index, "amount", e.target.value)} placeholder="Amount" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
