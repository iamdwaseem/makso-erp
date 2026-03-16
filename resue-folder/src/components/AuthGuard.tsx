"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlobalFilterProvider } from "@/contexts/GlobalFilterContext";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (pathname === "/login") return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
    }
  }, [mounted, pathname, router]);

  if (!mounted) {
    return (
      <div className="glass-bg-page flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
      </div>
    );
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    return (
      <div className="glass-bg-page flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
      </div>
    );
  }

  return (
    <GlobalFilterProvider>
      <div className="glass-bg-page flex min-h-screen">
        <Sidebar />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <TopNavbar />
          <main className="flex-1 overflow-auto bg-gray-50 text-[#000]">{children}</main>
        </div>
      </div>
    </GlobalFilterProvider>
  );
}
