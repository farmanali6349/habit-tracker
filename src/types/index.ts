import type { LucideIcon } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

/** An identity the user is trying to become ("a healthy person"). */
export interface Identity {
  id: string;
  /** Completes "I am becoming …", e.g. "a runner". */
  statement: string;
  /** Single emoji shown next to the statement. */
  emoji: string;
  /** One of the CATEGORY_COLORS values. */
  color: string;
  createdAt: string;
}

/**
 * How often a habit is expected. `weekly` is measured per calendar week rather
 * than per day, so a "3×/week" habit isn't penalised on its rest days.
 */
export type HabitFrequency =
  | { kind: "daily" }
  | { kind: "weekdays"; days: number[] }
  | { kind: "weekly"; times: number };

/** An optional numeric target for a habit, e.g. { target: 20, unit: "pages" }. */
export interface HabitMetric {
  target: number;
  unit: string;
}

/** Build a new habit, or limit/reduce a bad one. */
export type HabitKind = "build" | "limit";

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
  /** Identities this habit casts a vote for (empty when unlinked). */
  identityIds: string[];
  /** Whether the habit is being built or limited. */
  kind: HabitKind;
  /** How often the habit is expected (defaults to daily). */
  frequency: HabitFrequency;
  /** Optional numeric target; null means a simple done/not-done habit. */
  metric: HabitMetric | null;
  /** Habit this one is stacked after ("After X, I will …"), or null. */
  anchorHabitId: string | null;
  /** Free-text cue anchor, e.g. "After I brush my teeth". */
  anchorText: string | null;
  /** Per-habit reminder time ("HH:MM"), overriding the global lead, or null. */
  remindTime: string | null;
  /** Per-habit reminder lead in minutes, or null to use the global lead. */
  remindLead: number | null;
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

/** habitId → "YYYY-MM-DD" → amount logged (for habits with a numeric target). */
export type ProgressLog = Record<string, Record<string, number>>;

/** habitId → "YYYY-MM-DD" → true, for planned rest/skip days. */
export type SkipLog = Record<string, Record<string, true>>;

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

/** A saved end-of-week reflection. */
export interface WeeklyReview {
  id: string;
  /** Monday of the reviewed week ("YYYY-MM-DD"). */
  weekStart: string;
  wentWell: string;
  didntWork: string;
  adjust: string;
  /** 1–5 self rating for the week. */
  rating: number;
  ts: string;
}

/** Local, single-device profile + accountability partner. */
export interface HabitProfile {
  displayName: string;
  partnerName: string;
}

export interface AppState {
  habits: Habit[];
  categories: Category[];
  identities: Identity[];
  logs: HabitLogs;
  /** habitId → date → amount logged, for habits with a numeric target. */
  progress: ProgressLog;
  /** habitId → date → true, for planned rest/skip days. */
  skips: SkipLog;
  sleep: SleepLog;
  missed: MissedLog;
  timetables: TimeTable[];
  notes: Note[];
  reviews: WeeklyReview[];
  profile: HabitProfile;
  /** Whether the first-run setup has been completed (or skipped). */
  onboarded: boolean;
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

export type IdentityDraft = Omit<Identity, "id" | "createdAt"> & { id?: string };

export type ReviewDraft = Omit<WeeklyReview, "id" | "ts"> & { id?: string };

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
