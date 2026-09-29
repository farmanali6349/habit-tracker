"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftIcon, SparklesIcon } from "lucide-react";
import NavLink from "./NavLink";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NAV_ITEMS, isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

const NAV_KEY = "ht_nav";

const navListeners = new Set<() => void>();

const navStore = {
  get: (): boolean => {
    try {
      return localStorage.getItem(NAV_KEY) === "1";
    } catch {
      return false;
    }
  },
  set: (collapsed: boolean): void => {
    try {
      localStorage.setItem(NAV_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
    navListeners.forEach((listener) => listener());
  },
  subscribe: (listener: () => void): (() => void) => {
    navListeners.add(listener);
    return () => {
      navListeners.delete(listener);
    };
  },
};

export default function AppSidebar() {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    navStore.subscribe,
    navStore.get,
    () => false,
  );

  const toggle = () => navStore.set(!collapsed);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-e bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href="/"
          aria-label="Habit Tracker home"
          className="flex min-w-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SparklesIcon className="size-4" />
          </span>
          {!collapsed && (
            <span className="truncate font-heading text-sm font-semibold">
              Habit Tracker
            </span>
          )}
        </Link>
      </div>

      <nav
        aria-label="Primary"
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-2"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActivePath(pathname, item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div
        className={cn(
          "shrink-0 border-t p-2",
          collapsed && "flex justify-center",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? "icon-sm" : "sm"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
              onClick={toggle}
              className={cn(!collapsed && "w-full justify-start")}
            >
              <PanelLeftIcon
                data-icon={collapsed ? undefined : "inline-start"}
                className={cn("transition-transform", collapsed && "rotate-180")}
              />
              {!collapsed && "Collapse"}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
