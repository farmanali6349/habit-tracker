"use client";

import { cn } from "@/lib/utils";
import type { CalendarDay, DayState } from "@/types";

const stateClasses: Record<DayState, string> = {
  complete: "border-success/30 bg-success/10 hover:bg-success/20",
  partial: "border-warning/30 bg-warning/10 hover:bg-warning/20",
  missed: "border-destructive/30 bg-destructive/10 hover:bg-destructive/20",
  empty: "border-transparent bg-muted/40 hover:bg-muted/70",
  future: "border-transparent hover:bg-muted/40",
};

const dotClasses: Record<DayState, string> = {
  complete: "bg-success",
  partial: "bg-warning",
  missed: "bg-destructive",
  empty: "bg-muted-foreground/30",
  future: "bg-muted-foreground/20",
};

interface CalendarDayCellProps {
  day: CalendarDay;
  selected: boolean;
  onSelect: (date: string) => void;
}

export default function CalendarDayCell({
  day,
  selected,
  onSelect,
}: CalendarDayCellProps) {
  const summary = day.activeCount
    ? `${day.done} of ${day.activeCount} habits done`
    : day.state === "future"
      ? "nothing marked yet"
      : "no habits scheduled";

  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      aria-pressed={selected}
      aria-label={`${new Date(`${day.date}T00:00:00`).toDateString()}, ${summary}`}
      className={cn(
        "relative flex h-16 flex-col justify-between rounded-lg border p-1.5 text-start transition-colors outline-none sm:h-20",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        stateClasses[day.state],
        !day.inMonth && "opacity-40",
        day.isToday && "ring-1 ring-foreground/40",
        selected && "ring-2 ring-foreground",
      )}
    >
      <span className="flex items-center justify-between gap-1">
        <span
          className={cn(
            "text-xs tabular-nums",
            day.isToday ? "font-semibold" : "font-medium",
          )}
        >
          {day.day}
        </span>
        <span
          className={cn("size-1.5 shrink-0 rounded-full", dotClasses[day.state])}
        />
      </span>

      <span className="text-[10px] tabular-nums text-muted-foreground">
        {day.activeCount
          ? `${day.done}/${day.activeCount}`
          : day.state === "future"
            ? ""
            : "—"}
      </span>
    </button>
  );
}
