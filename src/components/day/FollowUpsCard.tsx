"use client";

import { useMemo, useState } from "react";
import { CheckIcon, PencilIcon, SunriseIcon } from "lucide-react";
import CategoryIcon from "../CategoryIcon";
import MissedNoteDialog from "./MissedNoteDialog";
import { useApp } from "@/components/shell/AppProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { today } from "@/lib/date";
import { hasNote } from "@/lib/missed";
import { isActive } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { Habit } from "@/types";

interface FollowUpsCardProps {
  /** The day the misses came from (usually the day before the day being viewed). */
  fromDate: string;
  className?: string;
}

/**
 * Surfaces the habits flagged missed on `fromDate` together with the reason and
 * the plan written the night before, so the habit gets reviewed — not just logged.
 */
export default function FollowUpsCard({
  fromDate,
  className,
}: FollowUpsCardProps) {
  const { state, toggleLog, saveMissedNote, unmarkMissed } = useApp();
  const { habits, categories, logs, missed } = state;
  const [editing, setEditing] = useState<Habit | null>(null);
  const t = today();

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const items = useMemo(
    () =>
      habits
        .filter((habit) => isActive(habit, fromDate) && missed[habit.id]?.[fromDate])
        .map((habit) => ({
          habit,
          category: categoryById.get(habit.categoryId),
          entry: missed[habit.id][fromDate],
          coveredToday: Boolean(logs[habit.id]?.[t]),
        }))
        .sort((a, b) => {
          const noted = Number(hasNote(b.entry)) - Number(hasNote(a.entry));
          return noted !== 0 ? noted : a.habit.name.localeCompare(b.habit.name);
        }),
    [habits, missed, logs, fromDate, categoryById, t],
  );

  const dayLabel = new Date(`${fromDate}T00:00:00`).toLocaleDateString(
    undefined,
    { weekday: "long", month: "short", day: "numeric" },
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SunriseIcon className="size-4 text-warning" />
          Follow-ups
        </CardTitle>
        <CardDescription>
          Flagged missed on {dayLabel} — the why and the plan for today.
        </CardDescription>
        {items.length > 0 && (
          <CardAction>
            <span className="text-xs tabular-nums text-muted-foreground">
              {items.length}
            </span>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        {items.length ? (
          <ul className="space-y-2">
            {items.map(({ habit, category, entry, coveredToday }) => (
              <li
                key={habit.id}
                className="space-y-1.5 rounded-lg border p-2.5"
              >
                <div className="flex items-center gap-2">
                  {category ? (
                    <CategoryIcon
                      name={category.icon}
                      aria-hidden
                      className="size-3.5 shrink-0"
                      style={{ color: category.color }}
                    />
                  ) : (
                    <span className="size-3 shrink-0 rounded-full bg-muted-foreground/40" />
                  )}
                  <span
                    className="min-w-0 flex-1 truncate text-sm font-medium"
                    title={habit.name}
                  >
                    {habit.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Edit note for ${habit.name}`}
                    onClick={() => setEditing(habit)}
                  >
                    <PencilIcon className="text-muted-foreground" />
                  </Button>
                  <Button
                    variant={coveredToday ? "secondary" : "outline"}
                    size="xs"
                    aria-pressed={coveredToday}
                    onClick={() => toggleLog(habit.id, t)}
                  >
                    <CheckIcon
                      data-icon="inline-start"
                      className={cn(coveredToday && "text-success")}
                    />
                    {coveredToday ? "Covered" : "Cover today"}
                  </Button>
                </div>

                {hasNote(entry) ? (
                  <div className="space-y-0.5 text-xs">
                    {entry.reason.trim() && (
                      <p className="text-foreground/80">
                        <span className="text-muted-foreground">Why: </span>
                        {entry.reason.trim()}
                      </p>
                    )}
                    {entry.plan.trim() && (
                      <p className="text-foreground/80">
                        <span className="text-muted-foreground">Plan: </span>
                        {entry.plan.trim()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No reason noted yet.
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing was flagged missed. Clean slate.
          </p>
        )}
      </CardContent>

      {editing && (
        <MissedNoteDialog
          habit={editing}
          category={categoryById.get(editing.categoryId)}
          date={fromDate}
          entry={missed[editing.id]?.[fromDate]}
          onSave={(patch) => saveMissedNote(editing.id, fromDate, patch)}
          onClear={() => unmarkMissed(editing.id, fromDate)}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}
