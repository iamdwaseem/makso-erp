import { Pencil, Printer, Save, X } from "lucide-react";
import { useMemo, useState } from "react";

const COMPANY = {
  name: "MAKSO Trading",
  address: "Port Saeed, Deira City Center, Dubai, UAE",
  phone: "+971 567 360313, +91 9747370088",
  email: "info@maksotrading.com",
  website: "https://maksotrading.com",
  trn: "123123123123123",
};

export type DeliveryNoteLine = {
  slNo: number;
  item: string;
  quantity: number;
  unit: string;
  rate: number;
};

export type DeliveryNoteDetailView = {
  deliveryNo: string;
  deliveryDate: string;
  customer: string;
  customerAddress?: string;
  customerPhone?: string;
  warehouseName?: string;
  warehouseAddress?: string;
  warehousePhone?: string;
  items: DeliveryNoteLine[];
};

type Props = {
  initial: DeliveryNoteDetailView;
};

export function PrintDeliveryNoteView({ initial }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<DeliveryNoteDetailView>(initial);
  const header = useMemo(() => {
    const hasWarehouseHeader = Boolean(draft.warehouseName || draft.warehouseAddress || draft.warehousePhone);
    if (!hasWarehouseHeader) return COMPANY;
    return {
      name: draft.warehouseName || COMPANY.name,
      address: draft.warehouseAddress || COMPANY.address,
      phone: draft.warehousePhone || COMPANY.phone,
      email: COMPANY.email,
      website: COMPANY.website,
      trn: COMPANY.trn,
    };
  }, [draft.warehouseName, draft.warehouseAddress, draft.warehousePhone]);

  const totals = useMemo(() => {
    const rows = draft.items.map((r) => ({
      ...r,
      amount: Number(r.quantity || 0) * Number(r.rate || 0),
    }));
    const grandTotal = rows.reduce((s, r) => s + r.amount, 0);
    return { rows, grandTotal };
  }, [draft.items]);

  const CopyBody = ({ copyLabel }: { copyLabel: string }) => (
    <div className="p-6">
      <div className="mb-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
        {copyLabel}
      </div>
      <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{header.name}</h3>
            <p className="mt-1 text-sm text-gray-600">{header.address}</p>
            <p className="text-xs text-gray-600">
              {header.phone} | {header.email}
            </p>
            <p className="text-xs text-gray-600">TRN: {header.trn}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">DELIVERY NOTE</p>
            <p className="mt-2 text-sm font-medium text-gray-700">Delivery # {draft.deliveryNo}</p>
            <p className="text-sm text-gray-600">Date: {draft.deliveryDate}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Deliver to / Customer</p>
            {editMode ? (
              <div className="space-y-2">
                <input
                  value={draft.customer}
                  onChange={(e) => setDraft((p) => ({ ...p, customer: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-medium"
                  placeholder="Customer name"
                />
                <input
                  value={draft.customerPhone ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, customerPhone: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="GSM Number"
                />
                <textarea
                  value={draft.customerAddress ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, customerAddress: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Address"
                  rows={2}
                />
              </div>
            ) : (
              <>
                <p className="font-semibold text-gray-900">{draft.customer || "—"}</p>
                <p className="text-sm text-gray-600">{draft.customerAddress ?? "—"}</p>
                <p className="text-sm text-gray-600">Phone: {draft.customerPhone ?? "—"}</p>
              </>
            )}
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Prepared by: —</p>
            <p>Warehouse: {draft.warehouseName || "—"}</p>
            {draft.warehouseAddress ? <p className="text-xs text-gray-500">{draft.warehouseAddress}</p> : null}
            {draft.warehousePhone ? <p className="text-xs text-gray-500">Phone: {draft.warehousePhone}</p> : null}
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-50 text-left text-xs font-medium uppercase text-gray-600">
              <th className="px-3 py-2">Sl.No</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-right">Quantity</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {totals.rows.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="px-3 py-2">{row.slNo}</td>
                <td className="px-3 py-2">
                  {editMode ? (
                    <input
                      value={row.item}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.map((x) => (x.slNo === row.slNo ? { ...x, item: e.target.value } : x)),
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  ) : (
                    row.item
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {editMode ? (
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.map((x) =>
                            x.slNo === row.slNo ? { ...x, quantity: Number(e.target.value || 0) } : x
                          ),
                        }))
                      }
                      className="w-24 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                    />
                  ) : (
                    row.quantity
                  )}
                </td>
                <td className="px-3 py-2">
                  {editMode ? (
                    <input
                      value={row.unit}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.map((x) => (x.slNo === row.slNo ? { ...x, unit: e.target.value } : x)),
                        }))
                      }
                      className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  ) : (
                    row.unit
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {editMode ? (
                    <input
                      type="number"
                      value={row.rate}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.map((x) =>
                            x.slNo === row.slNo ? { ...x, rate: Number(e.target.value || 0) } : x
                          ),
                        }))
                      }
                      className="w-24 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                    />
                  ) : (
                    row.rate.toLocaleString()
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{row.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <table className="w-full max-w-xs text-sm">
            <tbody>
              <tr className="border-t-2 border-gray-300 font-semibold">
                <td className="py-2">Grand Total (AED)</td>
                <td className="py-2 text-right tabular-nums">
                  {totals.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 flex justify-between border-t border-gray-200 pt-8 text-sm text-gray-600">
          <p>Receiver Signature</p>
          <p>For {header.name}</p>
        </div>
    </div>
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm" id="delivery-note-print">
      <div className="no-print flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
        <h2 className="text-lg font-semibold uppercase">GOODS DELIVERY NOTE / {draft.deliveryNo}</h2>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex items-center gap-2 rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
              >
                <Save className="h-4 w-4" />
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(initial);
                  setEditMode(false);
                }}
                className="flex items-center gap-2 rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
              >
                <X className="h-4 w-4" />
                Reset
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      <CopyBody copyLabel="Office copy" />
      <div className="page-break" />
      <CopyBody copyLabel="Customer copy" />
    </div>
  );
}

