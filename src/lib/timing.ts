import type {
  Habit,
  HabitLogs,
  Insight,
  SleepGoal,
  SleepLog,
  StartLog,
  TimeTable,
} from "@/types";
import { addDays, today } from "./date";
import { formatDuration, logTimeForDate, timeToMinutes } from "./day";
import { habitWindowFor } from "./schedule";
import { dayShiftMinutes } from "./sleep";

/** A habit needs this many completed, same-day sessions before we summarise it. */
const MIN_TIMING_SESSIONS = 3;

/** Actual time above this share of the allocation counts as "runs long". */
const OVER_RUN_PCT = 125;
/** Actual time below this share of the allocation counts as "finishes early". */
const UNDER_RUN_PCT = 60;
/** Minimum average overrun (minutes) before suggesting a change either way. */
const MIN_DELTA_MINUTES = 15;

/** One start → completion pairing for a habit on a day. */
export interface SessionTiming {
  habitId: string;
  habitName: string;
  /** "YYYY-MM-DD" the session belongs to. */
  day: string;
  /** ISO timestamp the habit was started. */
  startISO: string;
  /** ISO completion timestamp, or null while still in progress. */
  endISO: string | null;
  /** Local "HH:MM" start, only when the session is same-day truthful. */
  startTime: string | null;
  endTime: string | null;
  /** Completion minus start, in minutes, when both are known. */
  actualMinutes: number | null;
  /** Allocated window length for the day, or null when the habit has no window. */
  allocatedMinutes: number | null;
  /** actualMinutes minus allocatedMinutes, when both are known. */
  overBy: number | null;
}

/** The allocated window length for a habit on a day, honouring the wake-time shift. */
export const allocatedMinutesFor = (
  day: string,
  habit: Habit,
  timetables: TimeTable[],
  sleep: SleepLog,
  sleepGoal: SleepGoal,
): number | null => {
  const shift = dayShiftMinutes(sleepGoal, sleep[day]);
  const window = habitWindowFor(day, habit, timetables, shift);
  return window ? window.end - window.start : null;
};

/**
 * Flattens every recorded start into a session. Only same-day starts and
 * completions yield a duration — a backfilled day stores "now", not the truth.
 */
export const sessionTimings = (
  habits: Habit[],
  logs: HabitLogs,
  starts: StartLog,
  timetables: TimeTable[],
  sleep: SleepLog,
  sleepGoal: SleepGoal,
): SessionTiming[] => {
  const habitById = new Map(habits.map((habit) => [habit.id, habit]));
  const out: SessionTiming[] = [];

  for (const [habitId, byDate] of Object.entries(starts)) {
    const habit = habitById.get(habitId);
    if (!habit) continue;

    for (const [day, startISO] of Object.entries(byDate)) {
      const endISO = logs[habitId]?.[day] ?? null;
      const startTime = logTimeForDate(day, startISO);
      const endTime = endISO ? logTimeForDate(day, endISO) : null;
      const actualMinutes =
        startTime && endTime
          ? Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime))
          : null;
      const allocatedMinutes = allocatedMinutesFor(
        day,
        habit,
        timetables,
        sleep,
        sleepGoal,
      );

      out.push({
        habitId,
        habitName: habit.name,
        day,
        startISO,
        endISO,
        startTime,
        endTime,
        actualMinutes,
        allocatedMinutes,
        overBy:
          actualMinutes !== null && allocatedMinutes !== null
            ? actualMinutes - allocatedMinutes
            : null,
      });
    }
  }

  return out;
};

/** Session timings keyed `${habitId}|${day}`, for matching against the feed. */
export const timingByKey = (
  timings: SessionTiming[],
): Map<string, SessionTiming> =>
  new Map(timings.map((timing) => [`${timing.habitId}|${timing.day}`, timing]));

/** A habit's timing rolled up over a recent window. */
export interface TimingSummary {
  habit: Habit;
  sessions: number;
  avgActual: number;
  avgAllocated: number;
  avgOverBy: number;
  /** Average actual as a percentage of average allocated. */
  overPct: number;
}

/** Per-habit averages of actual vs allocated time over completed sessions. */
export const timingSummaries = (
  habits: Habit[],
  logs: HabitLogs,
  starts: StartLog,
  timetables: TimeTable[],
  sleep: SleepLog,
  sleepGoal: SleepGoal,
  windowDays = 60,
): TimingSummary[] => {
  const from = addDays(today(), -(windowDays - 1));
  const habitById = new Map(habits.map((habit) => [habit.id, habit]));
  const groups = new Map<string, SessionTiming[]>();

  for (const timing of sessionTimings(
    habits,
    logs,
    starts,
    timetables,
    sleep,
    sleepGoal,
  )) {
    if (timing.day < from) continue;
    if (timing.actualMinutes === null || timing.allocatedMinutes === null) continue;
    const list = groups.get(timing.habitId);
    if (list) list.push(timing);
    else groups.set(timing.habitId, [timing]);
  }

  const out: TimingSummary[] = [];
  for (const [habitId, list] of groups) {
    const habit = habitById.get(habitId);
    if (!habit || list.length < MIN_TIMING_SESSIONS) continue;

    const sessions = list.length;
    const avgActual = Math.round(
      list.reduce((sum, timing) => sum + (timing.actualMinutes ?? 0), 0) / sessions,
    );
    const avgAllocated = Math.round(
      list.reduce((sum, timing) => sum + (timing.allocatedMinutes ?? 0), 0) /
        sessions,
    );
    out.push({
      habit,
      sessions,
      avgActual,
      avgAllocated,
      avgOverBy: avgActual - avgAllocated,
      overPct: avgAllocated ? Math.round((avgActual / avgAllocated) * 100) : 0,
    });
  }

  return out.sort((a, b) => Math.abs(b.avgOverBy) - Math.abs(a.avgOverBy));
};

/**
 * Advisory takeaways comparing how long habits actually take against the time
 * allocated to them — widen the window, or trim the goal, or tighten the slot.
 */
export const timingInsights = (summaries: TimingSummary[]): Insight[] => {
  const over = summaries
    .filter(
      (summary) =>
        summary.avgOverBy >= MIN_DELTA_MINUTES &&
        summary.overPct >= OVER_RUN_PCT,
    )
    .sort((a, b) => b.avgOverBy - a.avgOverBy)[0];

  const under = summaries
    .filter(
      (summary) =>
        summary.avgOverBy <= -MIN_DELTA_MINUTES &&
        summary.overPct <= UNDER_RUN_PCT,
    )
    .sort((a, b) => a.overPct - b.overPct)[0];

  const insights: Insight[] = [];

  if (over) {
    const goal = over.habit.metric
      ? ` — or lower the ${over.habit.metric.target}${over.habit.metric.unit ? ` ${over.habit.metric.unit}` : ""} goal`
      : "";
    insights.push({
      id: `timing-over-${over.habit.id}`,
      tone: "warning",
      icon: "⏳",
      title: `${over.habit.name} runs longer than planned`,
      detail: `Across ${over.sessions} sessions you average ${formatDuration(
        over.avgActual,
      )} against ${formatDuration(over.avgAllocated)} allocated. Widen the window to ~${formatDuration(
        over.avgActual,
      )}${goal}.`,
    });
  }

  if (under) {
    insights.push({
      id: `timing-under-${under.habit.id}`,
      tone: "neutral",
      icon: "⚡",
      title: `${under.habit.name} finishes early`,
      detail: `You average ${formatDuration(under.avgActual)} against ${formatDuration(
        under.avgAllocated,
      )} allocated — the window could be tightened.`,
    });
  }

  return insights;
};
