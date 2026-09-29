import type {
  Category,
  CategoryStat,
  DayStack,
  Habit,
  HabitLogs,
  HeatPoint,
  HourBucket,
  PlanAccuracy,
  PeriodDelta,
  RankRow,
  SkipLog,
  TimeTable,
  TrendPoint,
  WeekdayStat,
  YearSummary,
} from "@/types";
import { isScheduled, isSkipped } from "./cadence";
import { WEEKDAYS } from "./calendar";
import { groupHabitsByCategory } from "./categories";
import { addDays, diffDays, pad2, today } from "./date";
import { formatHour, logTimeForDate } from "./day";
import { buildPlanComparison } from "./timetable";

interface Counts {
  done: number;
  active: number;
}

const countsInRange = (
  habits: Habit[],
  logs: HabitLogs,
  from: string,
  to: string,
  skips?: SkipLog,
): Counts => {
  let done = 0;
  let active = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (const habit of habits) {
      if (!isScheduled(habit, d) || isSkipped(skips, habit.id, d)) continue;
      active += 1;
      if (logs[habit.id]?.[d]) done += 1;
    }
  }
  return { done, active };
};

export const pctOf = ({ done, active }: Counts): number =>
  active ? Math.round((done / active) * 100) : 0;

/** Rank habits by completion over an explicit date range. */
export const rankRange = (
  habits: Habit[],
  logs: HabitLogs,
  from: string,
  to: string,
  skips?: SkipLog,
): RankRow[] =>
  habits
    .map((habit) => {
      let active = 0;
      let done = 0;
      for (let d = from; d <= to; d = addDays(d, 1)) {
        if (!isScheduled(habit, d) || isSkipped(skips, habit.id, d)) continue;
        active += 1;
        if (logs[habit.id]?.[d]) done += 1;
      }
      return { h: habit, a: active, c: done, p: active ? Math.round((done / active) * 100) : 0 };
    })
    .filter((row) => row.a > 0);

/**
 * Buckets check-in times into hours of the day. Backfilled check-ins store
 * "now" as their timestamp, so only check-ins recorded on the same day they
 * happened (`logTimeForDate`) are counted here.
 */
export const hourBuckets = (
  habits: Habit[],
  logs: HabitLogs,
  from: string,
  to: string,
): HourBucket[] => {
  const counts = Array.from({ length: 24 }, () => 0);
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (const habit of habits) {
      const stamp = logs[habit.id]?.[d];
      if (!stamp) continue;
      const time = logTimeForDate(d, stamp);
      if (!time) continue;
      counts[Number(time.slice(0, 2))] += 1;
    }
  }
  return counts.map((count, hour) => ({
    hour,
    label: formatHour(hour),
    count,
  }));
};

export const weekdayStat = (
  habits: Habit[],
  logs: HabitLogs,
  from: string,
  to: string,
  skips?: SkipLog,
): WeekdayStat[] => {
  const done = Array.from({ length: 7 }, () => 0);
  const active = Array.from({ length: 7 }, () => 0);
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const weekday = new Date(`${d}T00:00:00`).getDay();
    for (const habit of habits) {
      if (!isScheduled(habit, d) || isSkipped(skips, habit.id, d)) continue;
      active[weekday] += 1;
      if (logs[habit.id]?.[d]) done[weekday] += 1;
    }
  }
  return active.map((count, day) => ({
    day,
    label: WEEKDAYS[day],
    done: done[day],
    active: count,
    pct: count ? Math.round((done[day] / count) * 100) : 0,
  }));
};

/** Per-day completed vs missed, for a stacked chart. Today is never "missed". */
export const missedVsCompleted = (
  habits: Habit[],
  logs: HabitLogs,
  from: string,
  to: string,
  skips?: SkipLog,
): DayStack[] => {
  const t = today();
  const out: DayStack[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const active = habits.filter(
      (habit) => isScheduled(habit, d) && !isSkipped(skips, habit.id, d),
    );
    const done = active.filter((habit) => Boolean(logs[habit.id]?.[d])).length;
    out.push({
      d,
      l: d.slice(5),
      done,
      missed: d < t ? active.length - done : 0,
    });
  }
  return out;
};

/** Completion for this window vs the immediately preceding equal window. */
export const periodDelta = (
  habits: Habit[],
  logs: HabitLogs,
  days: number,
  skips?: SkipLog,
): PeriodDelta => {
  const t = today();
  const current = pctOf(
    countsInRange(habits, logs, addDays(t, -(days - 1)), t, skips),
  );
  const previous = pctOf(
    countsInRange(habits, logs, addDays(t, -(days * 2 - 1)), addDays(t, -days), skips),
  );
  return { current, previous, delta: current - previous };
};

export const weeklySeries = (
  habits: Habit[],
  logs: HabitLogs,
  weeks: number,
  skips?: SkipLog,
): TrendPoint[] => {
  const t = today();
  return Array.from({ length: weeks }, (_, index) => {
    const from = addDays(t, -7 * (weeks - index) + 1);
    const to = addDays(from, 6);
    const end = to > t ? t : to;
    const counts = countsInRange(habits, logs, from, end, skips);
    return {
      key: from,
      label: from.slice(5),
      done: counts.done,
      active: counts.active,
      pct: pctOf(counts),
    };
  });
};

export const monthlySeries = (
  habits: Habit[],
  logs: HabitLogs,
  months: number,
  skips?: SkipLog,
): TrendPoint[] => {
  const t = today();
  const [year, month] = t.split("-").map(Number);
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(year, month - 1 - (months - index - 1), 1);
    const key = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
    const from = `${key}-01`;
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const rawTo = `${key}-${pad2(lastDay.getDate())}`;
    const to = rawTo > t ? t : rawTo;
    const counts = from > t ? { done: 0, active: 0 } : countsInRange(habits, logs, from, to, skips);
    return {
      key,
      label: date.toLocaleDateString(undefined, { month: "short" }),
      done: counts.done,
      active: counts.active,
      pct: pctOf(counts),
    };
  });
};

