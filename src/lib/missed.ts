import type {
  Category,
  DayStack,
  Habit,
  HabitLogs,
  MissedEntry,
  MissedHabitStat,
  MissedLog,
  MissedReasonStat,
  MissedRollup,
  SkipLog,
} from "@/types";
import { isScheduled, isSkipped } from "./cadence";
import { addDays, today } from "./date";

/** One-tap reasons offered when flagging a habit missed. */
export const MISSED_REASON_PRESETS: string[] = [
  "Ran out of time",
  "Too tired",
  "Slept in / low energy",
  "Not feeling well",
  "Forgot",
  "Skipped by choice",
  "Busy with work",
  "Travelling",
];

/** One-tap plans offered for covering the habit the next day. */
export const MISSED_PLAN_PRESETS: string[] = [
  "Do it first thing tomorrow",
  "Double up tomorrow",
  "Move it to the evening",
  "Reschedule this week",
  "Lower the target",
  "Pair it with another habit",
];

export const missedEntryFor = (
  missed: MissedLog,
  habitId: string,
  date: string,
): MissedEntry | undefined => missed[habitId]?.[date];

export const hasMissed = (
  missed: MissedLog,
  habitId: string,
  date: string,
): boolean => Boolean(missed[habitId]?.[date]);

export const missedDatesFor = (missed: MissedLog, habitId: string): string[] =>
  Object.keys(missed[habitId] ?? {});

export const hasNote = (entry: MissedEntry): boolean =>
  Boolean(entry.reason.trim() || entry.plan.trim());

interface RollupOptions {
  windowDays?: number;
  /** Cap the number of reasons / habits returned. */
  limit?: number;
}

/**
 * Aggregates the explicitly flagged misses (with their reasons) over a recent
 * window so recurring patterns — the habits that keep slipping and the reasons
 * behind them — become visible.
 */
export const buildMissedRollup = (
  habits: Habit[],
  categories: Category[],
  logs: HabitLogs,
  missed: MissedLog,
  { windowDays = 90, limit = 6 }: RollupOptions = {},
  skips?: SkipLog,
): MissedRollup => {
  const t = today();
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const habitById = new Map(habits.map((h) => [h.id, h]));

  const reasonCounts = new Map<string, number>();
  const habitCounts = new Map<string, number>();
  const byDay: DayStack[] = [];
  let totalMissed = 0;
  let withNotes = 0;

  for (let i = windowDays - 1; i >= 0; i -= 1) {
    const date = addDays(t, -i);
    let done = 0;
    let dayMissed = 0;

    for (const habit of habits) {
      if (!isScheduled(habit, date) || isSkipped(skips, habit.id, date)) continue;
      if (logs[habit.id]?.[date]) done += 1;
    }

    for (const [habitId, dates] of Object.entries(missed)) {
      const entry = dates[date];
      if (!entry) continue;
      const habit = habitById.get(habitId);
      if (!habit || !isScheduled(habit, date)) continue;

      totalMissed += 1;
      dayMissed += 1;
      habitCounts.set(habitId, (habitCounts.get(habitId) ?? 0) + 1);
      if (hasNote(entry)) withNotes += 1;

      const reason = entry.reason.trim();
      if (reason) reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }

    byDay.push({
      d: date,
      l: date.slice(5),
      done,
      missed: dayMissed,
    });
  }

  const topReasons: MissedReasonStat[] = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
    .slice(0, limit);

  const worstHabits: MissedHabitStat[] = [...habitCounts.entries()]
    .map(([habitId, count]) => {
      const habit = habitById.get(habitId)!;
      let active = 0;
      for (let i = 0; i < windowDays; i += 1) {
        if (isScheduled(habit, addDays(t, -i))) active += 1;
      }
      return {
        habit,
        category: categoryById.get(habit.categoryId),
        missed: count,
        active,
        pct: active ? Math.round((count / active) * 100) : 0,
      };
    })
    .sort((a, b) => b.missed - a.missed || a.habit.name.localeCompare(b.habit.name))
    .slice(0, limit);

  return { windowDays, totalMissed, withNotes, topReasons, worstHabits, byDay };
};
