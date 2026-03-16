"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function SaleDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const s = await api.getSaleById(id);
      setSale(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setSale(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!id) {
    return (
      <div className="p-6">
        <Link href="/home/sales" className="text-sm text-blue-600 hover:underline">← Back to Sales</Link>
        <p className="mt-4 text-gray-600">Invalid ID.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Link href="/home/sales" className="text-sm text-blue-600 hover:underline">← Back to Sales</Link>
        <p className="mt-4 text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="p-6">
        <Link href="/home/sales" className="text-sm text-blue-600 hover:underline">← Back to Sales</Link>
        <p className="mt-4 text-red-600">{error ?? "Not found."}</p>
      </div>
    );
  }

  const customerName = (sale.customer as any)?.name ?? sale.customerId ?? "—";
  const warehouseName = (sale.warehouse as any)?.name ?? sale.warehouseId ?? "—";
  const items = sale.items ?? [];
  const total = Number(sale.totalAmount ?? sale.grandTotal ?? 0);

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link href="/home/sales" className="text-sm text-blue-600 hover:underline">← Back to Sales</Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
          <h2 className="text-lg font-semibold uppercase">SALE / {sale.id?.slice(0, 8)}</h2>
        </div>
        <div className="p-6">
          <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <dt className="text-gray-500">Customer</dt>
            <dd>{customerName}</dd>
            <dt className="text-gray-500">Warehouse</dt>
            <dd>{warehouseName}</dd>
            <dt className="text-gray-500">Status</dt>
            <dd>{sale.status ?? "—"}</dd>
            <dt className="text-gray-500">Date</dt>
            <dd>{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : "—"}</dd>
          </dl>
          <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Variant / Product</th>
                <th className="px-4 py-2 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{it.variant?.sku ?? it.variant?.product?.name ?? it.variantId ?? "—"}</td>
                  <td className="px-4 py-2 text-right">{it.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm font-medium text-gray-700">Total: {total.toLocaleString("en-US", { minimumFractionDigits: 2 })} AED</p>
        </div>
      </div>
    </div>
  );
}
