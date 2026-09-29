"use client";

import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function NavLink({
  item,
  active,
  collapsed = false,
  onNavigate,
}: NavLinkProps) {
  const Icon = item.icon;

  // The Link is always rendered in the same position (inside TooltipTrigger) so
  // toggling `collapsed` animates the label instead of remounting the link.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          aria-label={collapsed ? item.label : undefined}
          className={cn(
            "relative flex items-center rounded-lg py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
            collapsed ? "justify-center px-0" : "gap-3 px-3",
            active
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          )}
        >
          {active && (
            <span
              aria-hidden
              className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-primary"
            />
          )}
          <Icon className="size-4 shrink-0" />
          <span
            aria-hidden={collapsed}
            className={cn(
              "overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 ease-out motion-reduce:transition-none",
              collapsed
                ? "max-w-0 -translate-x-1 opacity-0"
                : "max-w-[12rem] opacity-100",
            )}
          >
            {item.label}
          </span>
        </Link>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
    </Tooltip>
  );
}
