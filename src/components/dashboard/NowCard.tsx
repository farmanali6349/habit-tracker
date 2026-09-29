"use client";

import { CheckIcon } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { today } from "@/lib/date";
import { formatTime, minutesToTime } from "@/lib/day";
import {
  compareByMoment,
  formatWindowEnd,
  minutesLeft,
  progressPct,
  resolveHabitMoments,
  windowLabel,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";
import type { NowMoment } from "@/hooks/useNow";
import type {
  Category,
  Habit,
  HabitLogs,
  HabitMomentInfo,
  TimeTable,
} from "@/types";

interface NowCardProps {
  now: NowMoment;
  habits: Habit[];
  categories: Category[];
  logs: HabitLogs;
  timetables: TimeTable[];
  onToggle: (id: string, date: string) => void;
}

const glow = (color: string) => ({
  borderColor: `color-mix(in oklch, ${color} 45%, transparent)`,
  boxShadow: `0 0 0 1px color-mix(in oklch, ${color} 30%, transparent), 0 0 28px color-mix(in oklch, ${color} 32%, transparent)`,
});

export default function NowCard({
  now,
  habits,
  categories,
  logs,
  timetables,
  onToggle,
}: NowCardProps) {
  const t = today();
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const infos = resolveHabitMoments(t, habits, logs, timetables, t, now.minutes);
  const ongoing = infos
    .filter((info) => info.moment === "ongoing")
    .sort(compareByMoment);
  const next = infos
    .filter((info) => info.moment === "upcoming")
    .sort(compareByMoment)[0];

  const color = (info: HabitMomentInfo) =>
    info.habit.categoryId
      ? categoryById.get(info.habit.categoryId)?.color
      : undefined;

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Now</span>
          <span className="tabular-nums text-xs text-muted-foreground">
            {formatTime(minutesToTime(now.minutes))}
          </span>
          <span className="h-px flex-1 bg-border" />
          {ongoing.length > 0 && (
            <Badge variant="outline" className="border-success/40 text-success">
              In progress
            </Badge>
          )}
        </div>

        {ongoing.length > 0 ? (
          ongoing.map((info) => {
            const window = info.window!;
            const accent = color(info) ?? "var(--success)";
            const category = categoryById.get(info.habit.categoryId);
            const pct = progressPct(now.minutes, window);
            const left = minutesLeft(now.minutes, window);

            return (
              <div
                key={info.habit.id}
                className="rounded-xl border p-4"
                style={glow(accent)}
              >
                <div className="flex items-center gap-2">
                  {category && (
                    <CategoryIcon
                      name={category.icon}
                      aria-hidden
                      className="size-4 shrink-0"
                      style={{ color: accent }}
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate font-heading text-base font-semibold">
                    {info.habit.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    until {formatWindowEnd(window)}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums">{windowLabel(window)}</span>
                    <span className="tabular-nums">
                      {left === 0 ? "ending" : `${left} min left`}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${info.habit.name} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pct}
                    className="h-2 overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                      style={{ width: `${pct}%`, backgroundColor: accent }}
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => onToggle(info.habit.id, t)}
                >
                  <CheckIcon data-icon="inline-start" />
                  Mark done
                </Button>
              </div>
            );
          })
        ) : next ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed p-3">
            {next.habit.categoryId &&
              categoryById.get(next.habit.categoryId) && (
                <CategoryIcon
                  name={categoryById.get(next.habit.categoryId)!.icon}
                  aria-hidden
                  className="size-4 shrink-0"
                  style={{ color: color(next) }}
                />
              )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {next.habit.name}
              </div>
              <div className="text-xs text-muted-foreground">
                Next up · {windowLabel(next.window!) ?? "any time"}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggle(next.habit.id, t)}
            >
              <CheckIcon data-icon="inline-start" />
              Done
            </Button>
          </div>
        ) : (
          <p className={cn("py-1 text-sm text-muted-foreground")}>
            Nothing scheduled right now — you&apos;re all caught up.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
