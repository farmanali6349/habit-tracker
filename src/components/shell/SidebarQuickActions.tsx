"use client";

import { DownloadIcon, PlusIcon } from "lucide-react";
import ReminderMenu from "@/components/ReminderMenu";
import { useApp } from "./AppProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarQuickActionsProps {
  collapsed?: boolean;
}

/** Common actions kept one click away: add a habit, reminders, export. */
export default function SidebarQuickActions({
  collapsed = false,
}: SidebarQuickActionsProps) {
  const { openHabitForm, openExport } = useApp();

  const addButton = (
    <Button
      variant={collapsed ? "outline" : "default"}
      size={collapsed ? "icon-sm" : "sm"}
      aria-label="Add habit"
      className={cn(!collapsed && "w-full justify-start")}
      onClick={() => openHabitForm("new")}
    >
      <PlusIcon data-icon={collapsed ? undefined : "inline-start"} />
      {!collapsed && "Add habit"}
    </Button>
  );

  const exportButton = (
    <Button
      variant="outline"
      size={collapsed ? "icon-sm" : "sm"}
      aria-label="Export or back up"
      className={cn(!collapsed && "w-full justify-start")}
      onClick={openExport}
    >
      <DownloadIcon data-icon={collapsed ? undefined : "inline-start"} />
      {!collapsed && "Export"}
    </Button>
  );

  return (
    <div className={cn("flex flex-col gap-1.5", collapsed && "items-center")}>
      {collapsed ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>{addButton}</TooltipTrigger>
            <TooltipContent side="right">Add habit</TooltipContent>
          </Tooltip>
          <ReminderMenu compact />
          <Tooltip>
            <TooltipTrigger asChild>{exportButton}</TooltipTrigger>
            <TooltipContent side="right">Export</TooltipContent>
          </Tooltip>
        </>
      ) : (
        <>
          {addButton}
          <ReminderMenu className="w-full justify-start" />
          {exportButton}
        </>
      )}
    </div>
  );
}
