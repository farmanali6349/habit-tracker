import type {
  Category,
  Habit,
  HabitLogs,
  PlanComparison,
  PlanEntry,
  TimeSlot,
  TimeSlotDraft,
  TimeTable,
} from "@/types";
import {
  MINUTES_PER_DAY,
  formatTime,
  logTimeForDate,
  minutesToTime,
  timeToMinutes,
} from "./day";
import { today } from "./date";
import { isActive } from "./stats";
import { shiftSlot } from "./sleep";

/** "00:00" as an end time means midnight at the close of the day. */
export const DAY_END = "00:00";

export const slotStartMinutes = (slot: TimeSlot): number =>
  timeToMinutes(slot.start);

export const slotEndMinutes = (slot: TimeSlot): number =>
  slot.end === DAY_END ? MINUTES_PER_DAY : timeToMinutes(slot.end);

export const slotDuration = (slot: TimeSlot): number =>
  Math.max(0, slotEndMinutes(slot) - slotStartMinutes(slot));

export const formatSlotTime = (slot: TimeSlot): string =>
  `${formatTime(slot.start)} – ${formatTime(slot.end)}`;

export const sortSlots = (slots: TimeSlot[]): TimeSlot[] =>
  [...slots].sort((a, b) => slotStartMinutes(a) - slotStartMinutes(b));

export const isValidSlot = (start: string, end: string): boolean =>
  timeToMinutes(start) < (end === DAY_END ? MINUTES_PER_DAY : timeToMinutes(end));

/** Ids of slots that overlap another slot. */
export const overlappingSlotIds = (slots: TimeSlot[]): Set<string> => {
  const ordered = sortSlots(slots);
  const ids = new Set<string>();
  for (let i = 1; i < ordered.length; i += 1) {
    if (slotStartMinutes(ordered[i]) < slotEndMinutes(ordered[i - 1])) {
      ids.add(ordered[i].id);
      ids.add(ordered[i - 1].id);
    }
  }
  return ids;
};

/** The timetable in force for a date: the latest-starting range that covers it. */
export const activeTimetableFor = (
  date: string,
  timetables: TimeTable[],
): TimeTable | null => {
  const covering = timetables.filter(
    (table) => date >= table.from && (table.to === null || date <= table.to),
  );
  if (!covering.length) return null;
  return covering.reduce((best, table) => (table.from > best.from ? table : best));
};

/** habitId → earliest scheduled start (minutes) on a date, from the active timetable. */
export const scheduledMinutesByHabit = (
  date: string,
  timetables: TimeTable[],
): Map<string, number> => {
  const table = activeTimetableFor(date, timetables);
  const map = new Map<string, number>();
  if (!table) return map;
  for (const slot of table.slots) {
    if (!slot.habitId) continue;
    const start = slotStartMinutes(slot);
    const current = map.get(slot.habitId);
    if (current === undefined || start < current) map.set(slot.habitId, start);
  }
  return map;
};

/**
 * Orders habits for a day: unfinished first (by scheduled time, with untimed
 * habits last alphabetically), then finished ones in the order they were logged.
 */
export const compareHabitsByDay = (
  a: Habit,
  b: Habit,
  date: string,
  schedule: Map<string, number>,
  logs: HabitLogs,
): number => {
  const aStamp = logs[a.id]?.[date];
  const bStamp = logs[b.id]?.[date];
  if (Boolean(aStamp) !== Boolean(bStamp)) return aStamp ? 1 : -1;

  if (aStamp && bStamp) {
    return (Date.parse(aStamp) || 0) - (Date.parse(bStamp) || 0);
  }

  const aMin = schedule.get(a.id);
  const bMin = schedule.get(b.id);
  if (aMin !== undefined && bMin !== undefined && aMin !== bMin) {
    return aMin - bMin;
  }
  if (aMin !== undefined && bMin === undefined) return -1;
  if (aMin === undefined && bMin !== undefined) return 1;
  return a.name.localeCompare(b.name);
};

export const timetableRangeLabel = (table: TimeTable): string => {
  const from = new Date(`${table.from}T00:00:00`).toLocaleDateString();
  if (table.to === null) return `From ${from} · ongoing`;
  return `${from} – ${new Date(`${table.to}T00:00:00`).toLocaleDateString()}`;
};

export const totalScheduledMinutes = (slots: TimeSlot[]): number =>
  slots.reduce((sum, slot) => sum + (slot.habitId ? slotDuration(slot) : 0), 0);

export const emptySlotCount = (slots: TimeSlot[]): number =>
  slots.filter((slot) => !slot.habitId).length;

/** Drafts covering the parts of the day not already claimed by a slot. */
export const gapsAsSlots = (slots: TimeSlot[]): TimeSlotDraft[] => {
  const label = (minutes: number): string =>
    minutes >= MINUTES_PER_DAY ? DAY_END : minutesToTime(minutes);

  const ordered = sortSlots(slots).filter((slot) => slotDuration(slot) > 0);
  const gaps: TimeSlotDraft[] = [];
  let cursor = 0;

  for (const slot of ordered) {
    const start = slotStartMinutes(slot);
    if (start > cursor) {
      gaps.push({ start: label(cursor), end: label(start), habitId: null });
    }
    cursor = Math.max(cursor, slotEndMinutes(slot));
  }

  if (cursor < MINUTES_PER_DAY) {
    gaps.push({ start: label(cursor), end: DAY_END, habitId: null });
  }

  return gaps;
};

export const buildPlanComparison = (
  date: string,
  timetables: TimeTable[],
  habits: Habit[],
  categories: Category[],
  logs: HabitLogs,
  shiftMinutes = 0,
): PlanComparison => {
  const active = activeTimetableFor(date, timetables);
  const timetable =
    active && shiftMinutes !== 0
      ? {
          ...active,
          slots: active.slots.map((slot) => shiftSlot(slot, shiftMinutes)),
        }
      : active;
  const habitById = new Map(habits.map((habit) => [habit.id, habit]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const isPast = date < today();

  const entries: PlanEntry[] = (timetable ? sortSlots(timetable.slots) : []).map(
    (slot) => {
      const habit = slot.habitId ? habitById.get(slot.habitId) ?? null : null;
      const stamp = habit ? logs[habit.id]?.[date] : undefined;
      const actualTime = stamp ? logTimeForDate(date, stamp) : null;

      return {
        slot,
        habit,
        category: habit ? categoryById.get(habit.categoryId) : undefined,
        done: Boolean(stamp),
        actualTime,
        deviationMinutes:
          habit && actualTime
            ? timeToMinutes(actualTime) - slotStartMinutes(slot)
            : null,
      };
    },
  );

  const planned = entries.filter(
    (entry): entry is PlanEntry & { habit: Habit } => entry.habit !== null,
  );
  const scheduledIds = new Set(planned.map((entry) => entry.habit.id));
  const unscheduled = habits.filter(
    (habit) => isActive(habit, date) && !scheduledIds.has(habit.id),
  );

  const doneCount = planned.filter((entry) => entry.done).length;
  const outstanding = planned.length - doneCount;

  return {
    timetable,
    entries,
    plannedCount: planned.length,
    emptyCount: entries.length - planned.length,
    doneCount,
    missedCount: isPast ? outstanding : 0,
    pendingCount: isPast ? 0 : outstanding,
    unscheduled,
    coveragePct: planned.length
      ? Math.round((doneCount / planned.length) * 100)
      : 0,
    isPast,
  };
};
