import type {
  BadgeInfo,
  FeedItem,
  Habit,
  HabitLogs,
  HabitStats,
  Note,
  RankRow,
  SeriesPoint,
} from "@/types";
import { addDays, diffDays, today } from "./date";

export const uid = (): string => Math.random().toString(36).slice(2, 9);

export const isActive = (h: Habit, d: string): boolean =>
  d >= h.start && (!h.end || d <= h.end);

export const habitStats = (h: Habit, L: HabitLogs): HabitStats => {
  const l = L[h.id] || {};
  const t = today();
  const last = h.end && h.end < t ? h.end : t;
  const n = Math.max(diffDays(h.start, last) + 1, 0);
  let done = 0;
  let cur = 0;
  let best = 0;
  let run = 0;

  for (let i = 0; i < n; i++) {
    if (l[addDays(h.start, i)]) {
      done++;
      run++;
      best = Math.max(best, run);
    } else run = 0;
  }

  let d = last;
  if (!l[d] && d === t) d = addDays(d, -1);
  while (d >= h.start && l[d]) {
    cur++;
    d = addDays(d, -1);
  }

  return { done, n, pct: n ? Math.round((done / n) * 100) : 0, cur, best };
};

export const series = (habits: Habit[], L: HabitLogs, N: number): SeriesPoint[] => {
  const t = today();
  return Array.from({ length: N }, (_, i) => {
    const d = addDays(t, i - N + 1);
    const a = habits.filter((h) => isActive(h, d));
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

export const rank = (habits: Habit[], L: HabitLogs, N: number): RankRow[] => {
  const t = today();
  return habits
    .map((h) => {
      let a = 0;
      let c = 0;
      for (let i = 0; i < N; i++) {
        const d = addDays(t, -i);
        if (isActive(h, d)) {
          a++;
          if (L[h.id] && L[h.id][d]) c++;
        }
      }
      return { h, a, c, p: a ? Math.round((c / a) * 100) : 0 };
    })
    .filter((r) => r.a > 0);
};

export const overallCompletion = (habits: Habit[], L: HabitLogs, n: number): number => {
  const r = rank(habits, L, n);
  const a = r.reduce((x, y) => x + y.a, 0);
  return a ? Math.round((r.reduce((x, y) => x + y.c, 0) / a) * 100) : 0;
};

export const computeBadges = (
  habits: Habit[],
  L: HabitLogs,
  stats: Record<string, HabitStats>,
): BadgeInfo[] => {
  const s30 = series(habits, L, 30);
  const tracked = s30.filter((d) => d.a);
  const topBest = Math.max(0, ...habits.map((h) => stats[h.id]?.best ?? 0));
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
      earned: tracked.length >= 14 && overallCompletion(habits, L, 30) >= 80,
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
