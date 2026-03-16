"use client";

import { useState } from "react";
import type { ApiSupplier } from "@/lib/api";
import { MoreVertical } from "lucide-react";

type SupplierTableProps = {
  suppliers: ApiSupplier[];
  onEdit: (supplier: ApiSupplier) => void;
  onDelete: (supplier: ApiSupplier) => void;
};

export default function SupplierTable({ suppliers, onEdit, onDelete }: SupplierTableProps) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded border-gray-300" aria-label="Select all" />
              </th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Address</th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="px-4 py-3 text-gray-800 font-mono text-xs">{row.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3 text-gray-800">{row.phone}</td>
                <td className="px-4 py-3 text-gray-800">{row.email ?? "—"}</td>
                <td className="px-4 py-3 text-gray-800">{row.address ?? "—"}</td>
                <td className="relative px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setMenuOpenId(menuOpenId === row.id ? null : row.id)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpenId === row.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        aria-hidden
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-4 top-full z-20 mt-1 min-w-[120px] rounded border border-gray-200 bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            onEdit(row);
                            setMenuOpenId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(row);
                            setMenuOpenId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
