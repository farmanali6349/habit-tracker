"use client";

import { useEffect, useRef, useState } from "react";
import SidebarFooter from "./SidebarFooter";
import SidebarNav from "./SidebarNav";
import SidebarProfile from "./SidebarProfile";
import SidebarQuickActions from "./SidebarQuickActions";
import SidebarStatus from "./SidebarStatus";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

const PEEK_DELAY = 120;

/** Fixed desktop rail: profile, grouped nav, today's status, quick actions. */
export default function AppSidebar() {
  const { collapsed, toggle } = useSidebar();
  const [peek, setPeek] = useState(false);
  const openTimer = useRef<number | null>(null);

  const expanded = !collapsed || peek;

  const clearTimer = () => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const handleEnter = () => {
    if (!collapsed) return;
    clearTimer();
    openTimer.current = window.setTimeout(() => setPeek(true), PEEK_DELAY);
  };

  const handleLeave = () => {
    clearTimer();
    setPeek(false);
  };

  const handleToggle = () => {
    if (peek) {
      setPeek(false);
      return;
    }
    toggle();
  };

  useEffect(() => clearTimer, []);

  return (
    <aside
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocusCapture={() => {
        if (collapsed) setPeek(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPeek(false);
        }
      }}
      className={cn(
        "fixed inset-y-0 start-0 z-40 hidden shrink-0 flex-col overflow-hidden border-e bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out motion-reduce:transition-none md:flex",
        expanded ? "w-60" : "w-16",
        collapsed && peek && "shadow-xl",
      )}
    >
      <div className={cn("shrink-0 p-2", !expanded && "flex justify-center")}>
        <SidebarProfile collapsed={!expanded} />
      </div>

      <SidebarNav collapsed={!expanded} />

      <div className="shrink-0 space-y-2 px-2 pb-2">
        <SidebarStatus collapsed={!expanded} />
        <SidebarQuickActions collapsed={!expanded} />
      </div>

      <SidebarFooter collapsed={!expanded} onToggle={handleToggle} />
    </aside>
  );
}
