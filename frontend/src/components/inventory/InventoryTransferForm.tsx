import { useEffect, useState } from "react";
import api from "../../api";

export type TransferCreatePayload = {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  items: { variantId: string; quantity: number }[];
};

type VariantOption = { id: string; sku: string; productName?: string };

/** One line: SKU is what you type/scan; variantId is resolved for the API (each variant = one sellable item / SKU). */
type TransferLine = {
  sku: string;
  variantId: string;
  quantity: string;
  resolvedLabel?: string;
  skuError?: string;
  resolving?: boolean;
};

export type InventoryTransferFormProps = {
  defaultSourceId?: string;
  defaultTargetId?: string;
  defaultRows?: { variantId: string; sku?: string; quantity: string; resolvedLabel?: string }[];
  showDraftButton?: boolean;
  showCompleteButton?: boolean;
  disabled?: boolean;
  onSaveDraft?: (payload: TransferCreatePayload) => void | Promise<void>;
  onComplete?: (payload: TransferCreatePayload) => void | Promise<void>;
};

async function resolveSkuToVariant(sku: string): Promise<{ id: string; sku: string; label: string } | null> {
  const trimmed = sku.trim();
  if (!trimmed) return null;
  try {
    const res = await api.get(`/variants/sku/${encodeURIComponent(trimmed)}`);
    const v = res.data as { id: string; sku: string; product?: { name?: string } };
    const label = v.product?.name ? `${v.product.name} · ${v.sku}` : v.sku;
    return { id: v.id, sku: v.sku, label };
  } catch {
    return null;
  }
}

