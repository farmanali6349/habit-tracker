"use client";

import { useMemo } from "react";
import { ChevronDownIcon, PartyPopperIcon } from "lucide-react";
import ReviewRow from "./ReviewRow";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { DayAudit } from "@/lib/day";
import { slotStartMinutes } from "@/lib/timetable";
import type { PlanEntry } from "@/types";

interface ReviewListProps {
  audit: DayAudit;
  plannedByHabit: Map<string, PlanEntry>;
  canMiss: boolean;
  onToggle: (habitId: string) => void;
  onMiss: (habitId: string) => void;
  onUnmark: (habitId: string) => void;
  onEditNote: (habitId: string) => void;
  onSkip: (habitId: string) => void;
}

export default function ReviewList({
  audit,
  plannedByHabit,
  canMiss,
  onToggle,
  onMiss,
  onUnmark,
  onEditNote,
  onSkip,
}: ReviewListProps) {
  const schedule = useMemo(() => {
    const map = new Map<string, number>();
    for (const [habitId, planned] of plannedByHabit) {
      map.set(habitId, slotStartMinutes(planned.slot));
    }
    return map;
  }, [plannedByHabit]);

  const review = useMemo(
    () =>
      audit.entries
        .filter(
          (entry) =>
            entry.habit && (entry.kind === "missed" || entry.kind === "pending"),
        )
        .sort((a, b) => {
          const aMin = schedule.get(a.habit!.id);
          const bMin = schedule.get(b.habit!.id);
          if (aMin !== undefined && bMin !== undefined && aMin !== bMin) {
            return aMin - bMin;
          }
          if (aMin !== undefined && bMin === undefined) return -1;
          if (aMin === undefined && bMin !== undefined) return 1;
          return (a.habit?.name ?? "").localeCompare(b.habit?.name ?? "");
        }),
    [audit.entries, schedule],
  );

  const done = useMemo(
    () =>
      audit.entries
        .filter((entry) => entry.kind === "checkin" && entry.habit)
        .sort((a, b) => (a.minutes ?? Infinity) - (b.minutes ?? Infinity)),
    [audit.entries],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border">
        <div className="flex items-center gap-3 p-3">
          <span className="text-xs font-medium text-muted-foreground">
            Needs review
          </span>
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs tabular-nums text-muted-foreground">
            {review.length}
          </span>
        </div>

        {review.length ? (
          <ul className="px-1 pb-1">
            {review.map((entry) => (
              <ReviewRow
                key={entry.id}
                entry={entry}
                planned={
                  entry.habit ? plannedByHabit.get(entry.habit.id) : undefined
                }
                canMiss={canMiss}
                onToggle={() => onToggle(entry.habit!.id)}
                onMiss={() => onMiss(entry.habit!.id)}
                onUnmark={() => onUnmark(entry.habit!.id)}
                onEditNote={() => onEditNote(entry.habit!.id)}
                onSkip={() => onSkip(entry.habit!.id)}
              />
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-2 px-3 pb-3 text-sm text-muted-foreground">
            <PartyPopperIcon className="size-4 text-success" />
            Every habit is accounted for. Enjoy the rest of your evening.
          </div>
        )}
      </div>

      {done.length > 0 && (
        <Collapsible defaultOpen className="rounded-xl border">
          <CollapsibleTrigger className="group flex w-full items-center gap-2 p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
            <span className="text-xs font-medium text-muted-foreground">
              Done
            </span>
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {done.length}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="px-1 pb-1">
              {done.map((entry) => (
                <ReviewRow
                  key={entry.id}
                  entry={entry}
                  planned={
                    entry.habit ? plannedByHabit.get(entry.habit.id) : undefined
                  }
                  canMiss={canMiss}
                  onToggle={() => onToggle(entry.habit!.id)}
                  onMiss={() => onMiss(entry.habit!.id)}
                  onUnmark={() => onUnmark(entry.habit!.id)}
                  onEditNote={() => onEditNote(entry.habit!.id)}
                  onSkip={() => onSkip(entry.habit!.id)}
                />
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
