"use client";

import { useMemo, useState } from "react";
import { LayoutGridIcon, PlusIcon, SearchIcon } from "lucide-react";
import HabitGroup from "@/components/HabitGroup";
import { useApp } from "@/components/shell/AppProvider";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { useNow } from "@/hooks/useNow";
import { groupHabitsByCategory } from "@/lib/categories";
import { today } from "@/lib/date";
import { compareByMoment, resolveHabitMoments } from "@/lib/schedule";
import type { Habit, HabitMomentInfo } from "@/types";

export default function HabitsSection() {
  const { state, derived, toggleLog, deleteHabit, openHabitForm, openHabitDetail } =
    useApp();
  const { habits, categories, logs, timetables } = state;
  const { stats } = derived;
  const [query, setQuery] = useState("");
  const t = today();
  const now = useNow();

  const moments = useMemo(() => {
    const map = new Map<string, HabitMomentInfo>();
    for (const info of resolveHabitMoments(
      t,
      habits,
      logs,
      timetables,
      t,
      now.minutes,
    )) {
      map.set(info.habit.id, info);
    }
    return map;
  }, [t, habits, logs, timetables, now.minutes]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = q
      ? habits.filter((h) => h.name.toLowerCase().includes(q))
      : habits;

    // Ongoing first, then upcoming by start; completed last in log order.
    const order = (a: Habit, b: Habit) => {
      const ia = moments.get(a.id);
      const ib = moments.get(b.id);
      if (ia && ib) return compareByMoment(ia, ib);
      if (ia) return -1;
      if (ib) return 1;
      return a.name.localeCompare(b.name);
    };

    return groupHabitsByCategory(visible, categories).map((group) => ({
      ...group,
      habits: [...group.habits].sort(order),
    }));
  }, [habits, categories, query, moments]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <SearchIcon className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search habits"
            placeholder="Search habits…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ps-8"
          />
        </div>
        <Button onClick={() => openHabitForm("new")}>
          <PlusIcon data-icon="inline-start" />
          Add habit
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Grouped by category, ordered by the live clock — ongoing, then upcoming,
        then overdue and completed. Last 14 days: green = done, red = missed.
        Select a day to backfill.
      </p>

      {groups.length ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <HabitGroup
              key={group.category.id}
              category={group.category}
              habits={group.habits}
              logs={logs}
              stats={stats}
              moments={moments}
              nowMinutes={now.minutes}
              onToggle={toggleLog}
              onEdit={(habit) => openHabitForm(habit)}
              onView={openHabitDetail}
              onDelete={deleteHabit}
            />
          ))}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutGridIcon />
            </EmptyMedia>
            <EmptyTitle>
              {habits.length ? "No habits match" : "No habits yet"}
            </EmptyTitle>
            <EmptyDescription>
              {habits.length
                ? "Try a different search."
                : "Add your first habit to start building streaks."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
