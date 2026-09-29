import type { FeedItem, Habit, HabitLogs, Note } from "@/types";
import { addDays, dateStr, today } from "./date";
import { localTimeOf, logTimeForDate } from "./day";
import type { SessionTiming } from "./timing";

export interface ActivityEntry {
  id: string;
  kind: "note" | "habit" | "start";
  /** Habit name (check-in/start) or note text. */
  text: string;
  /** The day the entry belongs to, "YYYY-MM-DD". */
  day: string;
  /** Local "HH:MM" when the time is meaningful, else null. */
  time: string | null;
  /** Sort key. */
  ts: string;
  /** For check-ins, the habit it belongs to. */
  habitId: string | null;
  /** For check-ins with a logged start: local "HH:MM". */
  startedAt: string | null;
  /** For check-ins: local "HH:MM" completion time. */
  endedAt: string | null;
  /** Actual minutes from start to completion, when both are known. */
  durationMinutes: number | null;
  /** Allocated window length (minutes) for the day, when the habit has one. */
  allocatedMinutes: number | null;
}

export interface ActivityDay {
  day: string;
  label: string;
  items: ActivityEntry[];
  done: number;
  notes: number;
}

export interface ActivityStats {
  checkinsToday: number;
  notesToday: number;
  checkinsWeek: number;
  totalCheckins: number;
  totalNotes: number;
  /** Tracked minutes on completed sessions started and finished today. */
  trackedToday: number;
  trackedWeek: number;
}

const dayLabel = (day: string): string => {
  const t = today();
  if (day === t) return "Today";
  if (day === addDays(t, -1)) return "Yesterday";
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

const timeRank = (entry: ActivityEntry): number =>
  entry.time ? Number(entry.time.replace(":", "")) : Number.MAX_SAFE_INTEGER;

/**
 * Groups the flat activity feed into days. Habit check-ins belong to the day
 * they were logged *for* (so a backfilled day lands on the right date), while
 * notes belong to the day they were written. Days are newest-first, and within
 * a day entries read chronologically like a diary.
 *
 * `timings` (keyed `${habitId}|${day}`) supplies the start/end/duration data for
 * check-ins, and any start without a matching completion becomes an in-progress
 * entry of its own.
 */
export const buildActivityDays = (
  feed: FeedItem[],
  timings: Map<string, SessionTiming>,
): ActivityDay[] => {
  const byDay = new Map<string, ActivityEntry[]>();
  const completed = new Set<string>();

  const push = (day: string, entry: ActivityEntry) => {
    const list = byDay.get(day);
    if (list) list.push(entry);
    else byDay.set(day, [entry]);
  };

  for (const item of feed) {
    const isHabit = item.t === "habit";
    const habitId = isHabit ? (item.habitId ?? null) : null;
    const day = isHabit
      ? (item.d ?? dateStr(new Date(item.ts)))
      : dateStr(new Date(item.ts));

    const timing = habitId ? timings.get(`${habitId}|${day}`) : undefined;
    if (habitId) completed.add(`${habitId}|${day}`);

    const endedAt = isHabit
      ? (timing?.endTime ?? (item.d ? logTimeForDate(item.d, item.ts) : null))
      : null;

    push(day, {
      id: item.id,
      kind: isHabit ? "habit" : "note",
      text: item.x,
      day,
      time: isHabit ? (timing?.startTime ?? endedAt) : localTimeOf(item.ts),
      ts: item.ts,
      habitId,
      startedAt: timing?.startTime ?? null,
      endedAt,
      durationMinutes: timing?.actualMinutes ?? null,
      allocatedMinutes: timing?.allocatedMinutes ?? null,
    });
  }

  // Sessions that were started but never completed still surface, as in-progress.
  for (const timing of timings.values()) {
    if (timing.endISO !== null) continue;
    if (completed.has(`${timing.habitId}|${timing.day}`)) continue;
    push(timing.day, {
      id: `s-${timing.habitId}-${timing.day}`,
      kind: "start",
      text: timing.habitName,
      day: timing.day,
      time: timing.startTime,
      ts: timing.startISO,
      habitId: timing.habitId,
      startedAt: timing.startTime,
      endedAt: null,
      durationMinutes: null,
      allocatedMinutes: timing.allocatedMinutes,
    });
  }

  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, items]) => {
      const sorted = [...items].sort((a, b) => {
        const rank = timeRank(a) - timeRank(b);
        if (rank !== 0) return rank;
        return a.ts < b.ts ? 1 : -1;
      });
      return {
        day,
        label: dayLabel(day),
        items: sorted,
        done: sorted.filter((entry) => entry.kind === "habit").length,
        notes: sorted.filter((entry) => entry.kind === "note").length,
      };
    });
};

export const activityStats = (
  habits: Habit[],
  logs: HabitLogs,
  notes: Note[],
  timings: SessionTiming[] = [],
  windowDays = 7,
): ActivityStats => {
  const t = today();
  const recent = new Set(
    Array.from({ length: windowDays }, (_, i) => addDays(t, -i)),
  );

  let checkinsToday = 0;
  let checkinsWeek = 0;
  let totalCheckins = 0;

  for (const habit of habits) {
    const habitLog = logs[habit.id] ?? {};
    for (const day of Object.keys(habitLog)) {
      totalCheckins += 1;
      if (recent.has(day)) checkinsWeek += 1;
      if (day === t) checkinsToday += 1;
    }
  }

  let trackedToday = 0;
  let trackedWeek = 0;
  for (const timing of timings) {
    if (timing.actualMinutes === null) continue;
    if (timing.day === t) trackedToday += timing.actualMinutes;
    if (recent.has(timing.day)) trackedWeek += timing.actualMinutes;
  }

  return {
    checkinsToday,
    notesToday: notes.filter((note) => dateStr(new Date(note.ts)) === t).length,
    checkinsWeek,
    totalCheckins,
    totalNotes: notes.length,
    trackedToday,
    trackedWeek,
  };
};
