import type {
  AppState,
  Category,
  Habit,
  HabitFrequency,
  HabitMetric,
  HabitProfile,
  HabitResource,
  HabitTodo,
  Identity,
  MissedEntry,
  MissedLog,
  Note,
  ProgressLog,
  SkipLog,
  SleepEntry,
  SleepLog,
  TimeSlot,
  TimeTable,
  WeeklyReview,
} from "@/types";
import {
  CATEGORY_COLORS,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  UNCATEGORIZED_ID,
  uncategorizedCategory,
} from "./categories";
import { today } from "./date";
import { uid } from "./stats";

export const KEY = "ht_v2";

/** First-run state: empty. Visitors build everything up themselves. */
export const defaultState = (): AppState => ({
  habits: [],
  categories: [uncategorizedCategory()],
  identities: [],
  logs: {},
  progress: {},
  skips: {},
  sleep: {},
  missed: {},
  timetables: [],
  notes: [],
  reviews: [],
  profile: { displayName: "", partnerName: "" },
  onboarded: false,
  remind: false,
  rt: "20:00",
  remindSound: true,
  remindTone: "chime",
  remindLead: 5,
});

/** Legacy shape: the category lived on the habit as a free-text `cat` string. */
type RawState = Partial<Omit<AppState, "habits">> & {
  habits?: (Partial<Habit> & { cat?: string })[];
};

const sanitizeSleep = (raw: unknown): SleepLog => {
  if (!raw || typeof raw !== "object") return {};
  const out: SleepLog = {};
  for (const [date, value] of Object.entries(
    raw as Record<string, Partial<SleepEntry>>,
  )) {
    if (!value || typeof value !== "object") continue;
    const wake = typeof value.wake === "string" ? value.wake : null;
    const bed = typeof value.bed === "string" ? value.bed : null;
    if (wake || bed) out[date] = { wake, bed };
  }
  return out;
};

const sanitizeMissed = (raw: unknown): MissedLog => {
  if (!raw || typeof raw !== "object") return {};
  const out: MissedLog = {};
  for (const [habitId, dates] of Object.entries(
    raw as Record<string, Record<string, Partial<MissedEntry>>>,
  )) {
    if (!dates || typeof dates !== "object") continue;
    const byDate: Record<string, MissedEntry> = {};
    for (const [date, value] of Object.entries(dates)) {
      if (!value || typeof value !== "object") continue;
      byDate[date] = {
        reason: typeof value.reason === "string" ? value.reason : "",
        plan: typeof value.plan === "string" ? value.plan : "",
        ts: typeof value.ts === "string" ? value.ts : new Date().toISOString(),
        ...(typeof value.updatedAt === "string"
          ? { updatedAt: value.updatedAt }
          : {}),
      };
    }
    if (Object.keys(byDate).length) out[habitId] = byDate;
  }
  return out;
};

const sanitizeTodos = (raw: unknown): HabitTodo[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const todo = candidate as Partial<HabitTodo>;
    if (typeof todo.text !== "string" || !todo.text.trim()) return [];
    return [
      {
        id: typeof todo.id === "string" && todo.id ? todo.id : uid(),
        text: todo.text,
        done: Boolean(todo.done),
      },
    ];
  });
};

const sanitizeResources = (raw: unknown): HabitResource[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const resource = candidate as Partial<HabitResource>;
    if (typeof resource.title !== "string" || !resource.title.trim()) return [];
    if (typeof resource.url !== "string" || !resource.url.trim()) return [];
    return [
      {
        id:
          typeof resource.id === "string" && resource.id ? resource.id : uid(),
        title: resource.title,
        url: resource.url,
      },
    ];
  });
};

const sanitizeSlots = (raw: unknown): TimeSlot[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const slot = candidate as Partial<TimeSlot>;
    if (typeof slot.start !== "string" || typeof slot.end !== "string") return [];
    return [
      {
        id: typeof slot.id === "string" && slot.id ? slot.id : uid(),
        start: slot.start,
        end: slot.end,
        habitId:
          typeof slot.habitId === "string" && slot.habitId ? slot.habitId : null,
      },
    ];
  });
};

const sanitizeTimetables = (raw: unknown): TimeTable[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const table = candidate as Partial<TimeTable>;
    if (typeof table.from !== "string" || !table.from) return [];
    return [
      {
        id: typeof table.id === "string" && table.id ? table.id : uid(),
        name:
          typeof table.name === "string" && table.name.trim()
            ? table.name
            : "Timetable",
        from: table.from,
        to: typeof table.to === "string" && table.to ? table.to : null,
        slots: sanitizeSlots(table.slots),
      },
    ];
  });
};

