"use client";

import { Menu, PanelLeft, Monitor } from "lucide-react";
import Connect from "./Connect";

type Props = {
  onOpenMenu: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
  onConnectDevice: () => void;
};

export default function Topbar({
  onOpenMenu,
  onToggleCollapse,
  collapsed,
  onConnectDevice,
}: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-800 bg-black px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile: open drawer */}
        <button
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="rounded-lg p-2 text-white hover:bg-neutral-900 lg:hidden">
          <Menu size={24} strokeWidth={1.8} />
        </button>

        {/* Desktop: collapse / expand sidebar */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden rounded-lg p-2 text-white hover:bg-neutral-900 lg:inline-flex">
          <PanelLeft size={20} strokeWidth={1.8} />
        </button>
      </div>

      {/* Connect device */}
      <Connect />
    </header>
  );
}
