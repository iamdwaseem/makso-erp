import type { Metadata } from "next";
import DashboardData from "@/components/dashboard/DashboardData";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return <DashboardData />;
}