const sanitizeIdentities = (raw: unknown): Identity[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const identity = candidate as Partial<Identity>;
    if (typeof identity.statement !== "string" || !identity.statement.trim())
      return [];
    return [
      {
        id: typeof identity.id === "string" && identity.id ? identity.id : uid(),
        statement: identity.statement.trim(),
        emoji:
          typeof identity.emoji === "string" && identity.emoji
            ? identity.emoji
            : "✨",
        color:
          typeof identity.color === "string" && identity.color
            ? identity.color
            : DEFAULT_CATEGORY_COLOR,
        createdAt:
          typeof identity.createdAt === "string" && identity.createdAt
            ? identity.createdAt
            : new Date().toISOString(),
      },
    ];
  });
};

const sanitizeProgress = (raw: unknown): ProgressLog => {
  if (!raw || typeof raw !== "object") return {};
  const out: ProgressLog = {};
  for (const [habitId, dates] of Object.entries(
    raw as Record<string, Record<string, unknown>>,
  )) {
    if (!dates || typeof dates !== "object") continue;
    const byDate: Record<string, number> = {};
    for (const [date, value] of Object.entries(dates)) {
      if (typeof value === "number" && Number.isFinite(value))
        byDate[date] = value;
    }
    if (Object.keys(byDate).length) out[habitId] = byDate;
  }
  return out;
};

const sanitizeSkips = (raw: unknown): SkipLog => {
  if (!raw || typeof raw !== "object") return {};
  const out: SkipLog = {};
  for (const [habitId, dates] of Object.entries(
    raw as Record<string, Record<string, unknown>>,
  )) {
    if (!dates || typeof dates !== "object") continue;
    const byDate: Record<string, true> = {};
    for (const [date, value] of Object.entries(dates)) {
      if (value) byDate[date] = true;
    }
    if (Object.keys(byDate).length) out[habitId] = byDate;
  }
  return out;
};

const sanitizeReviews = (raw: unknown): WeeklyReview[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const review = candidate as Partial<WeeklyReview>;
    if (typeof review.weekStart !== "string" || !review.weekStart) return [];
    return [
      {
        id: typeof review.id === "string" && review.id ? review.id : uid(),
        weekStart: review.weekStart,
        wentWell: typeof review.wentWell === "string" ? review.wentWell : "",
        didntWork: typeof review.didntWork === "string" ? review.didntWork : "",
        adjust: typeof review.adjust === "string" ? review.adjust : "",
        rating:
          typeof review.rating === "number" &&
          review.rating >= 1 &&
          review.rating <= 5
            ? Math.round(review.rating)
            : 3,
        ts: typeof review.ts === "string" ? review.ts : new Date().toISOString(),
      },
    ];
  });
};

const sanitizeProfile = (raw: unknown): HabitProfile => {
  const input = (raw && typeof raw === "object" ? raw : {}) as Partial<HabitProfile>;
  return {
    displayName: typeof input.displayName === "string" ? input.displayName : "",
    partnerName: typeof input.partnerName === "string" ? input.partnerName : "",
  };
};

const validFrequency = (raw: unknown): HabitFrequency | null => {
  if (!raw || typeof raw !== "object") return null;
  const freq = raw as { kind?: unknown; days?: unknown; times?: unknown };
  if (freq.kind === "daily") return { kind: "daily" };
  if (freq.kind === "weekdays") {
    const days = Array.isArray(freq.days)
      ? freq.days.filter(
          (d): d is number => typeof d === "number" && d >= 0 && d <= 6,
        )
      : [];
    return { kind: "weekdays", days: [...new Set(days)].sort() };
  }
  if (
    freq.kind === "weekly" &&
    typeof freq.times === "number" &&
    freq.times >= 1 &&
    freq.times <= 7
  ) {
    return { kind: "weekly", times: Math.round(freq.times) };
  }
  return null;
};

const validMetric = (raw: unknown): HabitMetric | null => {
  if (!raw || typeof raw !== "object") return null;
  const metric = raw as Partial<HabitMetric>;
  if (
    typeof metric.target !== "number" ||
    !Number.isFinite(metric.target) ||
    metric.target <= 0
  ) {
    return null;
  }
  return {
    target: metric.target,
    unit: typeof metric.unit === "string" ? metric.unit : "",
  };
};

/**
 * Normalises persisted data. Adds categories if missing, converts the legacy
 * `habit.cat` string into a `categoryId`, and re-homes habits whose category no
 * longer exists. Returns null when the payload isn't a usable backup.
 */
