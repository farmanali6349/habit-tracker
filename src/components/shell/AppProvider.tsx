"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import AppSkeleton from "@/components/AppSkeleton";
import ExportDialog from "@/components/ExportDialog";
import HabitDetailDialog from "@/components/HabitDetailDialog";
import HabitFormDialog from "@/components/HabitFormDialog";
import { useDerivedData, type DerivedData } from "@/hooks/useDerivedData";
import { useHabitStore } from "@/hooks/useHabitStore";
import { useReminders } from "@/hooks/useReminders";
import { useTimetableReminders } from "@/hooks/useTimetableReminders";
import { today } from "@/lib/date";
import { primeAudio } from "@/lib/sound";
import type { AppState, Habit, HabitDraft } from "@/types";

type Store = ReturnType<typeof useHabitStore>;

export interface AppContextValue {
  state: AppState;
  derived: DerivedData;
  toggleLog: Store["toggleLog"];
  markMissed: Store["markMissed"];
  unmarkMissed: Store["unmarkMissed"];
  saveMissedNote: Store["saveMissedNote"];
  saveHabit: Store["saveHabit"];
  deleteHabit: Store["deleteHabit"];
  toggleHabitTodo: Store["toggleHabitTodo"];
  saveCategory: Store["saveCategory"];
  deleteCategory: Store["deleteCategory"];
  setSleep: Store["setSleep"];
  saveTimetable: Store["saveTimetable"];
  deleteTimetable: Store["deleteTimetable"];
  addSlots: Store["addSlots"];
  updateSlot: Store["updateSlot"];
  deleteSlot: Store["deleteSlot"];
  addNote: Store["addNote"];
  removeNote: Store["removeNote"];
  setRemind: Store["setRemind"];
  setReminderTime: Store["setReminderTime"];
  setRemindSound: Store["setRemindSound"];
  setRemindTone: Store["setRemindTone"];
  setRemindLead: Store["setRemindLead"];
  importState: Store["importState"];
  toggleRemind: () => void;
  openHabitForm: (habit: Habit | "new") => void;
  openHabitDetail: (habit: Habit) => void;
  openExport: () => void;
  clearAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used within <AppProvider>");
  }
  return value;
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useHabitStore();
  const state = store.state;

  const [editing, setEditing] = useState<Habit | "new" | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const derived = useDerivedData(
    state?.habits ?? [],
    state?.logs ?? {},
    state?.notes ?? [],
  );

  const { toggleRemind } = useReminders({
    remind: state?.remind ?? false,
    rt: state?.rt ?? "20:00",
    sound: state?.remindSound ?? true,
    tone: state?.remindTone ?? "chime",
    habits: state?.habits ?? [],
    logs: state?.logs ?? {},
    onRemindChange: store.setRemind,
  });

  useTimetableReminders({
    enabled: state?.remind ?? false,
    lead: state?.remindLead ?? 5,
    sound: state?.remindSound ?? true,
    tone: state?.remindTone ?? "chime",
    timetables: state?.timetables ?? [],
    habits: state?.habits ?? [],
    logs: state?.logs ?? {},
    onToggleLog: store.toggleLog,
  });

  // Browsers only allow audio after a gesture — unlock once on the first one.
  useEffect(() => {
    const unlock = () => primeAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const openHabitForm = useCallback((habit: Habit | "new") => {
    setEditing(habit);
  }, []);

  const openHabitDetail = useCallback((habit: Habit) => {
    setViewingId(habit.id);
  }, []);

  const closeHabitDetail = useCallback(() => setViewingId(null), []);

  const openExport = useCallback(() => setShowExport(true), []);

  const clearAll = useCallback(() => {
    store.clearAll();
    setShowExport(false);
    toast.success("All data cleared", {
      description: "Every habit, category, check-in and note has been removed.",
    });
  }, [store]);

  const handleSaveHabit = useCallback(
    (draft: HabitDraft) => {
      store.saveHabit(draft);
      setEditing(null);
    },
    [store],
  );

  const value = useMemo<AppContextValue | null>(() => {
    if (!state) return null;
    return {
      state,
      derived,
      toggleLog: store.toggleLog,
      markMissed: store.markMissed,
      unmarkMissed: store.unmarkMissed,
      saveMissedNote: store.saveMissedNote,
      saveHabit: store.saveHabit,
      deleteHabit: store.deleteHabit,
      toggleHabitTodo: store.toggleHabitTodo,
      saveCategory: store.saveCategory,
      deleteCategory: store.deleteCategory,
      setSleep: store.setSleep,
      saveTimetable: store.saveTimetable,
      deleteTimetable: store.deleteTimetable,
      addSlots: store.addSlots,
      updateSlot: store.updateSlot,
      deleteSlot: store.deleteSlot,
      addNote: store.addNote,
      removeNote: store.removeNote,
      setRemind: store.setRemind,
      setReminderTime: store.setReminderTime,
      setRemindSound: store.setRemindSound,
      setRemindTone: store.setRemindTone,
      setRemindLead: store.setRemindLead,
      importState: store.importState,
      toggleRemind,
      openHabitForm,
      openHabitDetail,
      openExport,
      clearAll,
    };
  }, [
    state,
    derived,
    store,
    toggleRemind,
    openHabitForm,
    openHabitDetail,
    openExport,
    clearAll,
  ]);

  if (!state || !value) return <AppSkeleton />;

  const viewing = viewingId
    ? state.habits.find((habit) => habit.id === viewingId) ?? null
    : null;

  return (
    <AppContext.Provider value={value}>
      {children}
      {editing !== null && (
        <HabitFormDialog
          habit={editing === "new" ? null : editing}
          categories={state.categories}
          onSave={handleSaveHabit}
          onClose={() => setEditing(null)}
        />
      )}
      {viewing && (
        <HabitDetailDialog
          habit={viewing}
          category={state.categories.find((c) => c.id === viewing.categoryId)}
          stats={derived.stats[viewing.id]}
          logs={state.logs}
          timetables={state.timetables}
          onToggleTodo={store.toggleHabitTodo}
          onToggleToday={() => store.toggleLog(viewing.id, today())}
          onEdit={() => {
            setEditing(viewing);
            setViewingId(null);
          }}
          onClose={closeHabitDetail}
        />
      )}
      {showExport && (
        <ExportDialog
          state={state}
          onImport={store.importState}
          onClear={clearAll}
          onClose={() => setShowExport(false)}
        />
      )}
    </AppContext.Provider>
  );
}
