"use client";

import { useState } from "react";
import QuotationItemTable, { type QuotationItemRow } from "./QuotationItemTable";
import { Search, Plus } from "lucide-react";

const initialRows: QuotationItemRow[] = [
  { slNo: 1, item: "", quantity: "", unit: "", price: "", taxes: "", priceTaxInc: "0", total: "" },
];

type QuotationFormProps = {
  onSave: () => void;
  onSaveAndApprove: () => void;
  onReset: () => void;
  onCancel: () => void;
};

export default function QuotationForm({
  onSave,
  onSaveAndApprove,
  onReset,
  onCancel,
}: QuotationFormProps) {
  const [date, setDate] = useState("10/21/2021");
  const [quotationRefNo, setQuotationRefNo] = useState("");
  const [formType, setFormType] = useState("");
  const [employeeInCharge, setEmployeeInCharge] = useState("");
  const [supplier, setSupplier] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [supplierBillingAddress, setSupplierBillingAddress] = useState("");
  const [shippingCenter, setShippingCenter] = useState("");
  const [project, setProject] = useState("");
  const [projectStage, setProjectStage] = useState("");
  const [itemRows, setItemRows] = useState<QuotationItemRow[]>(initialRows);
  const [taxExclusive, setTaxExclusive] = useState("Tax Exclusive");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [formTypeError, setFormTypeError] = useState(true);

  const amount = itemRows.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);
  const taxAmount = 0;
  const subTotal = amount + taxAmount;
  const netTotal = subTotal;
  const roundBy = 0;
  const total = netTotal;

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
            QUOTATION REF NO
          </label>
          <input
            type="text"
            value={quotationRefNo}
            onChange={(e) => setQuotationRefNo(e.target.value)}
            placeholder="Quotation Ref No"
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
            FORM TYPE ^
          </label>
          <input
            type="text"
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            placeholder="Form Type"
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
          {formTypeError && <p className="mt-1 text-xs text-red-600">Invalid Data</p>}
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
            placeholder="Warehouse"
            className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          />
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
        <div>
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

      <QuotationItemTable
        rows={itemRows}
        onRowsChange={setItemRows}
        taxExclusive={taxExclusive}
        onTaxExclusiveChange={setTaxExclusive}
      />

      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-600">NOTES</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-600">
              INTERNAL NOTES
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={4}
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
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
            <span>{netTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ROUND BY</span>
            <span>{roundBy}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-600">TOTAL</span>
            <span>{total.toFixed(2)}</span>
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
          className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50"
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
