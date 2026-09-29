"use client";

import { useMemo } from "react";
import { today } from "@/lib/date";
import { buildFeed, computeBadges, habitStats, isActive } from "@/lib/stats";
import type {
  BadgeInfo,
  FeedItem,
  Habit,
  HabitLogs,
  HabitStats,
  Note,
} from "@/types";

export interface DerivedData {
  stats: Record<string, HabitStats>;
  badges: BadgeInfo[];
  feed: FeedItem[];
  active: Habit[];
  doneToday: number;
  todayPct: number;
  topStreak: number;
}

export function useDerivedData(
  habits: Habit[],
  logs: HabitLogs,
  notes: Note[],
): DerivedData {
  const { stats, badges, active, doneToday, todayPct, topStreak } =
    useMemo(() => {
      const map: Record<string, HabitStats> = Object.fromEntries(
        habits.map((habit) => [habit.id, habitStats(habit, logs)]),
      );
      const t = today();
      const activeHabits = habits.filter((habit) => isActive(habit, t));
      const done = activeHabits.filter((habit) =>
        Boolean(logs[habit.id]?.[t]),
      ).length;
      return {
        stats: map,
        badges: computeBadges(habits, logs, map),
        active: activeHabits,
        doneToday: done,
        todayPct: activeHabits.length
          ? Math.round((done / activeHabits.length) * 100)
          : 0,
        topStreak: Math.max(0, ...Object.values(map).map((s) => s.cur)),
      };
    }, [habits, logs]);

  const feed = useMemo(
    () => buildFeed(habits, logs, notes),
    [habits, logs, notes],
  );

  return { stats, badges, feed, active, doneToday, todayPct, topStreak };
}
