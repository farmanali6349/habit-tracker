"use client";

import SidebarFooter from "./SidebarFooter";
import SidebarNav from "./SidebarNav";
import SidebarProfile from "./SidebarProfile";
import SidebarQuickActions from "./SidebarQuickActions";
import SidebarStatus from "./SidebarStatus";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

/** Fixed desktop rail: profile, grouped nav, today's status, quick actions. */
export default function AppSidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-40 hidden shrink-0 flex-col overflow-hidden border-e bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out motion-reduce:transition-none md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("shrink-0 p-2", collapsed && "flex justify-center")}>
        <SidebarProfile collapsed={collapsed} />
      </div>

      <SidebarNav collapsed={collapsed} />

      <div className="shrink-0 space-y-2 px-2 pb-2">
        <SidebarStatus collapsed={collapsed} />
        <SidebarQuickActions collapsed={collapsed} />
      </div>

      <SidebarFooter collapsed={collapsed} onToggle={toggle} />
    </aside>
  );
}
