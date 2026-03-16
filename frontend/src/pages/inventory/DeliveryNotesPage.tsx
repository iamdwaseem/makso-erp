import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

type DeliveryNoteRow = {
  id: string;
  deliveryNo: string;
  date: string;
  customer: string;
  center: string;
  onTransaction: string;
  amount: number;
  status: string;
};

const STATUS_OPTIONS = ["all", "DRAFT", "SUBMITTED", "CANCELLED"];

function mapSaleToRow(s: any): DeliveryNoteRow {
  const amount = s.total_amount != null ? Number(s.total_amount) : 0;
  return {
    id: s.id,
    deliveryNo: s.invoice_number ?? s.id?.slice(0, 8) ?? "—",
    date: s.sale_date || s.created_at ? new Date(s.sale_date || s.created_at).toLocaleString() : "—",
    customer: s.customer?.name ?? "—",
    center: s.warehouse?.name ?? "—",
    onTransaction: "GDN",
    amount,
    status: s.status ?? "SUBMITTED",
  };
}

export function DeliveryNotesPage() {
  const [notes, setNotes] = useState<DeliveryNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/sales", { params: { limit: 100 } });
      const data = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(data) ? data : [];
      setNotes(list.map(mapSaleToRow));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = statusFilter === "all" ? notes : notes.filter((n) => n.status === statusFilter);

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Delivery Notes</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-gray-200 bg-white px-3 py-1.5 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All" : s}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Link
            to="/inventory/stock-exit"
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            NEW
          </Link>
          <button type="button" className="rounded border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            EXPORT
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      )}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Delivery No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Center</th>
                  <th className="px-4 py-3">On Transaction</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{row.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-medium">{row.deliveryNo}</td>
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3">{row.customer}</td>
                    <td className="px-4 py-3">{row.center}</td>
                    <td className="px-4 py-3">{row.onTransaction}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(row.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          row.status === "SUBMITTED" ? "bg-green-100 text-green-800" :
                          row.status === "DRAFT" ? "bg-gray-100 text-gray-700" :
                          row.status === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/inventory/delivery-notes/${row.id}`} className="text-blue-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
