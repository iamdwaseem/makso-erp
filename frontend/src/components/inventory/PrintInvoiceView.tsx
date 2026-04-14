import { Copy, MoreVertical, Pencil, Printer, Save, X } from "lucide-react";
import { useMemo, useState } from "react";

const COMPANY = {
  name: "MAKSO Trading",
  address: "Port Saeed, Deira City Center, Dubai, UAE",
  phone: "+971 567 360313, +91 9747370088",
  email: "info@maksotrading.com",
  website: "https://maksotrading.com",
  trn: "123123123123123",
};

export type InvoiceLine = {
  slNo: number;
  item: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  vatPercent?: number;
  vatAmount?: number;
  total?: number;
};

export type InvoiceDetailView = {
  invoiceNo: string;
  invoiceDate: string;
  orderId?: string | null;
  supplier: string;
  supplierAddress?: string;
  supplierPhone?: string;
  warehouseName?: string;
  warehouseAddress?: string;
  warehousePhone?: string;
  contactPerson?: string;
  center?: string;
  employee?: string;
  gstn?: string;
  suppInvoiceNo?: string;
  payMode?: string;
  items: InvoiceLine[];
  subtotal?: number;
  discount?: number;
  taxableAmount?: number;
  taxAmount?: number;
  grandTotal: number;
  grandTotalWords?: string;
  balance?: number;
};

type Props = { invoice: InvoiceDetailView };

