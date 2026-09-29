"use client";

import CategoryBadge from "../CategoryBadge";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/day";
import { formatSlotTime } from "@/lib/timetable";
import { cn } from "@/lib/utils";
import type { PlanComparison } from "@/types";

const deviationLabel = (minutes: number): string =>
  minutes === 0 ? "on time" : minutes > 0 ? `${minutes}m late` : `${-minutes}m early`;

export default function PlanVsActual({
  comparison,
}: {
  comparison: PlanComparison;
}) {
  const {
    timetable,
    entries,
    plannedCount,
    emptyCount,
    doneCount,
    coveragePct,
    unscheduled,
    isPast,
  } = comparison;

  if (!timetable) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        No timetable covers this day. Add one in the Schedule tab to plan it.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Planned vs actual
        </span>
        <Badge variant="outline" className="text-muted-foreground">
          {timetable.name}
        </Badge>
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs tabular-nums text-muted-foreground">
          {doneCount}/{plannedCount} followed · {coveragePct}% · {emptyCount} empty
        </span>
      </div>

      {entries.length ? (
        <ul className="divide-y">
          {entries.map((entry) => {
            const habit = entry.habit;
            const onTime =
              entry.deviationMinutes !== null &&
              Math.abs(entry.deviationMinutes) <= 30;

            return (
              <li
                key={entry.slot.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
              >
                <span className="w-28 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatSlotTime(entry.slot)}
                </span>

                {habit ? (
                  <>
                    <span
                      className="min-w-0 flex-1 truncate text-sm"
                      title={habit.name}
                    >
                      {habit.name}
                    </span>
                    {entry.category && (
                      <CategoryBadge
                        category={entry.category}
                        className="hidden sm:inline-flex"
                      />
                    )}
                    {entry.done ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "tabular-nums",
                          onTime
                            ? "border-success/40 text-success"
                            : "border-warning/40 text-warning",
                        )}
                      >
                        {entry.actualTime ? formatTime(entry.actualTime) : "Done"}
                        {entry.deviationMinutes !== null &&
                        entry.deviationMinutes !== 0
                          ? ` · ${deviationLabel(entry.deviationMinutes)}`
                          : ""}
                      </Badge>
                    ) : (
                      <Badge
                        variant={isPast ? "destructive" : "outline"}
                        className={isPast ? undefined : "text-muted-foreground"}
                      >
                        {isPast ? "Missed" : "Upcoming"}
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-muted-foreground">
                      Free
                    </span>
                    <Badge variant="outline" className="text-muted-foreground">
                      Empty slot
                    </Badge>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          This timetable has no slots yet.
        </p>
      )}

      {unscheduled.length > 0 && (
        <div className="space-y-1.5 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground">
            Not on the timetable ({unscheduled.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.map((habit) => (
              <Badge
                key={habit.id}
                variant="outline"
                className="text-muted-foreground"
              >
                {habit.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
