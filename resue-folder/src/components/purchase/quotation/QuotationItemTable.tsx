"use client";

import { Plus } from "lucide-react";

export type QuotationItemRow = {
  slNo: number;
  item: string;
  quantity: string;
  unit: string;
  price: string;
  taxes: string;
  priceTaxInc: string;
  total: string;
};

type QuotationItemTableProps = {
  rows: QuotationItemRow[];
  onRowsChange: (rows: QuotationItemRow[]) => void;
  taxExclusive: string;
  onTaxExclusiveChange: (value: string) => void;
};

export default function QuotationItemTable({
  rows,
  onRowsChange,
  taxExclusive,
  onTaxExclusiveChange,
}: QuotationItemTableProps) {
  const addRow = () => {
    onRowsChange([
      ...rows,
      {
        slNo: rows.length + 1,
        item: "",
        quantity: "",
        unit: "",
        price: "",
        taxes: "",
        priceTaxInc: "0",
        total: "",
      },
    ]);
  };

  const updateRow = (index: number, field: keyof QuotationItemRow, value: string) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    const qty = parseFloat(next[index].quantity) || 0;
    const price = parseFloat(next[index].price) || 0;
    next[index].total = (qty * price).toFixed(2);
    onRowsChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase text-gray-700">ITEMS</h3>
        <select
          value={taxExclusive}
          onChange={(e) => onTaxExclusiveChange(e.target.value)}
          className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600"
        >
          <option>Tax Exclusive</option>
          <option>Tax Inclusive</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <th className="w-14 px-3 py-2">Sl.No</th>
              <th className="min-w-[140px] px-3 py-2">Item</th>
              <th className="w-10 px-3 py-2"></th>
              <th className="w-24 px-3 py-2">Quantity</th>
              <th className="w-24 px-3 py-2">Unit</th>
              <th className="w-24 px-3 py-2">Price</th>
              <th className="w-20 px-3 py-2">Taxes</th>
              <th className="w-28 px-3 py-2">Price (tax inc.)</th>
              <th className="w-24 px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="px-3 py-2">{row.slNo}</td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.item}
                    onChange={(e) => updateRow(index, "item", e.target.value)}
                    placeholder="Item"
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={addRow}
                    className="rounded-full bg-gray-100 p-1 text-gray-600 hover:bg-gray-200"
                    aria-label="Add row"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, "quantity", e.target.value)}
                    placeholder="Quantity"
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.unit}
                    onChange={(e) => updateRow(index, "unit", e.target.value)}
                    placeholder="Unit"
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.price}
                    onChange={(e) => updateRow(index, "price", e.target.value)}
                    placeholder="Price"
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.taxes}
                    onChange={(e) => updateRow(index, "taxes", e.target.value)}
                    placeholder="Tax"
                    className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-gray-600">{row.priceTaxInc}</td>
                <td className="px-3 py-2 text-gray-800">{row.total || "0"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
