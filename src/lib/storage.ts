import type {
  AppState,
  Category,
  Habit,
  HabitResource,
  HabitTodo,
  MissedEntry,
  MissedLog,
  Note,
  SleepEntry,
  SleepLog,
  TimeSlot,
  TimeTable,
} from "@/types";
import {
  CATEGORY_COLORS,
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
  logs: {},
  sleep: {},
  missed: {},
  timetables: [],
  notes: [],
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
    logs: input.logs ?? {},
    sleep: sanitizeSleep(input.sleep),
    missed: sanitizeMissed(input.missed),
    timetables,
    notes,
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
