"use client";

import { usePathname } from "next/navigation";
import NavLink from "./NavLink";
import { Separator } from "@/components/ui/separator";
import { NAV_GROUPS, isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** Grouped primary navigation, shared by the desktop rail and mobile drawer. */
export default function SidebarNav({
  collapsed = false,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex flex-1 flex-col gap-1 overflow-y-auto p-2"
    >
      {NAV_GROUPS.map((group, index) => (
        <div key={group.label} className="flex flex-col gap-1">
          {collapsed ? (
            index > 0 && <Separator className="my-1" />
          ) : (
            <p
              className={cn(
                "px-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
                index > 0 && "pt-2",
              )}
            >
              {group.label}
            </p>
          )}
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
