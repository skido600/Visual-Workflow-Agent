"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, History, LogOut } from "lucide-react";
import { toast } from "sonner";

const links = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/history",
    label: "History",
    icon: History,
  },
];

type Props = {
  mobileOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
};

export default function Sidebar({ mobileOpen, collapsed, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Logout failed");
      }

      toast.success("Logged out successfully");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-800 bg-black text-white transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 lg:translate-x-0 ${collapsed ? "lg:w-20" : "lg:w-64"}`}>
        {/* Logo */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-neutral-800 px-5 ${
            collapsed ? "lg:justify-center lg:px-0" : ""
          }`}>
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3">
            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="text-sm font-bold tracking-tight text-white">
                Visual Workflow
              </p>
              <p className="text-[10px] text-neutral-500">AI Desktop Agent</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");

            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                title={collapsed ? link.label : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  collapsed ? "lg:justify-center" : ""
                } ${
                  active
                    ? "bg-white text-black"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                }`}>
                <Icon size={20} strokeWidth={1.8} />

                <span className={collapsed ? "lg:hidden" : ""}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="space-y-4 border-t border-neutral-800 p-4">
          <p
            className={`text-xs text-neutral-500 ${
              collapsed ? "lg:hidden" : ""
            }`}>
            AI-powered desktop automation
          </p>

          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            title={collapsed ? "Logout" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 ${
              collapsed ? "lg:justify-center" : ""
            }`}>
            <LogOut size={18} />

            <span className={collapsed ? "lg:hidden" : ""}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