export const migrateState = (raw: unknown): AppState | null => {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as RawState;
  if (!Array.isArray(input.habits)) return null;

  const categories: Category[] = Array.isArray(input.categories)
    ? input.categories.filter((c) => Boolean(c?.id && c?.name && c?.name.trim()))
    : [];

  const findByName = (name: string): Category | undefined =>
    categories.find((c) => c.name.toLowerCase() === name.toLowerCase());

  const createForName = (name: string): Category => {
    const created: Category = {
      id: uid(),
      name,
      icon: DEFAULT_CATEGORY_ICON,
      color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length].value,
    };
    categories.push(created);
    return created;
  };

  const fallbackCategory = (): Category => {
    const existing = categories.find((c) => c.id === UNCATEGORIZED_ID);
    if (existing) return existing;
    const created = uncategorizedCategory();
    categories.push(created);
    return created;
  };

  const timetables = sanitizeTimetables(input.timetables);

  const validTime = (value: unknown): string | null =>
    typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value) ? value : null;

  // Fall back to the first timetable slot that schedules a habit, so previously
  // scheduled habits keep a time window.
  const slotForHabit = (habitId: string) => {
    for (const table of timetables) {
      const slot = table.slots.find((candidate) => candidate.habitId === habitId);
      if (slot) return slot;
    }
    return null;
  };

  const identities = sanitizeIdentities(input.identities);
  const identityIds = new Set(identities.map((identity) => identity.id));
  const habitIds = new Set<string>();
  for (const habit of input.habits) {
    if (typeof habit.id === "string" && habit.id) habitIds.add(habit.id);
  }

  const habits: Habit[] = input.habits.map((habit) => {
    const id = habit.id ?? uid();
    const slot = slotForHabit(id);
    const base = {
      id,
      name: habit.name ?? "Untitled habit",
      start: habit.start ?? today(),
      end: habit.end ?? null,
      startTime: validTime(habit.startTime) ?? slot?.start ?? null,
      endTime: validTime(habit.endTime) ?? slot?.end ?? null,
      description:
        typeof habit.description === "string" ? habit.description : "",
      todos: sanitizeTodos(habit.todos),
      resources: sanitizeResources(habit.resources),
      identityId:
        typeof habit.identityId === "string" && identityIds.has(habit.identityId)
          ? habit.identityId
          : null,
      kind: habit.kind === "limit" ? ("limit" as const) : ("build" as const),
      frequency: validFrequency(habit.frequency) ?? { kind: "daily" as const },
      metric: validMetric(habit.metric),
      anchorHabitId:
        typeof habit.anchorHabitId === "string" &&
        habit.anchorHabitId !== id &&
        habitIds.has(habit.anchorHabitId)
          ? habit.anchorHabitId
          : null,
      anchorText:
        typeof habit.anchorText === "string" && habit.anchorText.trim()
          ? habit.anchorText.trim()
          : null,
      remindTime: validTime(habit.remindTime),
      remindLead:
        typeof habit.remindLead === "number" && habit.remindLead >= 0
          ? habit.remindLead
          : null,
    };

    if (!habit.categoryId && typeof habit.cat === "string" && habit.cat.trim()) {
      const name = habit.cat.trim();
      return { ...base, categoryId: (findByName(name) ?? createForName(name)).id };
    }

    if (habit.categoryId && categories.some((c) => c.id === habit.categoryId)) {
      return { ...base, categoryId: habit.categoryId };
    }

    return { ...base, categoryId: fallbackCategory().id };
  });

  const notes: Note[] = Array.isArray(input.notes) ? input.notes : [];

  return {
    habits,
    categories,
    identities,
    logs: input.logs ?? {},
    progress: sanitizeProgress(input.progress),
    skips: sanitizeSkips(input.skips),
    sleep: sanitizeSleep(input.sleep),
    missed: sanitizeMissed(input.missed),
    timetables,
    notes,
    reviews: sanitizeReviews(input.reviews),
    profile: sanitizeProfile(input.profile),
    onboarded: Boolean(input.onboarded) || habits.length > 0,
    remind: Boolean(input.remind),
    rt: typeof input.rt === "string" ? input.rt : "20:00",
    remindSound: input.remindSound === undefined ? true : Boolean(input.remindSound),
    remindTone:
      typeof input.remindTone === "string" && input.remindTone
        ? input.remindTone
        : "chime",
    remindLead:
      typeof input.remindLead === "number" && input.remindLead >= 0
        ? input.remindLead
        : 5,
  };
};

export const loadState = (): AppState => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return migrateState(parsed) ?? defaultState();
  } catch {
    /* ignore corrupt storage */
  }
  return defaultState();
};

export const saveState = (state: AppState): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode errors */
  }
};
