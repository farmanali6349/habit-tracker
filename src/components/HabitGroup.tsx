"use client";

import { useState } from "react";
import { ChevronRightIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import CategoryIcon from "./CategoryIcon";
import HabitListItem from "./HabitListItem";
import { today } from "@/lib/date";
import { isActive } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type {
  Category,
  Habit,
  HabitLogs,
  HabitMomentInfo,
  HabitStats,
} from "@/types";

interface HabitGroupProps {
  category: Category;
  habits: Habit[];
  logs: HabitLogs;
  stats: Record<string, HabitStats>;
  /** habitId → live window + status for today. */
  moments: Map<string, HabitMomentInfo>;
  nowMinutes: number;
  defaultOpen?: boolean;
  onToggle: (id: string, date: string) => void;
  onEdit: (habit: Habit) => void;
  onView: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

export default function HabitGroup({
  category,
  habits,
  logs,
  stats,
  moments,
  nowMinutes,
  defaultOpen = true,
  onToggle,
  onEdit,
  onView,
  onDelete,
}: HabitGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const t = today();

  const active = habits.filter((h) => isActive(h, t));
  const done = active.filter((h) => Boolean(logs[h.id]?.[t])).length;
  const pct = active.length ? Math.round((done / active.length) * 100) : 0;

  return (
    <section className="overflow-hidden rounded-xl border">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ChevronRightIcon
              aria-hidden
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            />
            <CategoryIcon
              name={category.icon}
              aria-hidden
              className="size-4 shrink-0"
              style={{ color: category.color }}
            />
            <span className="font-heading text-sm font-medium">
              {category.name}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {done}/{active.length}
            </span>
            <Progress
              value={pct}
              aria-label={`${category.name}: ${pct}% done today`}
              className="ms-auto hidden h-1.5 w-24 sm:flex [&>[data-slot=progress-indicator]]:bg-success"
            />
            <span className="w-9 text-end text-xs tabular-nums text-muted-foreground">
              {pct}%
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="divide-y border-t">
            {habits.map((habit) => (
              <HabitListItem
                key={habit.id}
                habit={habit}
                category={category}
                logs={logs}
                stats={stats[habit.id]}
                info={moments.get(habit.id)}
                nowMinutes={nowMinutes}
                onToggle={onToggle}
                onEdit={onEdit}
                onView={onView}
                onDelete={onDelete}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
