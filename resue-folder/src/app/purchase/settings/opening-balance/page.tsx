"use client";

export default function OpeningBalanceSettingsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">OPENING BALANCE</h1>
      <p className="mb-6 text-sm text-gray-500">Add supplier opening balance. Enter supplier, amount, and as-on date.</p>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        Supplier, Opening balance (DR/CR), As on date, Notes.
      </div>
    </div>
  );
}
