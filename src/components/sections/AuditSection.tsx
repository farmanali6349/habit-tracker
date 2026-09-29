"use client";

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, MoonStarIcon } from "lucide-react";
import DayAuditPanel from "@/components/day/DayAuditPanel";
import { useApp } from "@/components/shell/AppProvider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { addDays, diffDays, today } from "@/lib/date";
import { buildDayAudit } from "@/lib/day";

export default function AuditSection() {
  const {
    state,
    toggleLog,
    markMissed,
    unmarkMissed,
    skipHabit,
    saveMissedNote,
    setSleep,
  } = useApp();
  const { habits, categories, logs, sleep, timetables, missed, skips } = state;
  const [date, setDate] = useState(today);
  const t = today();
  const entry = sleep[date];

  const audit = useMemo(
    () => buildDayAudit(date, habits, categories, logs, entry, missed, skips),
    [date, habits, categories, logs, entry, missed, skips],
  );

  const reviewedPct = audit.activeCount
    ? Math.round((audit.reviewed / audit.activeCount) * 100)
    : 0;

  const daysAgo = diffDays(date, t);
  const dayLabel =
    daysAgo === 0
      ? "Tonight's review"
      : daysAgo === 1
        ? "Yesterday"
        : daysAgo > 1
          ? `${daysAgo} days ago`
          : "Coming up";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous day"
            onClick={() => setDate(addDays(date, -1))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next day"
            disabled={date >= t}
            onClick={() => setDate(addDays(date, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>

        <div className="me-auto">
          <div className="flex items-center gap-2 font-heading text-lg font-semibold">
            <MoonStarIcon className="size-4 text-chart-1" />
            {new Date(`${date}T00:00:00`).toDateString()}
          </div>
          <div className="text-xs text-muted-foreground">{dayLabel}</div>
        </div>

        {date !== t && (
          <Button variant="ghost" size="sm" onClick={() => setDate(t)}>
            Jump to today
          </Button>
        )}

        {audit.activeCount > 0 && (
          <div className="w-full sm:w-56">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Reviewed</span>
              <span className="tabular-nums">
                {audit.reviewed}/{audit.activeCount}
              </span>
            </div>
            <Progress value={reviewedPct} aria-label="Day reviewed progress" />
          </div>
        )}
      </div>

      <DayAuditPanel
        date={date}
        habits={habits}
        categories={categories}
        logs={logs}
        missed={missed}
        skips={skips}
        sleep={entry}
        timetables={timetables}
        onToggle={toggleLog}
        onMarkMissed={markMissed}
        onUnmarkMissed={unmarkMissed}
        onSkip={skipHabit}
        onSaveMissedNote={saveMissedNote}
        onSetSleep={setSleep}
      />
    </div>
  );
}
