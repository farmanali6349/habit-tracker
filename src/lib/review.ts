import type { AppState, Habit } from "@/types";
import { rankRange } from "./analytics";
import { addDays, today } from "./date";
import { buildMissedRollup } from "./missed";

/** Monday of the week containing `date`. */
export const weekStart = (date: string): string => {
  const day = new Date(`${date}T00:00:00`).getDay();
  return addDays(date, day === 0 ? -6 : 1 - day);
};

export interface RankedHabit {
  habit: Habit;
  pct: number;
}

export interface WeekSummary {
  start: string;
  end: string;
  done: number;
  active: number;
  pct: number;
  bestHabit?: RankedHabit;
  worstHabit?: RankedHabit;
  topMissReason: string | null;
}

/** Aggregates a Monday–Sunday week's worth of activity for the review screen. */
export const buildWeekSummary = (
  state: AppState,
  start: string,
): WeekSummary => {
  const { habits, categories, logs, missed, skips } = state;
  const t = today();
  const rawEnd = addDays(start, 6);
  const end = rawEnd > t ? t : rawEnd;

  const ranked = rankRange(habits, logs, start, end, skips);
  const done = ranked.reduce((sum, row) => sum + row.c, 0);
  const active = ranked.reduce((sum, row) => sum + row.a, 0);

  const withData = ranked
    .filter((row) => row.a >= 2)
    .sort((a, b) => b.p - a.p);

  const rollup = buildMissedRollup(
    habits,
    categories,
    logs,
    missed,
    { windowDays: 7, limit: 1 },
    skips,
  );

  return {
    start,
    end,
    done,
    active,
    pct: active ? Math.round((done / active) * 100) : 0,
    bestHabit: withData[0]
      ? { habit: withData[0].h, pct: withData[0].p }
      : undefined,
    worstHabit:
      withData.length > 1
        ? {
            habit: withData[withData.length - 1].h,
            pct: withData[withData.length - 1].p,
          }
        : undefined,
    topMissReason: rollup.topReasons[0]?.reason ?? null,
  };
};
