"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";

type OrderItemRow = {
  slNo: number;
  item: string;
  quantity: string;
  unit: string;
  price: string;
  taxes: string;
  priceTaxInc: string;
  total: string;
};

const initialRows: OrderItemRow[] = [
  { slNo: 1, item: "", quantity: "", unit: "", price: "", taxes: "", priceTaxInc: "0", total: "" },
];

type PurchaseOrderFormProps = {
  onSave: () => void;
  onSaveAndApprove: () => void;
  onReset: () => void;
  onCancel: () => void;
};

export default function PurchaseOrderForm({
  onSave,
  onSaveAndApprove,
  onReset,
  onCancel,
}: PurchaseOrderFormProps) {
  const [date, setDate] = useState("10/21/2021");
  const [formType, setFormType] = useState("Local Purchases");
  const [employeeInCharge, setEmployeeInCharge] = useState("Employee");
  const [supplier, setSupplier] = useState("Supplier");
  const [contactPerson, setContactPerson] = useState("Contact");
  const [supplierBillingAddress, setSupplierBillingAddress] = useState("Supplier Billing Address");
  const [shippingCenter, setShippingCenter] = useState("Center");
  const [project, setProject] = useState("Project Id");
  const [projectStage, setProjectStage] = useState("Project Stage Id");
  const [itemRows, setItemRows] = useState<OrderItemRow[]>(initialRows);
  const [taxExclusive, setTaxExclusive] = useState("Tax Exclusive");
  const [showShippingError, setShowShippingError] = useState(true);

  const amount = itemRows.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);
  const taxAmount = 0;
  const subTotal = amount + taxAmount;

  const addRow = () => {
    setItemRows((prev) => [
      ...prev,
      {
        slNo: prev.length + 1,
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

  const updateRow = (index: number, field: keyof OrderItemRow, value: string) => {
    const next = [...itemRows];
    next[index] = { ...next[index], [field]: value };
    const qty = parseFloat(next[index].quantity) || 0;
    const price = parseFloat(next[index].price) || 0;
    next[index].total = (qty * price).toFixed(2);
    setItemRows(next);
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
            DATE <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            />
            <span className="flex items-center rounded border border-gray-200 bg-gray-50 px-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
            FORM TYPE <span className="text-red-600">*</span>
          </label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option>Local Purchases</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
            EMPLOYEE IN CHARGE
          </label>
          <input
            type="text"
            value={employeeInCharge}
            onChange={(e) => setEmployeeInCharge(e.target.value)}
            placeholder="Employee"
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
            SUPPLIER <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              required
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Supplier"
              className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm"
            />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2 text-gray-600 hover:bg-gray-100">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2 text-gray-600 hover:bg-gray-100">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
            CONTACT PERSON
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Contact"
              className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm"
            />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2 text-gray-600 hover:bg-gray-100">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2 text-gray-600 hover:bg-gray-100">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
            SUPPLIER BILLING ADDRESS
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={supplierBillingAddress}
              onChange={(e) => setSupplierBillingAddress(e.target.value)}
              placeholder="Supplier Billing Address"
              className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm"
            />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2 text-gray-600 hover:bg-gray-100">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
            SHIPPING CENTER <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            value={shippingCenter}
            onChange={(e) => setShippingCenter(e.target.value)}
            placeholder="Center"
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
          {showShippingError && <p className="mt-1 text-xs text-red-600">Field is required</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
            PROJECT
          </label>
          <input
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Project Id"
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
            PROJECT STAGE
          </label>
          <input
            type="text"
            value={projectStage}
            onChange={(e) => setProjectStage(e.target.value)}
            placeholder="Project Stage Id"
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase text-gray-700">ITEMS</h3>
          <select
            value={taxExclusive}
            onChange={(e) => setTaxExclusive(e.target.value)}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600"
          >
            <option>Tax Exclusive</option>
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
              {itemRows.map((row, index) => (
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

      <div className="flex gap-8">
        <div className="flex-1" />
        <div className="w-56 shrink-0 space-y-2 text-right">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">AMOUNT</span>
            <span>{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">TAX AMOUNT</span>
            <span>{taxAmount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">SUB TOTAL</span>
            <span>{subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">NET TOTAL</span>
            <span className="text-gray-400">Net Total</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ROUND BY</span>
            <span className="text-gray-400">Round by</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-600">TOTAL</span>
            <span className="text-gray-400">Total</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          reset
        </button>
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          save
        </button>
        <button
          type="button"
          onClick={onSaveAndApprove}
          className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Save And Approve
        </button>
      </div>
    </form>
  );
}
