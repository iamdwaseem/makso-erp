"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type ViewMode = "list" | "form";

type SaleRow = {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
};

export default function SalesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSales({ page: 1, limit: 100 });
      const data = (res as any)?.data ?? [];
      setSales(
        data.map((s: any) => ({
          id: s.id,
          customer: (s.customer as any)?.name ?? s.customerId ?? "—",
          amount: Number(s.totalAmount ?? s.grandTotal ?? 0),
          status: s.status ?? "DRAFT",
          date: s.createdAt ? new Date(s.createdAt).toLocaleString() : "—",
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = statusFilter === "all" ? sales : sales.filter((s) => s.status === statusFilter);

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">SALES</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "list" ? "form" : "list")}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {viewMode === "list" ? "NEW SALE" : "BACK TO LIST"}
          </button>
          <button type="button" onClick={load} className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Refresh
          </button>
        </div>
      </div>

      {viewMode === "form" && (
        <SalesCreateForm
          onSuccess={() => {
            load();
            setViewMode("list");
          }}
          onCancel={() => setViewMode("list")}
          onError={setError}
        />
      )}

      {viewMode === "list" && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm"
            >
              <option value="all">All</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}
          {loading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No sales.</td></tr>
                  ) : (
                    filtered.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-xs">{row.id.slice(0, 8)}…</td>
                        <td className="px-4 py-3">{row.customer}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3">{row.status}</td>
                        <td className="px-4 py-3">{row.date}</td>
                        <td className="px-4 py-3">
                          <Link href={`/home/sales/${row.id}`} className="text-blue-600 hover:underline">View</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SalesCreateForm({
  onSuccess,
  onCancel,
  onError,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  onError: (msg: string | null) => void;
}) {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [variants, setVariants] = useState<{ id: string; sku: string }[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [rows, setRows] = useState<{ variantId: string; quantity: string }[]>([{ variantId: "", quantity: "" }]);

  useEffect(() => {
    api.getCustomers({ page: 1, limit: 200 }).then((res: any) => setCustomers(res?.data ?? [])).catch(() => setCustomers([]));
    api.getWarehouses().then((list) => setWarehouses(list)).catch(() => setWarehouses([]));
    api.getVariants({ page: 1, limit: 200 }).then((res: any) => setVariants(res?.data ?? [])).catch(() => setVariants([]));
  }, []);

  const addRow = () => setRows((prev) => [...prev, { variantId: "", quantity: "" }]);
  const setRow = (i: number, field: "variantId" | "quantity", value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError(null);
    if (!customerId || !warehouseId) {
      onError("Select customer and warehouse.");
      return;
    }
    const items = rows
      .map((r) => ({ variantId: r.variantId.trim(), quantity: parseInt(r.quantity, 10) }))
      .filter((i) => i.variantId && !Number.isNaN(i.quantity) && i.quantity > 0);
    if (items.length === 0) {
      onError("Add at least one item.");
      return;
    }
    try {
      await api.createSale({ customerId, warehouseId, items });
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Create failed");
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">New Sale</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Customer *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm" required>
              <option value="">Select</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-600">Warehouse *</label>
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm" required>
              <option value="">Select</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-3 py-2">Variant</th>
                <th className="px-3 py-2">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-2">
                    <select value={row.variantId} onChange={(e) => setRow(i, "variantId", e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm">
                      <option value="">Select</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>{v.sku}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={1} value={row.quantity} onChange={(e) => setRow(i, "quantity", e.target.value)} className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addRow} className="mt-2 text-sm text-blue-600 hover:underline">+ Add row</button>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <button type="button" onClick={onCancel} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create Sale</button>
        </div>
      </form>
    </div>
  );
}
