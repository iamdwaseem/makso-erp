"use client";

import * as React from "react";
import { MoreVertical } from "lucide-react";

export type ColumnDef<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

type SettingsTableProps<T extends { id: number }> = {
  columns: ColumnDef<T>[];
  data: T[];
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
};

export default function SettingsTable<T extends { id: number }>({
  columns,
  data,
  onEdit,
  onDelete,
}: SettingsTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3">
                  {col.label}
                </th>
              ))}
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-800">
                    {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key]}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <SettingsRowActions row={row} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsRowActions<T extends { id: number }>({
  row,
  onEdit,
  onDelete,
}: {
  row: T;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded p-1 text-gray-500 hover:bg-gray-100"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[100px] rounded border border-gray-200 bg-white py-1 shadow-lg">
            <button type="button" onClick={() => { onEdit(row); setOpen(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
              Edit
            </button>
            <button type="button" onClick={() => { onDelete(row); setOpen(false); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

