import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase | MAKSO Trading",
  description: "Purchase module - Dashboard and Suppliers",
};

export default function PurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