export function PrintInvoiceView({ invoice }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<InvoiceDetailView>(invoice);
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
    const rows = draft.items.map((r) => {
      const qty = Number(r.quantity || 0);
      const rate = Number(r.rate || 0);
      const amount = qty * rate;
      const vatPercent = r.vatPercent == null ? 0 : Number(r.vatPercent || 0);
      const vatAmount = amount * (vatPercent / 100);
      const total = amount + vatAmount;
      return { ...r, quantity: qty, rate, amount, vatPercent, vatAmount, total };
    });
    const subtotal = rows.reduce((s, r) => s + r.amount, 0);
    const taxAmount = rows.reduce((s, r) => s + (r.vatAmount || 0), 0);
    const grandTotal = subtotal + taxAmount - Number(draft.discount || 0);
    return { rows, subtotal, taxAmount, grandTotal };
  }, [draft.items, draft.discount]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm" id="purchase-invoice-print">
      {/* Toolbar - hidden when printing */}
      <div className="no-print flex items-center justify-between border-b border-gray-200 bg-[#1e293b] px-6 py-3 text-white">
        <h2 className="text-lg font-semibold uppercase">PURCHASE INVOICE / {draft.invoiceNo}</h2>
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
                  setDraft(invoice);
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
            aria-label="Print"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button type="button" className="rounded p-2 text-white/90 hover:bg-white/10" aria-label="Copy">
            <Copy className="h-5 w-5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded p-2 text-white/90 hover:bg-white/10"
              aria-label="Menu"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded border border-gray-200 bg-white py-1 text-gray-800 shadow-lg">
                  <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    Create Payment
                  </button>
                  <button type="button" className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">
                    Export PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Printable invoice body */}
      <div className="p-6">
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
            <p className="text-2xl font-bold text-gray-900">TAX INVOICE</p>
            <p className="mt-2 text-sm font-medium text-gray-700">
              Invoice #{" "}
              {editMode ? (
                <input
                  value={draft.invoiceNo}
                  onChange={(e) => setDraft((p) => ({ ...p, invoiceNo: e.target.value }))}
                  className="ml-2 w-44 rounded border border-gray-300 px-2 py-1 text-sm font-mono"
                />
              ) : (
                draft.invoiceNo
              )}
            </p>
            <p className="text-sm text-gray-600">
              Date:{" "}
              {editMode ? (
                <input
                  value={draft.invoiceDate}
                  onChange={(e) => setDraft((p) => ({ ...p, invoiceDate: e.target.value }))}
                  className="ml-2 w-52 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              ) : (
                draft.invoiceDate
              )}
            </p>
            {draft.orderId && <p className="text-sm text-gray-600">Order Ref: {draft.orderId}</p>}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Bill to / Supplier</p>
            {editMode ? (
              <div className="space-y-2">
                <input
                  value={draft.supplier}
                  onChange={(e) => setDraft((p) => ({ ...p, supplier: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-semibold"
                  placeholder="Supplier"
                />
                <textarea
                  value={draft.supplierAddress ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, supplierAddress: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Supplier address"
                  rows={2}
                />
                <input
                  value={draft.supplierPhone ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, supplierPhone: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="GSM Number"
                />
                <input
                  value={draft.contactPerson ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, contactPerson: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Contact person"
                />
                <input
                  value={draft.gstn ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, gstn: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="GSTN / TRN"
                />
              </div>
            ) : (
              <>
                <p className="font-semibold text-gray-900">{draft.supplier}</p>
                <p className="text-sm text-gray-600">{draft.supplierAddress ?? "—"}</p>
                <p className="text-sm text-gray-600">Phone: {draft.supplierPhone ?? "—"}</p>
                <p className="text-sm text-gray-600">Contact: {draft.contactPerson ?? "—"}</p>
                {draft.gstn && <p className="text-sm text-gray-600">GSTN / TRN: {draft.gstn}</p>}
              </>
            )}
          </div>
          <div className="text-right text-sm">
            <p>
              <span className="text-gray-500">Supplier Inv No:</span>{" "}
              {editMode ? (
                <input
                  value={draft.suppInvoiceNo ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, suppInvoiceNo: e.target.value }))}
                  className="ml-2 w-44 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              ) : (
                draft.suppInvoiceNo ?? "—"
              )}
            </p>
            <p>
              <span className="text-gray-500">Center:</span>{" "}
              {editMode ? (
                <input
                  value={draft.center ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, center: e.target.value }))}
                  className="ml-2 w-44 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              ) : (
                draft.center ?? "—"
              )}
            </p>
            <p>
              <span className="text-gray-500">In Charge:</span>{" "}
              {editMode ? (
                <input
                  value={draft.employee ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, employee: e.target.value }))}
                  className="ml-2 w-44 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              ) : (
                draft.employee ?? "—"
              )}
            </p>
            <p>
              <span className="text-gray-500">Payment Mode:</span>{" "}
              {editMode ? (
                <input
                  value={draft.payMode ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, payMode: e.target.value }))}
                  className="ml-2 w-44 rounded border border-gray-300 px-2 py-1 text-sm"
                />
              ) : (
                draft.payMode ?? "—"
              )}
            </p>
            {(draft.warehouseName || draft.warehouseAddress || draft.warehousePhone) && (
              <div className="mt-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs text-gray-700">
                <div className="font-semibold uppercase tracking-wide text-gray-500">Warehouse (Stock In)</div>
                {draft.warehouseName && <div className="mt-1 font-medium">{draft.warehouseName}</div>}
                {draft.warehouseAddress && <div className="text-gray-600">{draft.warehouseAddress}</div>}
                {draft.warehousePhone && <div className="text-gray-600">Phone: {draft.warehousePhone}</div>}
              </div>
            )}
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
              <th className="px-3 py-2 text-right">VAT %</th>
              <th className="px-3 py-2 text-right">VAT Amount</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {totals.rows.map((row) => (
              <tr key={row.slNo} className="border-b border-gray-100">
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
                <td className="px-3 py-2 text-right tabular-nums">
                  {editMode ? (
                    <input
                      type="number"
                      value={row.vatPercent ?? 0}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.map((x) =>
                            x.slNo === row.slNo ? { ...x, vatPercent: Number(e.target.value || 0) } : x
                          ),
                        }))
                      }
                      className="w-20 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                    />
                  ) : (
                    row.vatPercent ?? "—"
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{(row.vatAmount ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{(row.total ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <table className="w-full max-w-xs text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600">Subtotal</td>
                <td className="py-1 text-right tabular-nums">
                  {totals.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {editMode && (
                <tr>
                  <td className="py-1 text-gray-600">Discount</td>
                  <td className="py-1 text-right tabular-nums">
                    <input
                      type="number"
                      value={draft.discount ?? 0}
                      onChange={(e) => setDraft((p) => ({ ...p, discount: Number(e.target.value || 0) }))}
                      className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-sm"
                    />
                  </td>
                </tr>
              )}
              {!editMode && (draft.discount ?? 0) > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">Discount</td>
                  <td className="py-1 text-right tabular-nums">
                    ({(draft.discount ?? 0).toLocaleString()})
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-1 text-gray-600">Tax</td>
                <td className="py-1 text-right tabular-nums">
                  {totals.taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-t-2 border-gray-300 font-semibold">
                <td className="py-2">Grand Total (AED)</td>
                <td className="py-2 text-right tabular-nums">
                  {totals.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {(draft.balance ?? 0) > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">Balance Due</td>
                  <td className="py-1 text-right tabular-nums font-medium">
                    {(draft.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm font-medium text-gray-700">
          Amount in words:{" "}
          {editMode ? (
            <input
              value={draft.grandTotalWords ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, grandTotalWords: e.target.value }))}
              className="ml-2 w-full max-w-xl rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="(optional)"
            />
          ) : (
            draft.grandTotalWords ?? "—"
          )}
        </p>

        <div className="mt-12 flex justify-between border-t border-gray-200 pt-8 text-sm text-gray-600">
          <p>Authorized Signature</p>
          <p>For {header.name}</p>
        </div>
      </div>
    </div>
  );
}

