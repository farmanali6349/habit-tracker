"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type {
  AppState,
  Category,
  CategoryDraft,
  Habit,
  HabitDraft,
  MissedEntry,
  MissedLog,
  SleepEntry,
  TimeSlotDraft,
  TimeTable,
  TimeTableDraft,
} from "@/types";
import { today } from "@/lib/date";
import { minutesToTime } from "@/lib/day";
import { UNCATEGORIZED_ID, uncategorizedCategory } from "@/lib/categories";
import { loadState, migrateState, saveState, defaultState } from "@/lib/storage";
import { uid } from "@/lib/stats";
import { sortSlots } from "@/lib/timetable";

type Patch = Partial<AppState> | ((prev: AppState) => Partial<AppState>);

let current: AppState | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function getSnapshot(): AppState | null {
  if (!hydrated) {
    current = loadState();
    hydrated = true;
  }
  return current;
}

function getServerSnapshot(): AppState | null {
  return null;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function patchState(patch: Patch): void {
  if (!current) return;
  const partial = typeof patch === "function" ? patch(current) : patch;
  current = { ...current, ...partial };
  listeners.forEach((listener) => listener());
}

/** Returns a new `MissedLog` with `habitId`/`date` set to `entry` (or removed). */
function withMissedDate(
  missed: MissedLog,
  habitId: string,
  date: string,
  entry: MissedEntry | null,
): MissedLog {
  const forHabit = { ...(missed[habitId] || {}) };
  if (entry) forHabit[date] = entry;
  else delete forHabit[date];

  const next = { ...missed };
  if (Object.keys(forHabit).length) next[habitId] = forHabit;
  else delete next[habitId];
  return next;
}

export function useHabitStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!state) return;
    saveState(state);
  }, [state]);

  const update = useCallback((patch: Patch) => patchState(patch), []);

  const toggleLog = useCallback((id: string, d: string) => {
    patchState((x) => {
      const logs = { ...(x.logs[id] || {}) };
      if (logs[d]) {
        delete logs[d];
        return { logs: { ...x.logs, [id]: logs } };
      }
      // Completing a habit clears any "missed" flag for that day.
      logs[d] = new Date().toISOString();
      return {
        logs: { ...x.logs, [id]: logs },
        missed: withMissedDate(x.missed, id, d, null),
      };
    });
  }, []);

  const markMissed = useCallback((id: string, date: string) => {
    patchState((x) => {
      const existing = x.missed[id]?.[date];
      const entry: MissedEntry = existing ?? {
        reason: "",
        plan: "",
        ts: new Date().toISOString(),
      };
      // Flagging a habit missed undoes a completion on the same day.
      const logs = { ...(x.logs[id] || {}) };
      delete logs[date];
      return {
        logs: { ...x.logs, [id]: logs },
        missed: withMissedDate(x.missed, id, date, entry),
      };
    });
  }, []);

  const unmarkMissed = useCallback((id: string, date: string) => {
    patchState((x) => ({ missed: withMissedDate(x.missed, id, date, null) }));
  }, []);

  const saveMissedNote = useCallback(
    (
      id: string,
      date: string,
      patch: Partial<Pick<MissedEntry, "reason" | "plan">>,
    ) => {
      patchState((x) => {
        const existing = x.missed[id]?.[date] ?? {
          reason: "",
          plan: "",
          ts: new Date().toISOString(),
        };
        const entry: MissedEntry = {
          ...existing,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
        return { missed: withMissedDate(x.missed, id, date, entry) };
      });
    },
    [],
  );

  const saveHabit = useCallback((draft: HabitDraft) => {
    patchState((x) => {
      if (draft.id) {
        return {
          habits: x.habits.map((h) =>
            h.id === draft.id ? ({ ...h, ...draft } as Habit) : h,
          ),
        };
      }

      // A habit created now starts tracking from the current time onward.
      const at = new Date();
      const startMinutes =
        Math.floor((at.getHours() * 60 + at.getMinutes()) / 5) * 5;
      const created: Habit = {
        ...draft,
        id: uid(),
        start: today(),
        startTime: draft.startTime ?? minutesToTime(startMinutes),
        endTime: draft.endTime ?? minutesToTime(startMinutes + 60),
      };
      return { habits: [...x.habits, created] };
    });
  }, []);

  const toggleHabitTodo = useCallback((habitId: string, todoId: string) => {
    patchState((x) => ({
      habits: x.habits.map((h) =>
        h.id === habitId
          ? {
              ...h,
              todos: h.todos.map((t) =>
                t.id === todoId ? { ...t, done: !t.done } : t,
              ),
            }
          : h,
      ),
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    patchState((x) => {
      const logs = { ...x.logs };
      delete logs[id];
      const missed = { ...x.missed };
      delete missed[id];
      return { habits: x.habits.filter((h) => h.id !== id), logs, missed };
    });
  }, []);

  const saveCategory = useCallback((draft: CategoryDraft) => {
    patchState((x) => ({
      categories: draft.id
        ? x.categories.map((c) =>
            c.id === draft.id ? ({ ...c, ...draft } as Category) : c,
          )
        : [...x.categories, { ...draft, id: uid() } as Category],
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    patchState((x) => {
      const remaining = x.categories.filter((c) => c.id !== id);
      const affected = x.habits.some((h) => h.categoryId === id);
      if (!affected) return { categories: remaining };

      let fallback = remaining.find((c) => c.id === UNCATEGORIZED_ID);
      if (!fallback) {
        fallback = uncategorizedCategory();
        remaining.push(fallback);
      }
      const fallbackId = fallback.id;

      return {
        categories: remaining,
        habits: x.habits.map((h) =>
          h.categoryId === id ? { ...h, categoryId: fallbackId } : h,
        ),
      };
    });
  }, []);

  const setSleep = useCallback((date: string, patch: Partial<SleepEntry>) => {
    patchState((x) => {
      const existing = x.sleep[date];
      const entry: SleepEntry = {
        wake: existing?.wake ?? null,
        bed: existing?.bed ?? null,
        ...patch,
      };
      const sleep = { ...x.sleep };
      if (entry.wake || entry.bed) sleep[date] = entry;
      else delete sleep[date];
      return { sleep };
    });
  }, []);

  const saveTimetable = useCallback((draft: TimeTableDraft) => {
    patchState((x) => {
      if (draft.id) {
        return {
          timetables: x.timetables.map((table) =>
            table.id === draft.id
              ? {
                  ...table,
                  name: draft.name,
                  from: draft.from,
                  to: draft.to,
                  slots: draft.slots ? sortSlots(draft.slots) : table.slots,
                }
              : table,
          ),
        };
      }

      const created: TimeTable = {
        id: uid(),
        name: draft.name,
        from: draft.from,
        to: draft.to,
        slots: sortSlots(draft.slots ?? []),
      };
      return { timetables: [...x.timetables, created] };
    });
  }, []);

  const deleteTimetable = useCallback((id: string) => {
    patchState((x) => ({
      timetables: x.timetables.filter((table) => table.id !== id),
    }));
  }, []);

  const addSlots = useCallback((timetableId: string, drafts: TimeSlotDraft[]) => {
    if (!drafts.length) return;
    patchState((x) => ({
      timetables: x.timetables.map((table) =>
        table.id === timetableId
          ? {
              ...table,
              slots: sortSlots([
                ...table.slots,
                ...drafts.map((draft) => ({ ...draft, id: draft.id ?? uid() })),
              ]),
            }
          : table,
      ),
    }));
  }, []);

  const updateSlot = useCallback(
    (timetableId: string, slotId: string, patch: Partial<TimeSlotDraft>) => {
      patchState((x) => ({
        timetables: x.timetables.map((table) =>
          table.id === timetableId
            ? {
                ...table,
                slots: sortSlots(
                  table.slots.map((slot) =>
                    slot.id === slotId ? { ...slot, ...patch } : slot,
                  ),
                ),
              }
            : table,
        ),
      }));
    },
    [],
  );

  const deleteSlot = useCallback((timetableId: string, slotId: string) => {
    patchState((x) => ({
      timetables: x.timetables.map((table) =>
        table.id === timetableId
          ? { ...table, slots: table.slots.filter((slot) => slot.id !== slotId) }
          : table,
      ),
    }));
  }, []);

  const addNote = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    patchState((x) => ({
      notes: [
        { id: uid(), ts: new Date().toISOString(), text: trimmed },
        ...x.notes,
      ],
    }));
  }, []);

  const removeNote = useCallback((id: string) => {
    patchState((x) => ({ notes: x.notes.filter((n) => n.id !== id) }));
  }, []);

  const setRemind = useCallback((value: boolean) => patchState({ remind: value }), []);
  const setReminderTime = useCallback((rt: string) => patchState({ rt }), []);
  const setRemindSound = useCallback(
    (value: boolean) => patchState({ remindSound: value }),
    [],
  );
  const setRemindTone = useCallback(
    (remindTone: string) => patchState({ remindTone }),
    [],
  );
  const setRemindLead = useCallback(
    (remindLead: number) => patchState({ remindLead }),
    [],
  );
  const importState = useCallback((next: AppState) => {
    const migrated = migrateState(next);
    if (migrated) patchState(migrated);
  }, []);

  const clearAll = useCallback(() => {
    patchState(defaultState());
  }, []);

  return {
    state,
    update,
    toggleLog,
    markMissed,
    unmarkMissed,
    saveMissedNote,
    saveHabit,
    deleteHabit,
    toggleHabitTodo,
    saveCategory,
    deleteCategory,
    setSleep,
    saveTimetable,
    deleteTimetable,
    addSlots,
    updateSlot,
    deleteSlot,
    addNote,
    removeNote,
    setRemind,
    setReminderTime,
    setRemindSound,
    setRemindTone,
    setRemindLead,
    importState,
    clearAll,
  };
}
