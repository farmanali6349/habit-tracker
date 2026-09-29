"use client";

import { useMemo } from "react";
import { FlameIcon, PanelLeftIcon } from "lucide-react";
import { useApp } from "./AppProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { habitsForIdentity } from "@/lib/identity";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Footer: streak + the identity you're becoming, then the collapse control. */
export default function SidebarFooter({
  collapsed,
  onToggle,
}: SidebarFooterProps) {
  const { state, derived } = useApp();
  const { topStreak } = derived;

  const topIdentity = useMemo(() => {
    if (!state.identities.length) return null;
    return [...state.identities].sort(
      (a, b) =>
        habitsForIdentity(state.habits, b.id).length -
        habitsForIdentity(state.habits, a.id).length,
    )[0];
  }, [state.identities, state.habits]);

  const collapseButton = (
    <Button
      variant="ghost"
      size={collapsed ? "icon-sm" : "sm"}
      aria-label={
        collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"
      }
      aria-pressed={collapsed}
      onClick={onToggle}
      className={cn(!collapsed && "w-full justify-between")}
    >
      <span className="flex items-center gap-2">
        <PanelLeftIcon
          className={cn("transition-transform", collapsed && "rotate-180")}
        />
        {!collapsed && "Collapse"}
      </span>
      {!collapsed && (
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground">
          ⌘B
        </kbd>
      )}
    </Button>
  );

  return (
    <div
      className={cn(
        "shrink-0 border-t p-2",
        collapsed && "flex flex-col items-center gap-1.5",
      )}
    >
      {(topStreak > 0 || topIdentity) && (
        <div
          className={cn(
            "mb-1.5 flex gap-1.5",
            collapsed ? "flex-col items-center" : "flex-col",
          )}
        >
          {topStreak > 0 && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-muted-foreground",
                collapsed && "justify-center px-0",
              )}
              aria-label={`${topStreak}-day streak`}
            >
              <FlameIcon className="size-3.5 shrink-0 text-warning" />
              <span className="tabular-nums">
                {topStreak}
                {!collapsed && "d streak"}
              </span>
            </div>
          )}
          {topIdentity && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-1.5 py-1 text-xs text-muted-foreground",
                collapsed && "justify-center px-0",
              )}
              title={`I am becoming ${topIdentity.statement}`}
            >
              <span aria-hidden>{topIdentity.emoji}</span>
              {!collapsed && (
                <span className="min-w-0 truncate">
                  I am becoming {topIdentity.statement}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{collapseButton}</TooltipTrigger>
          <TooltipContent side="right">Expand sidebar (Ctrl+B)</TooltipContent>
        </Tooltip>
      ) : (
        collapseButton
      )}
    </div>
  );
}
