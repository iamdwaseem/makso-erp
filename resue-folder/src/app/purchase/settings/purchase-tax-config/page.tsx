"use client";

export default function PurchaseTaxConfigSettingsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">PURCHASE TAX CONFIG</h1>
      <p className="mb-6 text-sm text-gray-500">Set taxes for particular items and item groups. Configure tax rates and applicability.</p>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        Tax rules: Item / Item group, Tax name, Rate %, Effective from.
      </div>
    </div>
  );
}
