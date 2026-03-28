import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { SearchCombobox } from "../../components/SearchCombobox";

type PurchaseItem = {
  id: string;
  variant_id: string;
  quantity: number;
  variant?: { sku?: string; color?: string; size?: string; product?: { name: string } };
};

type Purchase = {
  id: string;
  invoice_number?: string;
  purchase_date?: string;
  created_at?: string;
  status: string;
  notes?: string;
  deleted_at?: string | null;
  supplier?: { id: string; name: string };
  warehouse?: { id: string; name: string };
  items?: PurchaseItem[];
};

type EditRow = {
  rowKey: string;
  purchaseItemId?: string;
  variantId: string;
  quantity: string;
  productName: string;
  color: string;
  size: string;
};

function toEditRows(items: PurchaseItem[]): EditRow[] {
  return (items ?? []).map((item) => ({
    rowKey: item.id,
    purchaseItemId: item.id,
    variantId: item.variant_id,
    quantity: String(item.quantity),
    productName: item.variant?.product?.name ?? "",
    color: item.variant?.color ?? "",
    size: item.variant?.size ?? "",
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
  const [restoring, setRestoring] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [editRows, setEditRows] = useState<EditRow[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/purchases/${id}`, { params: { includeDeleted: true } });
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

  const isDeleted = Boolean(purchase?.deleted_at);

  const addEditRow = () => {
    setEditRows((prev) => [
      ...prev,
      {
        rowKey: crypto.randomUUID(),
        variantId: "",
        quantity: "",
        productName: "",
        color: "",
        size: "",
      },
    ]);
  };

  const removeEditRow = (rowKey: string) => {
    setEditRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.rowKey !== rowKey)));
  };

  const setEditRow = (rowKey: string, patch: Partial<EditRow>) => {
    setEditRows((prev) => prev.map((r) => (r.rowKey === rowKey ? { ...r, ...patch } : r)));
  };

  const applyVariantSelection = (rowKey: string, variantId: string) => {
    api
      .get(`/variants/${variantId}`)
      .then((res) => {
        const v = res.data;
        setEditRow(rowKey, {
          variantId,
          productName: v?.product?.name ?? "",
          color: v?.color ?? "",
          size: v?.size ?? "",
        });
      })
      .catch(() => setEditRow(rowKey, { variantId }));
  };

  const handleSave = async () => {
    if (!id) return;
    const parsedRows = editRows.map((r) => ({
      ...r,
      qtyNum: parseInt(String(r.quantity).trim(), 10),
    }));
    const validRows = parsedRows.filter(
      (r) => r.variantId && Number.isFinite(r.qtyNum) && r.qtyNum > 0
    );
    if (validRows.length === 0) {
      setError("Add at least one line with a variant and a quantity greater than zero.");
      return;
    }
    if (parsedRows.some((r) => r.variantId && (!Number.isFinite(r.qtyNum) || r.qtyNum <= 0))) {
      setError("Every line with a variant needs a quantity greater than zero.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/purchases/${id}`, {
        notes: notes || undefined,
        status,
        items: validRows.map((r) => ({
          ...(r.purchaseItemId ? { id: r.purchaseItemId } : {}),
          variantId: r.variantId,
          quantity: r.qtyNum,
          productName: r.productName.trim() || undefined,
          variantColor: r.color,
          variantSize: r.size,
        })),
      });
      setEditMode(false);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err.response?.data?.error || err.message || "Failed to save");
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
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err.response?.data?.error || err.message || "Failed to delete");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRestore = async () => {
    if (!id) return;
    setRestoring(true);
    setError(null);
    try {
      await api.post(`/purchases/${id}/restore`);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err.response?.data?.error || err.message || "Failed to restore");
    } finally {
      setRestoring(false);
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
        <Link to="/inventory/receipt-notes" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Back to list
        </Link>
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
          <div className="flex flex-wrap gap-2">
            {!isDeleted && (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            {isDeleted ? (
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {restoring ? "Restoring…" : "Restore & re-add stock"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Delete
              </button>
            )}
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
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {isDeleted && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This receipt was deleted. Stock from this GRN was removed from inventory. Use <strong>Restore</strong> to
          re-apply quantities to stock.
        </div>
      )}

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
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      purchase.status === "SUBMITTED"
                        ? "bg-green-100 text-green-800"
                        : purchase.status === "DRAFT"
                          ? "bg-gray-100 text-gray-700"
                          : purchase.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
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
                      <th className="px-3 py-3 min-w-[140px]">Product name</th>
                      <th className="px-3 py-3 min-w-[100px]">Color</th>
                      <th className="px-3 py-3 min-w-[100px]">Size</th>
                      <th className="px-3 py-3 min-w-[200px]">Variant / SKU</th>
                      <th className="px-3 py-3 text-right w-24">Qty</th>
                      <th className="px-2 py-3 w-10" />
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Color</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {editMode
                  ? editRows.map((row) => (
                      <tr key={row.rowKey} className="border-b border-gray-100">
                        <td className="px-3 py-2 align-top">
                          <input
                            type="text"
                            value={row.productName}
                            onChange={(e) => setEditRow(row.rowKey, { productName: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="Name"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <input
                            type="text"
                            value={row.color}
                            onChange={(e) => setEditRow(row.rowKey, { color: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="Color"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <input
                            type="text"
                            value={row.size}
                            onChange={(e) => setEditRow(row.rowKey, { size: e.target.value })}
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="Size"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          {row.variantId ? (
                            <div className="space-y-1">
                              <span className="block text-xs text-gray-600 break-all">{row.variantId}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditRow(row.rowKey, {
                                    variantId: "",
                                  })
                                }
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Change variant
                              </button>
                            </div>
                          ) : (
                            <SearchCombobox
                              endpoint="/variants"
                              mapItem={(v: any) => ({
                                id: v.id,
                                label: `${v.product?.name} — ${v.color}${v.size ? ` / ${v.size}` : ""} (${v.sku})`,
                              })}
                              value={row.variantId}
                              onChange={(variantId) => applyVariantSelection(row.rowKey, variantId)}
                              placeholder="Search SKU / product…"
                              minChars={1}
                              limit={15}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 text-right align-top">
                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            value={row.quantity}
                            onChange={(e) => setEditRow(row.rowKey, { quantity: e.target.value })}
                            className="w-full min-w-[4rem] rounded border border-gray-300 px-2 py-1.5 text-right tabular-nums"
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <button
                            type="button"
                            onClick={() => removeEditRow(row.rowKey)}
                            className="text-red-600 hover:text-red-800 p-1"
                            aria-label="Remove row"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))
                  : (purchase.items ?? []).map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{item.variant?.product?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.variant?.color ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{item.variant?.size ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.variant?.sku ?? "—"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {editMode && (
            <div className="border-t border-gray-200 px-4 py-2">
              <button
                type="button"
                onClick={addEditRow}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
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
            <p className="mt-2 text-sm text-gray-600">
              This removes received quantities from inventory. The receipt moves to the <strong>Deleted</strong> list
              where you can restore it to put stock back.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
