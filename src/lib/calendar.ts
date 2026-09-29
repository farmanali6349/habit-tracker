import type {
  CalendarDay,
  CalendarSummary,
  Category,
  CompareRow,
  CompareSide,
  DayComparison,
  DayState,
  Habit,
  HabitLogs,
  SkipLog,
  SleepLog,
} from "@/types";
import { isScheduled, isSkipped } from "./cadence";
import { addDays, pad2, today } from "./date";
import { cycleStats } from "./day";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface DayFacts {
  activeCount: number;
  done: number;
  pct: number;
  state: DayState;
}

export const dayFacts = (
  date: string,
  habits: Habit[],
  logs: HabitLogs,
  skips?: SkipLog,
): DayFacts => {
  const active = habits.filter(
    (h) => isScheduled(h, date) && !isSkipped(skips, h.id, date),
  );
  const done = active.filter((h) => Boolean(logs[h.id]?.[date])).length;
  const activeCount = active.length;
  const pct = activeCount ? Math.round((done / activeCount) * 100) : 0;

  let state: DayState;
  if (date > today()) state = "future";
  else if (activeCount === 0) state = "empty";
  else if (done === activeCount) state = "complete";
  else if (done === 0) state = "missed";
  else state = "partial";

  return { activeCount, done, pct, state };
};

export const startOfMonth = (date: string): string => `${date.slice(0, 7)}-01`;

export const addMonths = (date: string, delta: number): string => {
  const [year, month] = date.split("-").map(Number);
  const shifted = new Date(year, month - 1 + delta, 1);
  return `${shifted.getFullYear()}-${pad2(shifted.getMonth() + 1)}-01`;
};

export const monthLabel = (monthStart: string): string =>
  new Date(`${monthStart}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

/** A fixed 6x7 grid so the calendar never changes height between months. */
export const buildMonthGrid = (
  monthStart: string,
  habits: Habit[],
  logs: HabitLogs,
  skips?: SkipLog,
): CalendarDay[] => {
  const firstWeekday = new Date(`${monthStart}T00:00:00`).getDay();
  const gridStart = addDays(monthStart, -firstWeekday);
  const monthKey = monthStart.slice(0, 7);
  const t = today();

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const facts = dayFacts(date, habits, logs, skips);
    return {
      date,
      day: Number(date.slice(8, 10)),
      inMonth: date.slice(0, 7) === monthKey,
      isToday: date === t,
      ...facts,
    };
  });
};

export const buildMonthSummary = (days: CalendarDay[]): CalendarSummary => {
  const tracked = days.filter(
    (day) =>
      day.inMonth &&
      (day.state === "complete" ||
        day.state === "partial" ||
        day.state === "missed"),
  );

  const activeTotal = tracked.reduce((sum, day) => sum + day.activeCount, 0);
  const doneTotal = tracked.reduce((sum, day) => sum + day.done, 0);

  let bestStreak = 0;
  let run = 0;
  for (const day of tracked) {
    if (day.state === "complete") {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  return {
    completedDays: tracked.filter((d) => d.state === "complete").length,
    partialDays: tracked.filter((d) => d.state === "partial").length,
    missedDays: tracked.filter((d) => d.state === "missed").length,
    trackedDays: tracked.length,
    consistencyPct: activeTotal
      ? Math.round((doneTotal / activeTotal) * 100)
      : 0,
    bestStreak,
  };
};

/** Consecutive fully-completed days, counting back from today. */
export const currentPerfectStreak = (
  habits: Habit[],
  logs: HabitLogs,
  skips?: SkipLog,
): number => {
  let cursor = today();
  if (dayFacts(cursor, habits, logs, skips).state !== "complete") {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  for (let guard = 0; guard < 3650; guard += 1) {
    if (dayFacts(cursor, habits, logs, skips).state !== "complete") break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

const sideOf = (
  date: string,
  habits: Habit[],
  logs: HabitLogs,
  sleep: SleepLog,
  skips?: SkipLog,
): CompareSide => {
  const facts = dayFacts(date, habits, logs, skips);
  const stats = cycleStats(sleep[date]);
  return {
    date,
    activeCount: facts.activeCount,
    done: facts.done,
    pct: facts.pct,
    missed: facts.activeCount - facts.done,
    asleepMinutes: stats?.asleepMinutes ?? null,
  };
};

export const compareDays = (
  dateA: string,
  dateB: string,
  habits: Habit[],
  categories: Category[],
  logs: HabitLogs,
  sleep: SleepLog,
  skips?: SkipLog,
): DayComparison => {
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const rows: CompareRow[] = habits
    .filter((habit) => isScheduled(habit, dateA) || isScheduled(habit, dateB))
    .map((habit) => {
      const activeA = isScheduled(habit, dateA);
      const activeB = isScheduled(habit, dateB);
      return {
        habit,
        category: categoryById.get(habit.categoryId),
        activeA,
        activeB,
        doneA: activeA && Boolean(logs[habit.id]?.[dateA]),
        doneB: activeB && Boolean(logs[habit.id]?.[dateB]),
      };
    })
    .sort((a, b) => {
      const differs = Number(b.doneA !== b.doneB) - Number(a.doneA !== a.doneB);
      return differs !== 0 ? differs : a.habit.name.localeCompare(b.habit.name);
    });

  return {
    a: sideOf(dateA, habits, logs, sleep, skips),
    b: sideOf(dateB, habits, logs, sleep, skips),
    rows,
    differing: rows.filter((row) => row.doneA !== row.doneB).length,
  };
};
