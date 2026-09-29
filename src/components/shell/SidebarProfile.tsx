"use client";

import { useApp } from "./AppProvider";
import UserAvatar from "./UserAvatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarProfileProps {
  collapsed?: boolean;
}

/** The person block: avatar + name, opening the profile dialog on click. */
export default function SidebarProfile({ collapsed = false }: SidebarProfileProps) {
  const { state, openProfile } = useApp();
  const name = state.profile.displayName.trim();
  const region = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={openProfile}
          aria-label={name ? `Edit profile for ${name}` : "Set your name"}
          className={cn(
            "flex w-full items-center rounded-lg text-start outline-none transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
            collapsed ? "justify-center p-0" : "gap-2.5 p-1.5",
          )}
        >
          <UserAvatar name={name} />
          <span
            aria-hidden={collapsed}
            className={cn(
              "min-w-0 flex-1 overflow-hidden transition-[max-width,opacity] duration-200 ease-out motion-reduce:transition-none",
              collapsed ? "max-w-0 opacity-0" : "max-w-[12rem] opacity-100",
            )}
          >
            <span className="block truncate text-sm font-medium">
              {name || "Set your name"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {region}
            </span>
          </span>
        </button>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right">{name || "Set your name"}</TooltipContent>
      )}
    </Tooltip>
  );
}
