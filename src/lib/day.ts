import type {
  Category,
  Habit,
  HabitLogs,
  MissedEntry,
  MissedLog,
  PlanComparison,
  SleepEntry,
  TimelineEntry,
} from "@/types";
import { dateStr, pad2, today } from "./date";
import { isActive } from "./stats";

export const MINUTES_PER_DAY = 1440;

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
};

export const minutesToTime = (minutes: number): string => {
  const wrapped =
    ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad2(Math.floor(wrapped / 60))}:${pad2(wrapped % 60)}`;
};

export const formatDuration = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
};

/** "HH:MM" (24-hour, where "24:00" means end of day) → "6:23 AM". */
export const formatTime = (time: string): string => {
  const [rawHours, rawMinutes] = time.split(":").map(Number);
  if (!Number.isFinite(rawHours)) return time;
  const wrapped = ((rawHours % 24) + 24) % 24;
  const period = wrapped < 12 ? "AM" : "PM";
  const hour12 = wrapped % 12 === 0 ? 12 : wrapped % 12;
  const minutes = Number.isNaN(rawMinutes) ? 0 : rawMinutes;
  return `${hour12}:${pad2(minutes)} ${period}`;
};

/** Compact 12-hour label for an axis tick, e.g. 6 → "6 AM", 12 → "12 PM". */
export const formatHour = (hour: number): string => {
  const wrapped = ((hour % 24) + 24) % 24;
  const period = wrapped < 12 ? "AM" : "PM";
  const hour12 = wrapped % 12 === 0 ? 12 : wrapped % 12;
  return `${hour12} ${period}`;
};

export interface CycleStats {
  awakeMinutes: number;
  asleepMinutes: number;
}

/** Splits the 24-hour cycle into the awake window and the sleep window. */
export const cycleStats = (sleep: SleepEntry | undefined): CycleStats | null => {
  if (!sleep?.wake || !sleep?.bed) return null;
  const wake = timeToMinutes(sleep.wake);
  const bed = timeToMinutes(sleep.bed);
  const awakeMinutes =
    (bed - wake + MINUTES_PER_DAY) % MINUTES_PER_DAY || MINUTES_PER_DAY;
  return { awakeMinutes, asleepMinutes: MINUTES_PER_DAY - awakeMinutes };
};

export const localTimeOf = (iso: string): string => {
  const date = new Date(iso);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

/**
 * A check-in timestamp only tells the truth about the day it was recorded on —
 * backfilling a past day stores "now", not the time it happened.
 */
export const logTimeForDate = (date: string, iso: string): string | null =>
  dateStr(new Date(iso)) === date ? localTimeOf(iso) : null;

export interface DayAudit {
  entries: TimelineEntry[];
  /** Index in `entries` where the missed/pending group starts. */
  unresolvedFrom: number;
  done: number;
  activeCount: number;
  /** Implicitly (past, unflagged) and explicitly flagged misses. */
  missed: number;
  /** Misses the user explicitly flagged. */
  flagged: number;
  /** Flagged misses that carry a written reason or plan. */
  missedWithNotes: number;
  pending: number;
  /** Done + explicitly flagged — how far through the day's review you are. */
  reviewed: number;
}

export type StripMarkerKind = "checkin" | "missed" | "pending";

/** A labelled position on the 24-hour strip. */
export interface StripMarker {
  id: string;
  kind: StripMarkerKind;
  minutes: number;
  label: string;
  habitId: string;
  habitName: string;
  category?: Category;
  missed?: MissedEntry;
}

export interface DayStripModel {
  wake: number | null;
  bed: number | null;
  markers: StripMarker[];
}

export const markerLabel = (
  kind: StripMarkerKind,
  name: string,
  time: string | null,
  missed?: MissedEntry,
): string => {
  const when = time ? ` at ${formatTime(time)}` : "";
  const verb =
    kind === "checkin"
      ? "checked in"
      : kind === "missed"
        ? "missed"
        : "upcoming";
  const reason = missed?.reason.trim() ? ` — ${missed.reason.trim()}` : "";
  return `${name} · ${verb}${when}${reason}`;
};

/**
 * Flattens a day into the markers shown on the 24-hour strip: real check-ins at
 * their logged time, plus planned-but-undone slots placed at their scheduled
 * start, so the shape of the planned day is visible against what actually happened.
 */
export const buildDayStrip = (
  audit: DayAudit,
  plan: PlanComparison | null,
): DayStripModel => {
  const wakeEntry = audit.entries.find((entry) => entry.kind === "wake");
  const bedEntry = audit.entries.find((entry) => entry.kind === "bed");

  const markers: StripMarker[] = [];
  const seen = new Set<string>();

  for (const entry of audit.entries) {
    if (entry.kind !== "checkin" || entry.minutes === null || !entry.habit) {
      continue;
    }
    seen.add(entry.habit.id);
    markers.push({
      id: entry.id,
      kind: "checkin",
      minutes: entry.minutes,
      label: markerLabel("checkin", entry.habit.name, entry.time),
      habitId: entry.habit.id,
      habitName: entry.habit.name,
      category: entry.category,
    });
  }

  const unresolvedByHabit = new Map(
    audit.entries
      .filter(
        (entry): entry is TimelineEntry & { habit: Habit } =>
          (entry.kind === "missed" || entry.kind === "pending") &&
          Boolean(entry.habit),
      )
      .map((entry) => [entry.habit.id, entry]),
  );

  if (plan) {
    for (const planned of plan.entries) {
      const habit = planned.habit;
      if (!habit || planned.done || seen.has(habit.id)) continue;
      const unresolved = unresolvedByHabit.get(habit.id);
      if (!unresolved) continue;

      const kind = unresolved.kind === "missed" ? "missed" : "pending";
      markers.push({
        id: `p-${habit.id}`,
        kind,
        minutes: timeToMinutes(planned.slot.start),
        label: markerLabel(kind, habit.name, planned.slot.start, unresolved.missed),
        habitId: habit.id,
        habitName: habit.name,
        category: planned.category,
        missed: unresolved.missed,
      });
      seen.add(habit.id);
    }
  }

  markers.sort((a, b) => a.minutes - b.minutes);

  return {
    wake: wakeEntry?.minutes ?? null,
    bed: bedEntry?.minutes ?? null,
    markers,
  };
};

export const buildDayAudit = (
  date: string,
  habits: Habit[],
  categories: Category[],
  logs: HabitLogs,
  sleep: SleepEntry | undefined,
  missed: MissedLog = {},
): DayAudit => {
  const t = today();
  const isPast = date < t;
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const activeHabits = habits.filter((h) => isActive(h, date));

  const checked: TimelineEntry[] = [];
  const unresolved: TimelineEntry[] = [];

  for (const habit of activeHabits) {
    const category = categoryById.get(habit.categoryId);
    const stamp = logs[habit.id]?.[date];

    if (stamp === undefined) {
      const flag = missed[habit.id]?.[date];
      unresolved.push({
        id: `u-${habit.id}`,
        kind: flag || isPast ? "missed" : "pending",
        time: null,
        minutes: null,
        habit,
        category,
        missed: flag,
      });
      continue;
    }

    const time = logTimeForDate(date, stamp);
    checked.push({
      id: `c-${habit.id}`,
      kind: "checkin",
      time,
      minutes: time ? timeToMinutes(time) : null,
      habit,
      category,
    });
  }

  const cycleStart = sleep?.wake ? timeToMinutes(sleep.wake) : 0;
  const cycleOrder = (minutes: number | null): number =>
    minutes === null
      ? Number.MAX_SAFE_INTEGER
      : (minutes - cycleStart + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  const timed = checked
    .filter((entry) => entry.minutes !== null)
    .sort((a, b) => cycleOrder(a.minutes) - cycleOrder(b.minutes));
  const untimed = checked.filter((entry) => entry.minutes === null);

  const entries: TimelineEntry[] = [];
  if (sleep?.wake) {
    entries.push({
      id: "wake",
      kind: "wake",
      time: sleep.wake,
      minutes: cycleStart,
    });
  }
  entries.push(...timed, ...untimed);
  if (sleep?.bed) {
    entries.push({
      id: "bed",
      kind: "bed",
      time: sleep.bed,
      minutes: timeToMinutes(sleep.bed),
    });
  }

  const unresolvedFrom = entries.length;
  entries.push(...unresolved);

  const flagged = unresolved.filter((entry) => Boolean(entry.missed)).length;
  const missedWithNotes = unresolved.filter(
    (entry) =>
      entry.missed &&
      Boolean(entry.missed.reason.trim() || entry.missed.plan.trim()),
  ).length;

  return {
    entries,
    unresolvedFrom,
    done: checked.length,
    activeCount: activeHabits.length,
    missed: unresolved.filter((entry) => entry.kind === "missed").length,
    flagged,
    missedWithNotes,
    pending: unresolved.filter((entry) => entry.kind === "pending").length,
    reviewed: checked.length + flagged,
  };
};
