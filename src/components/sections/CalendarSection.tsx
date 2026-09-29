"use client";

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import DayCompare from "@/components/calendar/DayCompare";
import MonthGrid from "@/components/calendar/MonthGrid";
import DayAuditPanel from "@/components/day/DayAuditPanel";
import { useApp } from "@/components/shell/AppProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  addMonths,
  buildMonthGrid,
  buildMonthSummary,
  compareDays,
  currentPerfectStreak,
  monthLabel,
  startOfMonth,
} from "@/lib/calendar";
import { addDays, today } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { CalendarMode } from "@/types";

const LEGEND = [
  { label: "Complete", dot: "bg-success" },
  { label: "Partial", dot: "bg-warning" },
  { label: "Missed", dot: "bg-destructive" },
  { label: "No habits", dot: "bg-muted-foreground/30" },
];

export default function CalendarSection() {
  const {
    state,
    toggleLog,
    markMissed,
    unmarkMissed,
    skipHabit,
    saveMissedNote,
    setSleep,
  } = useApp();
  const { habits, categories, logs, sleep, timetables, missed, skips, sleepGoal } =
    state;
  const t = today();

  const [monthStart, setMonthStart] = useState(() => startOfMonth(t));
  const [mode, setMode] = useState<CalendarMode>("day");
  const [selection, setSelection] = useState<string[]>([t]);

  const days = useMemo(
    () => buildMonthGrid(monthStart, habits, logs, skips),
    [monthStart, habits, logs, skips],
  );
  const summary = useMemo(() => buildMonthSummary(days), [days]);
  const streak = useMemo(
    () => currentPerfectStreak(habits, logs, skips),
    [habits, logs, skips],
  );

  const comparison = useMemo(
    () =>
      mode === "compare" && selection.length === 2
        ? compareDays(
            selection[0],
            selection[1],
            habits,
            categories,
            logs,
            sleep,
            skips,
          )
        : null,
    [mode, selection, habits, categories, logs, sleep, skips],
  );

  const handleSelect = (date: string) => {
    setSelection((prev) => {
      if (mode === "day") return [date];
      if (prev.includes(date)) return prev.filter((item) => item !== date);
      if (prev.length < 2) return [...prev, date];
      return [prev[1], date];
    });

    if (date.slice(0, 7) !== monthStart.slice(0, 7)) {
      setMonthStart(startOfMonth(date));
    }
  };

  const handleModeChange = (value: string) => {
    if (!value) return;
    const next = value as CalendarMode;
    setMode(next);

    if (next === "compare") {
      setSelection((prev) =>
        prev.length >= 2
          ? prev.slice(0, 2)
          : [prev[0] ?? t, addDays(prev[0] ?? t, -1)],
      );
    } else {
      setSelection((prev) => (prev.length ? [prev[0]] : [t]));
    }
  };

  const stats = [
    { label: "Current streak", value: `${streak}d` },
    { label: "Best this month", value: `${summary.bestStreak}d` },
    { label: "Consistency", value: `${summary.consistencyPct}%` },
    {
      label: "Days complete",
      value: `${summary.completedDays}/${summary.trackedDays}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setMonthStart(addMonths(monthStart, -1))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setMonthStart(addMonths(monthStart, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>

        <div className="me-auto font-heading text-sm font-medium">
          {monthLabel(monthStart)}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setMonthStart(startOfMonth(t));
            setSelection([t]);
            setMode("day");
          }}
        >
          Jump to today
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div className="font-heading text-xl font-semibold tabular-nums">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3">
          <MonthGrid days={days} selection={selection} onSelect={handleSelect} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
            {LEGEND.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", item.dot)} />
                {item.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={mode}
          onValueChange={handleModeChange}
        >
          <ToggleGroupItem value="day">Day audit</ToggleGroupItem>
          <ToggleGroupItem value="compare">Compare</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          {mode === "day"
            ? "Select a day to see its full audit."
            : "Select two days to compare them side by side."}
        </p>
      </div>

      {mode === "day" ? (
        <DayAuditPanel
          date={selection[0] ?? t}
          habits={habits}
          categories={categories}
          logs={logs}
          missed={missed}
          skips={skips}
          sleep={sleep[selection[0] ?? t]}
          timetables={timetables}
          sleepGoal={sleepGoal}
          onToggle={toggleLog}
          onMarkMissed={markMissed}
          onUnmarkMissed={unmarkMissed}
          onSkip={skipHabit}
          onSaveMissedNote={saveMissedNote}
          onSetSleep={setSleep}
        />
      ) : comparison ? (
        <DayCompare comparison={comparison} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Pick two days above to compare them.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
