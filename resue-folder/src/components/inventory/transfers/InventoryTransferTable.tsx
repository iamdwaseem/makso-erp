"use client";

export type TransferRow = {
  id: string;
  dateTime?: string;
  fromCenter?: string;
  toCenter?: string;
  employee?: string;
  status: string;
};

type InventoryTransferTableProps = {
  transfers: TransferRow[];
};

export default function InventoryTransferTable({ transfers }: InventoryTransferTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="px-4 py-3">Date and Time</th>
              <th className="px-4 py-3">From Center</th>
              <th className="px-4 py-3">To Center</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3 text-gray-800">{row.dateTime ?? "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.fromCenter ?? "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.toCenter ?? "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.employee ?? "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
        <button type="button" className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">Previous</button>
        <span className="text-sm text-gray-500">20 / 25</span>
        <button type="button" className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50">Next</button>
      </div>
    </div>
  );
}
