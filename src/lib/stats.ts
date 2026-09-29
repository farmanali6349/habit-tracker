import type {
  BadgeInfo,
  FeedItem,
  Habit,
  HabitLogs,
  HabitStats,
  Note,
  RankRow,
  SeriesPoint,
  SkipLog,
} from "@/types";
import {
  isWeeklyQuota,
  isScheduled,
  isSkipped,
  statsEndDate,
  weekStartOf,
} from "./cadence";
import { addDays, today } from "./date";

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export const isActive = (h: Habit, d: string): boolean =>
  d >= h.start && (!h.end || d <= h.end);

/** Weekly-quota habits count met *weeks*, not days. */
const weeklyStats = (h: Habit, L: HabitLogs): HabitStats => {
  const target = h.frequency.kind === "weekly" ? h.frequency.times : 1;
  const l = L[h.id] || {};
  const last = statsEndDate(h);
  const startWeek = weekStartOf(h.start);
  const lastWeek = weekStartOf(last);

  const weekMet = (weekStart: string): boolean => {
    let count = 0;
    for (let i = 0; i < 7; i += 1) {
      const d = addDays(weekStart, i);
      if (d < h.start || d > last) continue;
      if (l[d]) count += 1;
    }
    return count >= target;
  };

  let done = 0;
  let n = 0;
  let best = 0;
  let run = 0;
  for (let ws = startWeek; ws <= lastWeek; ws = addDays(ws, 7)) {
    n += 1;
    if (weekMet(ws)) {
      done += 1;
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  let cur = 0;
  for (let ws = lastWeek; ws >= startWeek; ws = addDays(ws, -7)) {
    if (weekMet(ws)) cur += 1;
    else break;
  }

  return {
    done,
    n,
    pct: n ? Math.round((done / n) * 100) : 0,
    cur,
    best,
  };
};

export const habitStats = (
  h: Habit,
  L: HabitLogs,
  skips?: SkipLog,
): HabitStats => {
  if (isWeeklyQuota(h)) return weeklyStats(h, L);

  const l = L[h.id] || {};
  const t = today();
  const last = statsEndDate(h);

  let done = 0;
  let n = 0;
  let best = 0;
  let run = 0;
  for (let d = h.start; d <= last; d = addDays(d, 1)) {
    if (!isScheduled(h, d)) continue;
    if (isSkipped(skips, h.id, d)) continue;
    n += 1;
    if (l[d]) {
      done += 1;
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  // Walk back over scheduled days for the current run; an unfinished today (and
  // any rest day) is neutral rather than breaking the streak.
  let cursor = last;
  if (
    cursor === t &&
    isScheduled(h, cursor) &&
    !l[cursor] &&
    !isSkipped(skips, h.id, cursor)
  ) {
    cursor = addDays(cursor, -1);
  }
  let cur = 0;
  for (; cursor >= h.start; cursor = addDays(cursor, -1)) {
    if (!isScheduled(h, cursor)) continue;
    if (isSkipped(skips, h.id, cursor)) continue;
    if (l[cursor]) cur += 1;
    else break;
  }

  return { done, n, pct: n ? Math.round((done / n) * 100) : 0, cur, best };
};

export const series = (
  habits: Habit[],
  L: HabitLogs,
  N: number,
  skips?: SkipLog,
): SeriesPoint[] => {
  const t = today();
  return Array.from({ length: N }, (_, i) => {
    const d = addDays(t, i - N + 1);
    const a = habits.filter(
      (h) => isScheduled(h, d) && !isSkipped(skips, h.id, d),
    );
    const c = a.filter((h) => L[h.id] && L[h.id][d]).length;
    return {
      d,
      l: d.slice(5),
      c,
      a: a.length,
      p: a.length ? Math.round((c / a.length) * 100) : 0,
    };
  });
};

export const rank = (
  habits: Habit[],
  L: HabitLogs,
  N: number,
  skips?: SkipLog,
): RankRow[] => {
  const t = today();
  return habits
    .map((h) => {
      let a = 0;
      let c = 0;
      for (let i = 0; i < N; i++) {
        const d = addDays(t, -i);
        if (!isScheduled(h, d) || isSkipped(skips, h.id, d)) continue;
        a++;
        if (L[h.id] && L[h.id][d]) c++;
      }
      return { h, a, c, p: a ? Math.round((c / a) * 100) : 0 };
    })
    .filter((r) => r.a > 0);
};

export const overallCompletion = (
  habits: Habit[],
  L: HabitLogs,
  n: number,
  skips?: SkipLog,
): number => {
  const r = rank(habits, L, n, skips);
  const a = r.reduce((x, y) => x + y.a, 0);
  return a ? Math.round((r.reduce((x, y) => x + y.c, 0) / a) * 100) : 0;
};

export const computeBadges = (
  habits: Habit[],
  L: HabitLogs,
  stats: Record<string, HabitStats>,
  skips?: SkipLog,
): BadgeInfo[] => {
  const s30 = series(habits, L, 30, skips);
  const tracked = s30.filter((d) => d.a);
  const topBest = Math.max(0, ...habits.map((h) => stats[h.id]?.best ?? 0));
  const identityCheckIns = habits
    .filter((h) => h.identityId)
    .reduce((sum, h) => sum + Object.keys(L[h.id] || {}).length, 0);
  return [
    {
      icon: "🌱",
      label: "First Step",
      earned: Object.values(L).some((l) => Object.keys(l).length > 0),
    },
    { icon: "🔥", label: "7-Day Streak", earned: topBest >= 7 },
    { icon: "⚡", label: "30-Day Streak", earned: topBest >= 30 },
    { icon: "🏆", label: "100-Day Streak", earned: topBest >= 100 },
    {
      icon: "🌟",
      label: "Perfect Day",
      earned: s30.some((d) => d.a > 0 && d.c === d.a),
    },
    {
      icon: "👑",
      label: "Consistency Master",
      earned: tracked.length >= 14 && overallCompletion(habits, L, 30, skips) >= 80,
    },
    {
      icon: "🗳️",
      label: "Identity Voter",
      earned: identityCheckIns >= 10,
    },
  ];
};

export const buildFeed = (
  habits: Habit[],
  L: HabitLogs,
  notes: Note[],
  limit = 80,
): FeedItem[] =>
  [
    ...notes.map((n) => ({ id: n.id, ts: n.ts, t: "note" as const, x: n.text })),
    ...habits.flatMap((h) =>
      Object.entries(L[h.id] || {}).map(([d, ts]) => ({
        id: `${h.id}-${d}`,
        ts,
        t: "habit" as const,
        x: h.name,
        habitId: h.id,
        d,
      })),
    ),
  ]
    .sort((a, b) => (b.ts < a.ts ? -1 : 1))
    .slice(0, limit);
