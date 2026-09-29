import type { LucideIcon } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface HabitTodo {
  id: string;
  text: string;
  done: boolean;
}

export interface HabitResource {
  id: string;
  title: string;
  url: string;
}

export interface Habit {
  id: string;
  name: string;
  categoryId: string;
  start: string;
  end: string | null;
  /** Local "HH:MM" the habit is normally scheduled to start, or null. */
  startTime: string | null;
  /** Local "HH:MM" the habit is normally scheduled to end, or null. */
  endTime: string | null;
  /** Free-form notes shown in the habit detail modal. */
  description: string;
  /** Lightweight checklist items; never counted by analytics/stats. */
  todos: HabitTodo[];
  /** Reference links (title + url) shown in the habit detail modal. */
  resources: HabitResource[];
}

/** A resolved window for a habit on a date, in minutes past midnight. */
export interface HabitWindow {
  start: number;
  end: number;
}

/** Where a habit sits relative to the live clock on a given day. */
export type HabitMoment =
  | "done"
  | "ongoing"
  | "upcoming"
  | "overdue"
  | "unscheduled"
  | "future";

/** A habit enriched with its window and live status for one day. */
export interface HabitMomentInfo {
  habit: Habit;
  window: HabitWindow | null;
  moment: HabitMoment;
  log: string | undefined;
}

export type HabitLogs = Record<string, Record<string, string>>;

export interface SleepEntry {
  /** Local "HH:MM" the day started, or null when unset. */
  wake: string | null;
  /** Local "HH:MM" the day ended, or null when unset. */
  bed: string | null;
}

export type SleepLog = Record<string, SleepEntry>;

/**
 * A habit the user explicitly flagged as missed on a given day, with the reason
 * and how they intend to cover it the next day. `reason`/`plan` hold either free
 * text or one of the preset strings from `lib/missed`.
 */
export interface MissedEntry {
  reason: string;
  plan: string;
  /** ISO timestamp the item was flagged missed. */
  ts: string;
  /** ISO timestamp of the last note edit, when it has been edited. */
  updatedAt?: string;
}

/** habitId → "YYYY-MM-DD" → MissedEntry */
export type MissedLog = Record<string, Record<string, MissedEntry>>;

export interface Note {
  id: string;
  ts: string;
  text: string;
}

export interface AppState {
  habits: Habit[];
  categories: Category[];
  logs: HabitLogs;
  sleep: SleepLog;
  missed: MissedLog;
  timetables: TimeTable[];
  notes: Note[];
  remind: boolean;
  rt: string;
  /** Play a tone when a reminder fires. */
  remindSound: boolean;
  /** Tone id from `lib/sound`. */
  remindTone: string;
  /** Minutes before a slot to fire the heads-up reminder (0 disables it). */
  remindLead: number;
}

export interface HabitStats {
  done: number;
  n: number;
  pct: number;
  cur: number;
  best: number;
}

export interface SeriesPoint {
  d: string;
  l: string;
  c: number;
  a: number;
  p: number;
}

export interface RankRow {
  h: Habit;
  a: number;
  c: number;
  p: number;
}

export interface BadgeInfo {
  icon: string;
  label: string;
  earned: boolean;
}

export interface FeedItem {
  id: string;
  ts: string;
  t: "note" | "habit";
  x: string;
  /** For habit check-ins: the habit it belongs to. */
  habitId?: string;
  /** For habit check-ins: the day it was logged for. */
  d?: string;
}

export type TimelineKind = "wake" | "bed" | "checkin" | "pending" | "missed";

export interface TimelineEntry {
  id: string;
  kind: TimelineKind;
  time: string | null;
  minutes: number | null;
  habit?: Habit;
  category?: Category;
  missed?: MissedEntry;
}

export interface TimeSlot {
  id: string;
  /** Local "HH:MM". */
  start: string;
  /** Local "HH:MM"; "00:00" means midnight at the end of the day. */
  end: string;
  /** null marks an empty slot. */
  habitId: string | null;
}

