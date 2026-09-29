"use client";

import { useMemo } from "react";
import { isScheduled, isSkipped } from "@/lib/cadence";
import { today } from "@/lib/date";
import { buildFeed, computeBadges, habitStats, isActive } from "@/lib/stats";
import type {
  BadgeInfo,
  FeedItem,
  Habit,
  HabitLogs,
  HabitStats,
  Note,
  SkipLog,
} from "@/types";

export interface DerivedData {
  stats: Record<string, HabitStats>;
  badges: BadgeInfo[];
  feed: FeedItem[];
  /** Habits loggable today (date-range active), for the task lists. */
  active: Habit[];
  doneToday: number;
  todayPct: number;
  topStreak: number;
}

export function useDerivedData(
  habits: Habit[],
  logs: HabitLogs,
  notes: Note[],
  skips?: SkipLog,
): DerivedData {
  const { stats, badges, active, doneToday, todayPct, topStreak } =
    useMemo(() => {
      const map: Record<string, HabitStats> = Object.fromEntries(
        habits.map((habit) => [habit.id, habitStats(habit, logs, skips)]),
      );
      const t = today();
      const activeHabits = habits.filter((habit) => isActive(habit, t));
      const scheduled = habits.filter(
        (habit) => isScheduled(habit, t) && !isSkipped(skips, habit.id, t),
      );
      const done = scheduled.filter((habit) =>
        Boolean(logs[habit.id]?.[t]),
      ).length;
      return {
        stats: map,
        badges: computeBadges(habits, logs, map, skips),
        active: activeHabits,
        doneToday: done,
        todayPct: scheduled.length
          ? Math.round((done / scheduled.length) * 100)
          : 0,
        topStreak: Math.max(0, ...Object.values(map).map((s) => s.cur)),
      };
    }, [habits, logs, skips]);

  const feed = useMemo(
    () => buildFeed(habits, logs, notes),
    [habits, logs, notes],
  );

  return { stats, badges, feed, active, doneToday, todayPct, topStreak };
}
