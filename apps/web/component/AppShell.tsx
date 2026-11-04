"use client";

import { useEffect, useState } from "react";

import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false); // drawer on phones/tablets
  const [collapsed, setCollapsed] = useState(false); // icon-only on desktop

  // Close drawer with Escape + lock body scroll while it is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen  text-slate-900 bg-black  dark:text-slate-100">
      <Sidebar
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
      />

      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}>
        <Topbar
          onOpenMenu={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
          onConnectDevice={() => {
            // Open your connect-device modal or page
          }}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
