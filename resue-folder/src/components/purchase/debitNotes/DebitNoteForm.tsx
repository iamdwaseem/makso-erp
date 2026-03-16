"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";

type DebitNoteFormProps = {
  onSave: () => void;
  onSaveAndApprove: () => void;
  onReset: () => void;
  onCancel: () => void;
};

export default function DebitNoteForm({ onSave, onSaveAndApprove, onReset, onCancel }: DebitNoteFormProps) {
  const [withoutInvoiceRef, setWithoutInvoiceRef] = useState(false);
  const [date, setDate] = useState("21/10/2021");
  const [purchaseInvoice, setPurchaseInvoice] = useState("");
  const [returnOrder, setReturnOrder] = useState("");
  const [formType, setFormType] = useState("Non Tax");
  const [supplier, setSupplier] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [employeeInCharge, setEmployeeInCharge] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [shippingCenter, setShippingCenter] = useState("warehouse");
  const [returnReason, setReturnReason] = useState("");
  const [itemRows, setItemRows] = useState([{ slNo: 1, item: "", quantity: "", unit: "", price: "", total: "" }]);
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={onReset} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50">reset</button>
        <button type="submit" className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">save</button>
        <button type="button" onClick={onSaveAndApprove} className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">Save And Approve</button>
      </div>
      <div className="flex items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={withoutInvoiceRef} onChange={(e) => setWithoutInvoiceRef(e.target.checked)} />
          WITHOUT INVOICE REF
        </label>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">DATE *</label>
          <div className="flex gap-1">
            <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
            <span className="flex items-center rounded border border-gray-200 bg-gray-50 px-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">PURCHASE INVOICE</label>
          <div className="flex gap-1">
            <input type="text" value={purchaseInvoice} onChange={(e) => setPurchaseInvoice(e.target.value)} placeholder="Purchase Invoice" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Search className="h-4 w-4" /></button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">RETURN ORDER</label>
          <div className="flex gap-1">
            <input type="text" value={returnOrder} onChange={(e) => setReturnOrder(e.target.value)} placeholder="Return order" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Search className="h-4 w-4" /></button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">EMPLOYEE IN CHARGE</label>
          <input type="text" value={employeeInCharge} onChange={(e) => setEmployeeInCharge(e.target.value)} placeholder="Employee" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">FORM TYPE *</label>
          <input type="text" value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">SUPPLIER *</label>
          <div className="flex gap-1">
            <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Search className="h-4 w-4" /></button>
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">SUPPLIER INVOICE NUMBER</label>
          <input type="text" value={supplierInvoiceNumber} onChange={(e) => setSupplierInvoiceNumber(e.target.value)} placeholder="Supplier Invoice Number" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">PAYMENT MODE *</label>
          <div className="flex gap-1">
            <input type="text" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} placeholder="Payment mode *" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Search className="h-4 w-4" /></button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">CONTACT PERSON</label>
          <div className="flex gap-1">
            <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contact" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Search className="h-4 w-4" /></button>
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">PAYMENT TERM</label>
          <input type="text" value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)} placeholder="Payment Term" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">SHIPPING CENTER *</label>
          <div className="flex gap-1">
            <input type="text" value={shippingCenter} onChange={(e) => setShippingCenter(e.target.value)} placeholder="Warehouse" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Search className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">RETURN REASON</label>
          <div className="flex gap-1">
            <input type="text" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Return Reason" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase text-gray-700">ITEMS</h3>
          <button type="button" className="text-sm text-red-600 hover:underline">Clear Items</button>
        </div>
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <th className="px-3 py-2">Sl.No</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-2">{row.slNo}</td>
                  <td className="px-3 py-2"><input type="text" value={row.item} onChange={() => {}} placeholder="Item" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                  <td className="px-3 py-2"><input type="text" value={row.quantity} onChange={() => {}} placeholder="Quantity" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                  <td className="px-3 py-2"><input type="text" value={row.unit} onChange={() => {}} placeholder="Unit" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                  <td className="px-3 py-2"><input type="text" value={row.price} onChange={() => {}} placeholder="Price" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                  <td className="px-3 py-2"><input type="text" value={row.total} onChange={() => {}} placeholder="Total" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-600">NOTES</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-gray-600">INTERNAL NOTES</label>
            <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={4} className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="w-48 shrink-0 space-y-2 text-right text-sm">
          <div className="flex justify-between"><span className="text-gray-600">SUB TOTAL</span><span>0</span></div>
          <div className="flex justify-between"><span className="text-gray-600">SHIPPING CHARGE</span><input type="text" placeholder="Shipping charge" className="w-20 rounded border border-gray-200 px-2 py-1 text-sm" /></div>
          <div className="flex justify-between"><span className="text-gray-600">NET TOTAL</span><span className="text-gray-400">Net Total</span></div>
          <div className="flex justify-between"><span className="text-gray-600">ROUND BY</span><span className="text-gray-400">Round by</span></div>
          <div className="flex justify-between font-medium"><span className="text-gray-600">TOTAL</span><span className="text-gray-400">Total</span></div>
        </div>
      </div>
    </form>
  );
}
