"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { today } from "@/lib/date";
import { formatTime, minutesToTime } from "@/lib/day";
import {
  compareByMoment,
  formatWindowEnd,
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
  HabitMoment,
  HabitMomentInfo,
  TimeTable,
} from "@/types";

interface TodayTasksCardProps {
  habits: Habit[];
  categories: Category[];
  logs: HabitLogs;
  timetables: TimeTable[];
  now: NowMoment;
  onToggle: (id: string, date: string) => void;
}

const timeText = (info: HabitMomentInfo): string | null => {
  if (!info.window) return null;
  if (info.moment === "ongoing") return `until ${formatWindowEnd(info.window)}`;
  if (info.moment === "upcoming")
    return `at ${formatTime(minutesToTime(info.window.start))}`;
  return windowLabel(info.window);
};

const SECTIONS: { moment: HabitMoment; label: string }[] = [
  { moment: "ongoing", label: "Ongoing now" },
  { moment: "upcoming", label: "Upcoming" },
  { moment: "unscheduled", label: "Any time" },
  { moment: "overdue", label: "Overdue" },
  { moment: "done", label: "Completed" },
];

export default function TodayTasksCard({
  habits,
  categories,
  logs,
  timetables,
  now,
  onToggle,
}: TodayTasksCardProps) {
  const t = today();
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const infos = resolveHabitMoments(
    t,
    habits,
    logs,
    timetables,
    t,
    now.minutes,
  ).sort(compareByMoment);
  const done = infos.filter((info) => info.moment === "done").length;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Today&apos;s tasks</CardTitle>
        <CardDescription>
          {done} of {infos.length} done
        </CardDescription>
        <CardAction>
          <Link
            href="/habits"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            All habits
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {infos.length ? (
          <div className="space-y-3">
            {SECTIONS.map((section) => {
              const items = infos.filter(
                (info) => info.moment === section.moment,
              );
              if (!items.length) return null;
              return (
                <div key={section.moment} className="space-y-0.5">
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {section.label}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {items.length}
                    </span>
                  </div>

                  {items.map((info) => {
                    const { habit, window, moment } = info;
                    const isDone = moment === "done";
                    const isOngoing = moment === "ongoing";
                    const category = categoryById.get(habit.categoryId);
                    const accent = category?.color ?? "var(--success)";
                    const time = timeText(info);

                    return (
                      <div key={habit.id}>
                        <button
                          type="button"
                          aria-pressed={isDone}
                          aria-label={`${isDone ? "Undo" : "Mark"} ${habit.name}`}
                          onClick={() => onToggle(habit.id, t)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            isOngoing && "bg-muted/40",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full border",
                              isDone
                                ? "border-success bg-success text-success-foreground"
                                : "border-border",
                              isOngoing && !isDone && "border-success",
                            )}
                          >
                            {isDone && <CheckIcon className="size-3" />}
                          </span>
                          {category && (
                            <CategoryIcon
                              name={category.icon}
                              aria-hidden
                              className="size-3.5 shrink-0"
                              style={{ color: accent }}
                            />
                          )}
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-sm",
                              isDone && "text-muted-foreground line-through",
                            )}
                          >
                            {habit.name}
                          </span>
                          {time && (
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {time}
                            </span>
                          )}
                        </button>

                        {isOngoing && window && (
                          <div className="mx-2 mb-1.5 h-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                              style={{
                                width: `${progressPct(now.minutes, window)}%`,
                                backgroundColor: accent,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            No habits are active today.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