export function InventoryTransferForm({
  defaultSourceId = "",
  defaultTargetId = "",
  defaultRows,
  showDraftButton = false,
  showCompleteButton = true,
  disabled = false,
  onSaveDraft,
  onComplete,
}: InventoryTransferFormProps) {
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [sourceWarehouseId, setSourceWarehouseId] = useState(() => defaultSourceId);
  const [targetWarehouseId, setTargetWarehouseId] = useState(() => defaultTargetId);
  const [itemRows, setItemRows] = useState<TransferLine[]>(() =>
    defaultRows?.length
      ? defaultRows.map((r) => ({
          sku: r.sku ?? "",
          variantId: r.variantId,
          quantity: r.quantity,
          resolvedLabel: r.resolvedLabel,
        }))
      : [{ sku: "", variantId: "", quantity: "" }]
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"draft" | "complete" | null>(null);

  useEffect(() => {
    api
      .get("/warehouses", { params: { limit: 500 } })
      .then((res) => setWarehouses(res.data?.data ?? res.data ?? []))
      .catch(() => setWarehouses([]));
    api
      .get("/variants", { params: { limit: 500 } })
      .then((res) => {
        const raw = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(raw) ? raw : [];
        setVariants(
          list.map((v: { id: string; sku: string; product?: { name?: string } }) => ({
            id: v.id,
            sku: v.sku,
            productName: v.product?.name,
          }))
        );
      })
      .catch(() => setVariants([]));
  }, []);

  // Keep form in sync when parent passes defaults after async load (detail page) or remounts.
  useEffect(() => {
    setSourceWarehouseId(defaultSourceId);
    setTargetWarehouseId(defaultTargetId);
  }, [defaultSourceId, defaultTargetId]);

  const patchRow = (index: number, patch: Partial<TransferLine>) => {
    setItemRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addRow = () => {
    setItemRows((prev) => [...prev, { sku: "", variantId: "", quantity: "" }]);
  };

  const onPickVariant = (index: number, variantId: string) => {
    const v = variants.find((x) => x.id === variantId);
    if (!v) {
      patchRow(index, { variantId: "", sku: "", resolvedLabel: undefined, skuError: undefined });
      return;
    }
    const label = v.productName ? `${v.productName} · ${v.sku}` : v.sku;
    patchRow(index, {
      variantId: v.id,
      sku: v.sku,
      resolvedLabel: label,
      skuError: undefined,
    });
  };

  const onSkuBlur = async (index: number) => {
    const sku = itemRows[index].sku.trim();
    if (!sku) {
      patchRow(index, { variantId: "", resolvedLabel: undefined, skuError: undefined, resolving: false });
      return;
    }
    patchRow(index, { resolving: true, skuError: undefined });
    const r = await resolveSkuToVariant(sku);
    if (!r) {
      patchRow(index, {
        variantId: "",
        resolvedLabel: undefined,
        skuError: "No item found for this SKU",
        resolving: false,
      });
      return;
    }
    patchRow(index, {
      variantId: r.id,
      sku: r.sku,
      resolvedLabel: r.label,
      skuError: undefined,
      resolving: false,
    });
  };

  const buildPayload = async (): Promise<TransferCreatePayload | null> => {
    if (!sourceWarehouseId || !targetWarehouseId || sourceWarehouseId === targetWarehouseId) {
      setSubmitError("Select two different warehouses.");
      return null;
    }
    const items: { variantId: string; quantity: number }[] = [];
    for (const row of itemRows) {
      const qty = parseInt(row.quantity, 10);
      if (Number.isNaN(qty) || qty <= 0) continue;
      let vid = row.variantId;
      if (!vid && row.sku.trim()) {
        const r = await resolveSkuToVariant(row.sku);
        if (!r) {
          setSubmitError(`Unknown SKU: ${row.sku.trim()}`);
          return null;
        }
        vid = r.id;
      }
      if (!vid) continue;
      items.push({ variantId: vid, quantity: qty });
    }
    if (items.length === 0) {
      setSubmitError(
        "Add at least one line with a quantity and a SKU (type or scan the SKU, or pick an item from the list)."
      );
      return null;
    }
    return { sourceWarehouseId, targetWarehouseId, items };
  };

  const run = async (kind: "draft" | "complete") => {
    setSubmitError(null);
    const payload = await buildPayload();
    if (!payload) return;
    const fn = kind === "draft" ? onSaveDraft : onComplete;
    if (!fn) return;
    setBusy(kind);
    try {
      await fn(payload);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setSubmitError(err.response?.data?.error || err.message || "Request failed");
    } finally {
      setBusy(null);
    }
  };

  const variantLabel = (v: VariantOption) =>
    v.productName ? `${v.sku} — ${v.productName}` : v.sku;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        run("complete");
      }}
    >
      <p className="text-sm text-gray-600">
        Each <strong className="font-medium text-gray-800">item</strong> is a variant identified by its{" "}
        <strong className="font-medium text-gray-800">SKU</strong> (stock is tracked per variant). Enter or scan the
        SKU, or pick from the list.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">FROM WAREHOUSE *</label>
          <select
            value={sourceWarehouseId}
            onChange={(e) => setSourceWarehouseId(e.target.value)}
            disabled={disabled}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">TO WAREHOUSE *</label>
          <select
            value={targetWarehouseId}
            onChange={(e) => setTargetWarehouseId(e.target.value)}
            disabled={disabled}
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase text-gray-700">Lines</h3>
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">SKU *</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Qty *</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 align-top">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      autoComplete="off"
                      value={row.sku}
                      onChange={(e) =>
                        patchRow(i, {
                          sku: e.target.value,
                          variantId: "",
                          resolvedLabel: undefined,
                          skuError: undefined,
                        })
                      }
                      onBlur={() => onSkuBlur(i)}
                      disabled={disabled}
                      placeholder="Type or scan SKU"
                      className="w-full min-w-[140px] rounded border border-gray-200 px-2 py-1.5 font-mono text-xs disabled:bg-gray-50"
                    />
                    {row.resolving && <p className="mt-0.5 text-[10px] text-gray-400">Looking up…</p>}
                    {row.skuError && <p className="mt-0.5 text-[10px] text-red-600">{row.skuError}</p>}
                  </td>
                  <td className="px-3 py-2">
                    <p className="min-h-[28px] text-xs text-gray-700">
                      {row.resolvedLabel ? (
                        <span title="Resolved from SKU or picker">{row.resolvedLabel}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </p>
                    <label className="mt-1 block text-[10px] font-medium uppercase text-gray-400">Or pick</label>
                    <select
                      value={row.variantId}
                      onChange={(e) => onPickVariant(i, e.target.value)}
                      disabled={disabled}
                      className="mt-0.5 w-full max-w-[220px] rounded border border-gray-200 px-2 py-1 text-xs disabled:bg-gray-50"
                    >
                      <option value="">—</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {variantLabel(v)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => patchRow(i, { quantity: e.target.value })}
                      disabled={disabled}
                      placeholder="Qty"
                      className="w-full max-w-[100px] rounded border border-gray-200 px-2 py-1.5 tabular-nums disabled:bg-gray-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!disabled && (
          <button type="button" onClick={addRow} className="mt-2 text-sm text-blue-600 hover:underline">
            + Add line
          </button>
        )}
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      {!disabled && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
          {showDraftButton && onSaveDraft && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => run("draft")}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              {busy === "draft" ? "Saving…" : "Save as draft"}
            </button>
          )}
          {showCompleteButton && onComplete && (
            <button
              type="submit"
              disabled={!!busy}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy === "complete" ? "Completing…" : "Complete transfer"}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
