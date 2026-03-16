"use client";

export default function BillSettingsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">PURCHASE SETTINGS</h1>
      <p className="mb-6 text-sm text-gray-500">Discount settings and Bill Layout for purchase bills.</p>
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-medium text-gray-900">Discount settings</h3>
          <p className="mt-1 text-sm text-gray-500">Default discount %, max discount allowed, round-off rules.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-medium text-gray-900">Bill Layout</h3>
          <p className="mt-1 text-sm text-gray-500">Header, footer, logo, terms & conditions for purchase bills.</p>
        </div>
      </div>
    </div>
  );
}
