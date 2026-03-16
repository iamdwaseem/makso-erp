"use client";

export default function PricingRuleSettingsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">PRICING RULE</h1>
      <p className="mb-6 text-sm text-gray-500">Create pricing rules for purchase (e.g. bulk discount, supplier-specific rules).</p>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        Define rules: name, type (percentage/fixed), applicable to (item/supplier/group), value.
      </div>
    </div>
  );
}
