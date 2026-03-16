import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory | MAKSO Trading",
  description: "Inventory module - Dashboard, Items, Transfers, Reports",
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
