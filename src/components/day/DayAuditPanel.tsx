"use client";

import { useMemo, useState } from "react";
import { CalendarDaysIcon } from "lucide-react";
import FollowUpsCard from "./FollowUpsCard";
import DayHero from "./DayHero";
import MissedNoteDialog from "./MissedNoteDialog";
import NextDayPlan from "./NextDayPlan";
import ReviewList from "./ReviewList";
import SleepLogger from "./SleepLogger";
import PlanVsActual from "../schedule/PlanVsActual";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { addDays, today } from "@/lib/date";
import { buildDayAudit, buildDayStrip, cycleStats } from "@/lib/day";
import { buildPlanComparison } from "@/lib/timetable";
import type {
  Category,
  Habit,
  HabitLogs,
  MissedEntry,
  MissedLog,
  PlanEntry,
  SleepEntry,
  TimeTable,
} from "@/types";

interface DayAuditPanelProps {
  date: string;
  habits: Habit[];
  categories: Category[];
  logs: HabitLogs;
  missed: MissedLog;
  sleep: SleepEntry | undefined;
  timetables: TimeTable[];
  onToggle: (id: string, date: string) => void;
  onMarkMissed: (id: string, date: string) => void;
  onUnmarkMissed: (id: string, date: string) => void;
  onSaveMissedNote: (
    id: string,
    date: string,
    patch: Partial<Pick<MissedEntry, "reason" | "plan">>,
  ) => void;
  onSetSleep: (date: string, patch: Partial<SleepEntry>) => void;
}

export default function DayAuditPanel({
  date,
  habits,
  categories,
  logs,
  missed,
  sleep,
  timetables,
  onToggle,
  onMarkMissed,
  onUnmarkMissed,
  onSaveMissedNote,
  onSetSleep,
}: DayAuditPanelProps) {
  const [editing, setEditing] = useState<Habit | null>(null);

  const audit = useMemo(
    () => buildDayAudit(date, habits, categories, logs, sleep, missed),
    [date, habits, categories, logs, sleep, missed],
  );

  const plan = useMemo(
    () => buildPlanComparison(date, timetables, habits, categories, logs),
    [date, timetables, habits, categories, logs],
  );

  const strip = useMemo(() => buildDayStrip(audit, plan), [audit, plan]);

  const plannedByHabit = useMemo(() => {
    const map = new Map<string, PlanEntry>();
    for (const planned of plan.entries) {
      if (planned.habit) map.set(planned.habit.id, planned);
    }
    return map;
  }, [plan]);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const stats = cycleStats(sleep);
  const nextDate = addDays(date, 1);
  const canMiss = date <= today();

  const openNote = (habitId: string) => {
    const habit = habits.find((candidate) => candidate.id === habitId);
    if (!habit || !canMiss) return;
    if (!missed[habitId]?.[date]) onMarkMissed(habitId, date);
    setEditing(habit);
  };

  return (
    <div className="space-y-4">
      <DayHero audit={audit} asleepMinutes={stats?.asleepMinutes ?? null} />

      <SleepLogger
        sleep={sleep}
        markers={strip.markers}
        onSelect={openNote}
        onChange={(patch) => onSetSleep(date, patch)}
        onClear={() => onSetSleep(date, { wake: null, bed: null })}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {audit.activeCount ? (
            <ReviewList
              audit={audit}
              plannedByHabit={plannedByHabit}
              canMiss={canMiss}
              onToggle={(habitId) => onToggle(habitId, date)}
              onMiss={openNote}
              onUnmark={(habitId) => onUnmarkMissed(habitId, date)}
              onEditNote={openNote}
            />
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarDaysIcon />
                </EmptyMedia>
                <EmptyTitle>Nothing scheduled</EmptyTitle>
                <EmptyDescription>
                  No habits were active on this day.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          <PlanVsActual comparison={plan} />
          <NextDayPlan date={nextDate} habits={habits} categories={categories} />
        </div>

        <div className="space-y-4">
          <FollowUpsCard fromDate={addDays(date, -1)} />
        </div>
      </div>

      {editing && (
        <MissedNoteDialog
          habit={editing}
          category={categoryById.get(editing.categoryId)}
          date={date}
          entry={missed[editing.id]?.[date]}
          onSave={(patch) => onSaveMissedNote(editing.id, date, patch)}
          onClear={() => onUnmarkMissed(editing.id, date)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
