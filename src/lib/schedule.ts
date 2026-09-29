import type {
  Habit,
  HabitLogs,
  HabitMoment,
  HabitMomentInfo,
  HabitWindow,
  TimeTable,
} from "@/types";
import { formatTime, minutesToTime, timeToMinutes } from "./day";
import { isActive } from "./stats";
import {
  activeTimetableFor,
  slotEndMinutes,
  slotStartMinutes,
} from "./timetable";

const parseTime = (value: string | null | undefined): number | null => {
  if (typeof value !== "string" || !value) return null;
  const minutes = timeToMinutes(value);
  return Number.isFinite(minutes) ? minutes : null;
};

/**
 * The window a habit is scheduled for on a date: a timetable slot for that day
 * wins, otherwise the habit's own start/end time. Null means "any time".
 */
export const habitWindowFor = (
  date: string,
  habit: Habit,
  timetables: TimeTable[],
): HabitWindow | null => {
  const table = activeTimetableFor(date, timetables);
  const slot = table?.slots.find((candidate) => candidate.habitId === habit.id);
  if (slot) {
    const start = slotStartMinutes(slot);
    const end = slotEndMinutes(slot);
    if (end > start) return { start, end };
  }

  const start = parseTime(habit.startTime);
  const end = parseTime(habit.endTime);
  if (start !== null && end !== null && end > start) return { start, end };
  return null;
};

interface MomentInput {
  date: string;
  today: string;
  nowMinutes: number;
  window: HabitWindow | null;
  done: boolean;
}

export const momentFor = ({
  date,
  today,
  nowMinutes,
  window,
  done,
}: MomentInput): HabitMoment => {
  if (date > today) return "future";
  if (done) return "done";
  if (!window) return "unscheduled";
  if (date < today) return "overdue";
  if (nowMinutes < window.start) return "upcoming";
  if (nowMinutes <= window.end) return "ongoing";
  return "overdue";
};

export const progressPct = (nowMinutes: number, window: HabitWindow): number => {
  const span = window.end - window.start;
  if (span <= 0) return 100;
  return Math.max(
    0,
    Math.min(100, Math.round(((nowMinutes - window.start) / span) * 100)),
  );
};

export const minutesLeft = (nowMinutes: number, window: HabitWindow): number =>
  Math.max(0, window.end - nowMinutes);

export const formatWindowEnd = (window: HabitWindow): string =>
  formatTime(minutesToTime(window.end));

export const windowLabel = (window: HabitWindow | null): string | null =>
  window
    ? `${formatTime(minutesToTime(window.start))} – ${formatTime(
        minutesToTime(window.end),
      )}`
    : null;

/** Active habits for a date, each enriched with its window and live status. */
export const resolveHabitMoments = (
  date: string,
  habits: Habit[],
  logs: HabitLogs,
  timetables: TimeTable[],
  today: string,
  nowMinutes: number,
): HabitMomentInfo[] =>
  habits
    .filter((habit) => isActive(habit, date))
    .map((habit) => {
      const window = habitWindowFor(date, habit, timetables);
      const log = logs[habit.id]?.[date];
      return {
        habit,
        window,
        moment: momentFor({
          date,
          today,
          nowMinutes,
          window,
          done: Boolean(log),
        }),
        log,
      };
    });

const MOMENT_RANK: Record<HabitMoment, number> = {
  ongoing: 0,
  upcoming: 1,
  overdue: 2,
  unscheduled: 3,
  future: 4,
  done: 5,
};

/** Ongoing → upcoming → overdue → unscheduled, then completed in log order. */
export const compareByMoment = (
  a: HabitMomentInfo,
  b: HabitMomentInfo,
): number => {
  const rank = MOMENT_RANK[a.moment] - MOMENT_RANK[b.moment];
  if (rank !== 0) return rank;

  const aStart = a.window?.start ?? Number.MAX_SAFE_INTEGER;
  const bStart = b.window?.start ?? Number.MAX_SAFE_INTEGER;
  if (aStart !== bStart) return aStart - bStart;

  if (a.moment === "done" && b.moment === "done") {
    return (Date.parse(a.log ?? "") || 0) - (Date.parse(b.log ?? "") || 0);
  }
  return a.habit.name.localeCompare(b.habit.name);
};