export const categoryStats = (
  habits: Habit[],
  categories: Category[],
  logs: HabitLogs,
  from: string,
  to: string,
  skips?: SkipLog,
): CategoryStat[] =>
  groupHabitsByCategory(habits, categories).map((group) => {
    let done = 0;
    let active = 0;
    let bestHabit: Habit | undefined;
    let bestPct = -1;

    for (const habit of group.habits) {
      const counts = countsInRange([habit], logs, from, to, skips);
      done += counts.done;
      active += counts.active;
      const pct = pctOf(counts);
      if (counts.active > 0 && pct > bestPct) {
        bestPct = pct;
        bestHabit = habit;
      }
    }

    return {
      category: group.category,
      habits: group.habits.length,
      done,
      active,
      pct: active ? Math.round((done / active) * 100) : 0,
      bestHabit,
    };
  });

export const planAccuracy = (
  timetables: TimeTable[],
  habits: Habit[],
  categories: Category[],
  logs: HabitLogs,
  from: string,
  to: string,
): PlanAccuracy => {
  let planned = 0;
  let done = 0;
  let onTime = 0;
  let late = 0;
  let early = 0;
  let missed = 0;
  let deviationSum = 0;
  let deviationCount = 0;
  const byDay: DayStack[] = [];

  for (let d = from; d <= to; d = addDays(d, 1)) {
    const comparison = buildPlanComparison(
      d,
      timetables,
      habits,
      categories,
      logs,
    );
    planned += comparison.plannedCount;
    done += comparison.doneCount;
    missed += comparison.missedCount;

    for (const entry of comparison.entries) {
      if (!entry.done) continue;
      const deviation = entry.deviationMinutes;
      if (deviation === null) continue;
      deviationSum += deviation;
      deviationCount += 1;
      if (Math.abs(deviation) <= 30) onTime += 1;
      else if (deviation > 0) late += 1;
      else early += 1;
    }

    byDay.push({
      d,
      l: d.slice(5),
      done: comparison.doneCount,
      missed: comparison.missedCount,
    });
  }

  return {
    planned,
    done,
    onTime,
    late,
    early,
    missed,
    onTimePct: planned ? Math.round((onTime / planned) * 100) : 0,
    avgDeviation: deviationCount ? Math.round(deviationSum / deviationCount) : null,
    byDay,
  };
};

const levelOf = (done: number, active: number): HeatPoint["level"] => {
  if (active === 0) return 0;
  const pct = (done / active) * 100;
  if (pct >= 100) return 4;
  if (pct >= 67) return 3;
  if (pct >= 34) return 2;
  if (pct > 0) return 1;
  return 0;
};

/** Daily completion levels for the last `days` days, ending today. */
export const heatmapData = (
  habits: Habit[],
  logs: HabitLogs,
  days: number,
  skips?: SkipLog,
): HeatPoint[] => {
  const t = today();
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(t, index - days + 1);
    const active = habits.filter(
      (habit) => isScheduled(habit, date) && !isSkipped(skips, habit.id, date),
    );
    const done = active.filter((habit) => Boolean(logs[habit.id]?.[date])).length;
    return {
      date,
      count: done,
      done,
      active: active.length,
      level: levelOf(done, active.length),
    };
  });
};

export const yearSummary = (
  habits: Habit[],
  categories: Category[],
  logs: HabitLogs,
  year: string,
  skips?: SkipLog,
): YearSummary => {
  const t = today();
  const from = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const to = yearEnd > t ? t : yearEnd;

  const ranked = rankRange(habits, logs, from, to, skips).sort((a, b) => b.p - a.p);
  const meaningful = ranked.filter((row) => row.a >= 3);
  const pool = meaningful.length ? meaningful : ranked;

  let bestStreak = 0;
  let run = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const activeHabits = habits.filter(
      (habit) => isScheduled(habit, d) && !isSkipped(skips, habit.id, d),
    );
    const done = activeHabits.filter((habit) => Boolean(logs[habit.id]?.[d])).length;
    if (activeHabits.length && done === activeHabits.length) {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  const monthCounts = new Map<string, Counts>();
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const key = d.slice(0, 7);
    const current = monthCounts.get(key) ?? { done: 0, active: 0 };
    for (const habit of habits) {
      if (!isScheduled(habit, d) || isSkipped(skips, habit.id, d)) continue;
      current.active += 1;
      if (logs[habit.id]?.[d]) current.done += 1;
    }
    monthCounts.set(key, current);
  }

  let mostConsistentMonth: string | null = null;
  let bestMonthPct = -1;
  for (const [key, counts] of monthCounts) {
    if (!counts.active) continue;
    const pct = Math.round((counts.done / counts.active) * 100);
    if (pct > bestMonthPct) {
      bestMonthPct = pct;
      mostConsistentMonth = key;
    }
  }

  const totalActiveDays = Array.from(
    { length: Math.max(0, diffDays(from, to) + 1) },
    (_, index) => addDays(from, index),
  ).filter((d) => habits.some((habit) => isScheduled(habit, d))).length;

  return {
    year,
    strongest: pool.slice(0, 3),
    weakest: [...pool].reverse().slice(0, 3),
    bestStreak,
    mostConsistentMonth,
    categories: categoryStats(habits, categories, logs, from, to, skips),
    totalDone: ranked.reduce((sum, row) => sum + row.c, 0),
    activeDays: totalActiveDays,
    consistencyPct: pctOf(countsInRange(habits, logs, from, to, skips)),
  };
};