export interface TimeTable {
  id: string;
  name: string;
  /** First day the timetable applies to. */
  from: string;
  /** Last day it applies to, or null for an open-ended timetable. */
  to: string | null;
  slots: TimeSlot[];
}

export type TimeSlotDraft = Omit<TimeSlot, "id"> & { id?: string };

export type TimeTableDraft = Omit<TimeTable, "id" | "slots"> & {
  id?: string;
  slots?: TimeSlot[];
};

export interface PlanEntry {
  slot: TimeSlot;
  habit: Habit | null;
  category?: Category;
  done: boolean;
  actualTime: string | null;
  deviationMinutes: number | null;
}

export interface PlanComparison {
  timetable: TimeTable | null;
  entries: PlanEntry[];
  plannedCount: number;
  emptyCount: number;
  doneCount: number;
  missedCount: number;
  pendingCount: number;
  unscheduled: Habit[];
  coveragePct: number;
  isPast: boolean;
}

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export type DayState = "complete" | "partial" | "missed" | "empty" | "future";

export interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  activeCount: number;
  done: number;
  pct: number;
  state: DayState;
}

export interface CalendarSummary {
  completedDays: number;
  partialDays: number;
  missedDays: number;
  trackedDays: number;
  consistencyPct: number;
  bestStreak: number;
}

export interface CompareSide {
  date: string;
  activeCount: number;
  done: number;
  pct: number;
  missed: number;
  asleepMinutes: number | null;
}

export interface CompareRow {
  habit: Habit;
  category?: Category;
  activeA: boolean;
  activeB: boolean;
  doneA: boolean;
  doneB: boolean;
}

export interface DayComparison {
  a: CompareSide;
  b: CompareSide;
  rows: CompareRow[];
  differing: number;
}

export type CalendarMode = "day" | "compare";

export type ExportKind = "json" | "csv";

export type CategoryDraft = Omit<Category, "id"> & { id?: string };

export type HabitDraft = Omit<Habit, "id" | "start"> & {
  id?: string;
  start?: string;
};

export interface HourBucket {
  hour: number;
  label: string;
  count: number;
}

export interface WeekdayStat {
  day: number;
  label: string;
  done: number;
  active: number;
  pct: number;
}

export interface DayStack {
  d: string;
  l: string;
  done: number;
  missed: number;
}

export interface PeriodDelta {
  current: number;
  previous: number;
  delta: number;
}

export interface TrendPoint {
  key: string;
  label: string;
  done: number;
  active: number;
  pct: number;
}

export interface CategoryStat {
  category: Category;
  habits: number;
  done: number;
  active: number;
  pct: number;
  bestHabit?: Habit;
}

export interface PlanAccuracy {
  planned: number;
  done: number;
  onTime: number;
  late: number;
  early: number;
  missed: number;
  onTimePct: number;
  avgDeviation: number | null;
  byDay: DayStack[];
}

export interface HeatPoint {
  date: string;
  count: number;
  done: number;
  active: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export type InsightTone = "positive" | "warning" | "neutral";

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: string;
  title: string;
  detail: string;
}

export interface YearSummary {
  year: string;
  strongest: RankRow[];
  weakest: RankRow[];
  bestStreak: number;
  mostConsistentMonth: string | null;
  categories: CategoryStat[];
  totalDone: number;
  activeDays: number;
  consistencyPct: number;
}

export interface MissedReasonStat {
  reason: string;
  count: number;
}

export interface MissedHabitStat {
  habit: Habit;
  category?: Category;
  missed: number;
  active: number;
  pct: number;
}

export interface MissedRollup {
  /** Days in the analysed window. */
  windowDays: number;
  totalMissed: number;
  /** How many of the misses carry a written reason. */
  withNotes: number;
  topReasons: MissedReasonStat[];
  worstHabits: MissedHabitStat[];
  byDay: DayStack[];
}
