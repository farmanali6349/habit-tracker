import type {
  Habit,
  HabitFrequency,
  HabitLogs,
  ProgressLog,
  SkipLog,
} from "@/types";
import { addDays, diffDays, today } from "./date";
import { isActive } from "./stats";

export const weekdayOf = (date: string): number =>
  new Date(`${date}T00:00:00`).getDay();

/** Monday of the week containing `date`. */
export const weekStartOf = (date: string): string => {
  const day = weekdayOf(date);
  return addDays(date, day === 0 ? -6 : 1 - day);
};

export const isSkipped = (
  skips: SkipLog | undefined,
  habitId: string,
  date: string,
): boolean => Boolean(skips?.[habitId]?.[date]);

export const isWeeklyQuota = (habit: Habit): boolean =>
  habit.frequency.kind === "weekly";

/**
 * True when the habit is *expected* on this specific day. Unlike `isActive`
 * (which only checks the habit's date range, and still gates whether it can be
 * logged), this respects the habit's cadence. Weekly-quota habits are never
 * "expected" on a particular day — they are measured per week instead.
 */
export const isScheduled = (habit: Habit, date: string): boolean => {
  if (!isActive(habit, date)) return false;
  const frequency = habit.frequency;
  if (frequency.kind === "daily") return true;
  if (frequency.kind === "weekdays") return frequency.days.includes(weekdayOf(date));
  return false;
};

export const amountFor = (
  progress: ProgressLog | undefined,
  habitId: string,
  date: string,
): number => progress?.[habitId]?.[date] ?? 0;

/** Whether the habit's target for the day is met (metric-aware). */
export const meetsTarget = (
  habit: Habit,
  logs: HabitLogs,
  progress: ProgressLog | undefined,
  date: string,
): boolean =>
  habit.metric
    ? amountFor(progress, habit.id, date) >= habit.metric.target
    : Boolean(logs[habit.id]?.[date]);

export interface QuotaProgress {
  done: number;
  target: number;
  met: boolean;
}

/** Completions vs target within the week containing `date` (weekly habits). */
export const weeklyQuotaProgress = (
  habit: Habit,
  logs: HabitLogs,
  date: string,
): QuotaProgress => {
  const target =
    habit.frequency.kind === "weekly" ? habit.frequency.times : 7;
  const start = weekStartOf(date);
  let done = 0;
  for (let i = 0; i < 7; i += 1) {
    if (logs[habit.id]?.[addDays(start, i)]) done += 1;
  }
  return { done, target, met: done >= target };
};

/** Weeks (Monday-based) between two dates, inclusive of partial weeks. */
export const weeksBetween = (from: string, to: string): number =>
  Math.floor(diffDays(weekStartOf(from), weekStartOf(to)) / 7) + 1;

/** Earlier of the two dates. */
export const earlier = (a: string, b: string): string => (a <= b ? a : b);

/** Human label for a habit's cadence, e.g. "Mon, Wed, Fri" or "3×/week". */
export const frequencyLabel = (frequency: HabitFrequency): string => {
  if (frequency.kind === "daily") return "Every day";
  if (frequency.kind === "weekly") return `${frequency.times}×/week`;
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (frequency.days.length === 7) return "Every day";
  if (!frequency.days.length) return "No days set";
  return frequency.days.map((day) => names[day]).join(", ");
};

/** The effective "last day" a habit should be measured up to. */
export const statsEndDate = (habit: Habit): string => {
  const t = today();
  return habit.end && habit.end < t ? habit.end : t;
};
