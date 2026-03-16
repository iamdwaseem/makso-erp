"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import ExpenseAllocationTable, { type AllocationRow } from "./ExpenseAllocationTable";

type PurchaseExpenseFormProps = {
  onSave: () => void;
  onSaveAndApprove: () => void;
  onReset: () => void;
  onCancel: () => void;
};

export default function PurchaseExpenseForm({ onSave, onSaveAndApprove, onReset, onCancel }: PurchaseExpenseFormProps) {
  const [date, setDate] = useState("21/10/2021");
  const [orderId, setOrderId] = useState("");
  const [purchaseInvoice, setPurchaseInvoice] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>([{ slNo: 1, item: "", batch: "", allocationPercent: "", amount: "" }]);

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
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
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">ORDER ID</label>
          <div className="flex gap-1">
            <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order Id" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Search className="h-4 w-4" /></button>
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
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">RECEIPT NOTES</label>
          <input type="text" value={receiptNotes} onChange={(e) => setReceiptNotes(e.target.value)} placeholder="Transaction" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">EXPENSE TYPE *</label>
          <div className="flex gap-1">
            <input type="text" value={expenseType} onChange={(e) => setExpenseType(e.target.value)} placeholder="Expense Type" className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm" />
            <button type="button" className="rounded border border-gray-200 bg-gray-50 p-2"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">PAYMENT MODE *</label>
          <input type="text" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} placeholder="Payment mode *" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">AMOUNT *</label>
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (Tax Inclusive, if any)" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-gray-600">NOTES</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full rounded border border-gray-200 px-3 py-2 text-sm" />
        </div>
      </div>
      <ExpenseAllocationTable rows={allocationRows} onRowsChange={setAllocationRows} />
      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <button type="button" onClick={onCancel} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={onReset} className="rounded border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Reset</button>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save</button>
        <button type="button" onClick={onSaveAndApprove} className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">Save And Approve</button>
      </div>
    </form>
  );
}
