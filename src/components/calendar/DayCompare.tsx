"use client";

import CategoryBadge from "../CategoryBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDuration } from "@/lib/day";
import { cn } from "@/lib/utils";
import type { CompareSide, DayComparison } from "@/types";

const shortDate = (date: string): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

function SideCard({ label, side }: { label: string; side: CompareSide }) {
  const metrics = [
    { label: "Completed", value: `${side.done}/${side.activeCount}` },
    { label: "Completion", value: `${side.pct}%` },
    { label: "Missed", value: String(side.missed) },
    {
      label: "Asleep",
      value:
        side.asleepMinutes === null ? "—" : formatDuration(side.asleepMinutes),
    },
  ];

  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{shortDate(side.date)}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-xs text-muted-foreground">{metric.label}</dt>
              <dd className="text-sm font-medium tabular-nums">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function StateChip({
  done,
  active,
  label,
}: {
  done: boolean;
  active: boolean;
  label: string;
}) {
  const description = done ? "done" : active ? "not done" : "not scheduled";

  return (
    <span
      role="img"
      aria-label={`${label}: ${description}`}
      className={cn(
        "mx-auto inline-flex size-6 items-center justify-center rounded-md border text-xs font-medium",
        done && "border-success/40 bg-success/10 text-success",
        !done && active && "border-destructive/40 bg-destructive/10 text-destructive",
        !active && "border-border text-muted-foreground",
      )}
    >
      {done ? "✓" : active ? "✕" : "–"}
    </span>
  );
}

export default function DayCompare({ comparison }: { comparison: DayComparison }) {
  const { a, b, rows, differing } = comparison;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <SideCard label="Day A" side={a} />
        <SideCard label="Day B" side={b} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Habit by habit</CardTitle>
          <CardDescription>
            {differing
              ? `${differing} habit${differing === 1 ? "" : "s"} differ between these days.`
              : "Both days match on every habit."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_1.75rem_1.75rem] items-center gap-2 border-b pb-1.5 text-[10px] font-medium text-muted-foreground">
            <span>Habit</span>
            <span className="text-center">A</span>
            <span className="text-center">B</span>
          </div>

          <ul className="divide-y">
            {rows.map((row) => {
              const differs = row.doneA !== row.doneB;
              return (
                <li
                  key={row.habit.id}
                  className={cn(
                    "grid grid-cols-[1fr_1.75rem_1.75rem] items-center gap-2 py-2",
                    differs && "bg-warning/5",
                  )}
                >
                  <span className="min-w-0">
                    <span
                      className="block truncate text-sm"
                      title={row.habit.name}
                    >
                      {row.habit.name}
                    </span>
                    {row.category && (
                      <CategoryBadge category={row.category} className="mt-1" />
                    )}
                  </span>
                  <StateChip
                    done={row.doneA}
                    active={row.activeA}
                    label={`Day A, ${row.habit.name}`}
                  />
                  <StateChip
                    done={row.doneB}
                    active={row.activeB}
                    label={`Day B, ${row.habit.name}`}
                  />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
