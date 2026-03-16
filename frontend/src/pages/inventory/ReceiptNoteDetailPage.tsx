import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { SearchCombobox } from "../../components/SearchCombobox";

type PurchaseItem = {
  id: string;
  variant_id: string;
  quantity: number;
  variant?: { sku?: string; color?: string; product?: { name: string } };
};

type Purchase = {
  id: string;
  invoice_number?: string;
  purchase_date?: string;
  created_at?: string;
  status: string;
  notes?: string;
  supplier?: { id: string; name: string };
  warehouse?: { id: string; name: string };
  items?: PurchaseItem[];
};

type EditRow = { rowId: string; variantId: string; quantity: number; label: string };

function toEditRows(items: PurchaseItem[]): EditRow[] {
  return (items ?? []).map((item) => ({
    rowId: item.id,
    variantId: item.variant_id,
    quantity: item.quantity,
    label: [item.variant?.product?.name, item.variant?.sku].filter(Boolean).join(" / ") || "—",
  }));
}

export function ReceiptNoteDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const canEdit = user?.role === "MANAGER" || user?.role === "ADMIN";
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(canEdit && searchParams.get("edit") === "1");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [editRows, setEditRows] = useState<EditRow[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/purchases/${id}`);
      const p = res.data;
      setPurchase(p);
      setNotes(p.notes ?? "");
      setStatus(p.status ?? "SUBMITTED");
      setEditRows(toEditRows(p.items ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setPurchase(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const syncEditRowsFromPurchase = useCallback(() => {
    if (purchase?.items) setEditRows(toEditRows(purchase.items));
  }, [purchase?.items]);

  const addEditRow = () => {
    setEditRows((prev) => [...prev, { rowId: crypto.randomUUID(), variantId: "", quantity: 1, label: "" }]);
  };

  const removeEditRow = (rowId: string) => {
    setEditRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.rowId !== rowId)));
  };

  const setEditRow = (rowId: string, patch: Partial<EditRow>) => {
    setEditRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    if (!id) return;
    const validRows = editRows.filter((r) => r.variantId && r.quantity > 0);
    if (validRows.length === 0) {
      setError("Add at least one item with a variant and quantity.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/purchases/${id}`, {
        notes: notes || undefined,
        status,
        items: validRows.map((r) => ({ variantId: r.variantId, quantity: r.quantity })),
      });
      setEditMode(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/purchases/${id}`);
      navigate("/inventory/receipt-notes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setNotes(purchase?.notes ?? "");
    setStatus(purchase?.status ?? "SUBMITTED");
    syncEditRowsFromPurchase();
  };

  if (loading && !purchase) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">Loading…</div>
      </div>
    );
  }

  if (error && !purchase) {
    return (
      <div className="p-6">
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
        <Link to="/inventory/receipt-notes" className="mt-4 inline-block text-blue-600 hover:underline">← Back to list</Link>
      </div>
    );
  }

  if (!purchase) return null;

  const dateSource = purchase.purchase_date ?? purchase.created_at;
  const dateStr = dateSource ? new Date(dateSource).toLocaleString() : "—";

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/inventory/receipt-notes"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Back to list
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Goods Receipt Note — {purchase.invoice_number ?? purchase.id.slice(0, 8)}
          </h1>
        </div>
        {canEdit && !editMode ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditMode(true)} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Edit
            </button>
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
              Delete
            </button>
          </div>
        ) : canEdit && editMode ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEdit} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      )}

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Details</h2>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Receipt No</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{purchase.invoice_number ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Date</dt>
              <dd className="mt-0.5 text-gray-900">{dateStr}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Supplier</dt>
              <dd className="mt-0.5 text-gray-900">{purchase.supplier?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Warehouse</dt>
              <dd className="mt-0.5 text-gray-900">{purchase.warehouse?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Status</dt>
              <dd className="mt-0.5">
                {editMode ? (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                ) : (
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    purchase.status === "SUBMITTED" ? "bg-green-100 text-green-800" :
                    purchase.status === "DRAFT" ? "bg-gray-100 text-gray-700" :
                    purchase.status === "CANCELLED" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {purchase.status}
                  </span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-gray-500">Notes</dt>
              <dd className="mt-0.5">
                {editMode ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Optional notes"
                  />
                ) : (
                  <span className="text-gray-900">{purchase.notes || "—"}</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold uppercase text-gray-500">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  {editMode ? (
                    <>
                      <th className="px-4 py-3">Product / Variant</th>
                      <th className="px-4 py-3 text-right w-28">Quantity</th>
                      <th className="px-4 py-3 w-10" />
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Variant / SKU</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {editMode
                  ? editRows.map((row) => (
                      <tr key={row.rowId} className="border-b border-gray-100">
                        <td className="px-4 py-2">
                          {row.variantId ? (
                            <span className="text-gray-900">
                              {row.label || row.variantId}
                              <button type="button" onClick={() => setEditRow(row.rowId, { variantId: "", label: "" })} className="ml-2 text-xs text-blue-600 hover:underline">Change</button>
                            </span>
                          ) : (
                            <SearchCombobox
                              endpoint="/variants"
                              mapItem={(v: any) => ({ id: v.id, label: [v.product?.name, v.sku].filter(Boolean).join(" / ") || v.id })}
                              value={row.variantId}
                              onChange={(variantId) => {
                                api.get(`/variants/${variantId}`).then((res) => {
                                  const v = res.data;
                                  const label = [v?.product?.name, v?.sku].filter(Boolean).join(" / ") || variantId;
                                  setEditRow(row.rowId, { variantId, label });
                                }).catch(() => setEditRow(row.rowId, { variantId, label: variantId }));
                              }}
                              placeholder="Search product or SKU..."
                              minChars={1}
                              limit={15}
                            />
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => setEditRow(row.rowId, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-right tabular-nums"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <button type="button" onClick={() => removeEditRow(row.rowId)} className="text-red-600 hover:text-red-800 p-1" aria-label="Remove row">
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  : (purchase.items ?? []).map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.variant?.product?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.variant?.color ?? "—"} / {item.variant?.sku ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {editMode && (
            <div className="border-t border-gray-200 px-4 py-2">
              <button type="button" onClick={addEditRow} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                + Add row
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete this receipt note?</h3>
            <p className="mt-2 text-sm text-gray-600">Stock received by this note will be reversed from inventory. This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
