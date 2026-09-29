"use client";

import { useMemo, useState } from "react";
import { BanIcon, LayoutGridIcon, PlusIcon, SearchIcon } from "lucide-react";
import ChainsCard from "@/components/ChainsCard";
import HabitGroup from "@/components/HabitGroup";
import HabitListItem from "@/components/HabitListItem";
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
import { groupHabitsByCategory, uncategorizedCategory } from "@/lib/categories";
import { today } from "@/lib/date";
import { identitiesForHabit } from "@/lib/identity";
import { compareByMoment, resolveHabitMoments } from "@/lib/schedule";
import type { Habit, HabitMomentInfo } from "@/types";

export default function HabitsSection() {
  const {
    state,
    derived,
    toggleLog,
    logStart,
    clearStart,
    deleteHabit,
    openHabitForm,
    openHabitDetail,
    todayShift,
  } = useApp();
  const { habits, categories, logs, starts, timetables, identities } = state;
  const { stats } = derived;
  const [query, setQuery] = useState("");
  const t = today();
  const now = useNow();

  const habitNames = useMemo(
    () => Object.fromEntries(habits.map((habit) => [habit.id, habit.name])),
    [habits],
  );

  const moments = useMemo(() => {
    const map = new Map<string, HabitMomentInfo>();
    for (const info of resolveHabitMoments(
      t,
      habits,
      logs,
      timetables,
      t,
      now.minutes,
      todayShift,
    )) {
      map.set(info.habit.id, info);
    }
    return map;
  }, [t, habits, logs, timetables, now.minutes, todayShift]);

  const { groups, limitHabits } = useMemo(() => {
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

    const build = visible.filter((habit) => habit.kind !== "limit");
    const limit = visible
      .filter((habit) => habit.kind === "limit")
      .sort(order);

    return {
      groups: groupHabitsByCategory(build, categories).map((group) => ({
        ...group,
        habits: [...group.habits].sort(order),
      })),
      limitHabits: limit,
    };
  }, [habits, categories, query, moments]);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

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

      {!query.trim() && <ChainsCard habits={habits} />}

      {limitHabits.length > 0 && (
        <section className="overflow-hidden rounded-xl border">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <BanIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-heading text-sm font-medium">Reduce</span>
            <span className="text-xs text-muted-foreground">
              a check-in means you resisted
            </span>
          </div>
          <div className="divide-y border-t">
            {limitHabits.map((habit) => (
              <HabitListItem
                key={habit.id}
                habit={habit}
                category={categoryById.get(habit.categoryId) ?? uncategorizedCategory()}
                identities={identitiesForHabit(identities, habit)}
                anchorName={habit.anchorHabitId ? habitNames[habit.anchorHabitId] : undefined}
                logs={logs}
                starts={starts}
                stats={stats[habit.id]}
                info={moments.get(habit.id)}
                nowMinutes={now.minutes}
                onToggle={toggleLog}
                onStart={logStart}
                onClearStart={clearStart}
                onEdit={(h) => openHabitForm(h)}
                onView={openHabitDetail}
                onDelete={deleteHabit}
              />
            ))}
          </div>
        </section>
      )}

      {groups.length || limitHabits.length ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <HabitGroup
              key={group.category.id}
              category={group.category}
              habits={group.habits}
              identities={identities}
              habitNames={habitNames}
              logs={logs}
              starts={starts}
              stats={stats}
              moments={moments}
              nowMinutes={now.minutes}
              onToggle={toggleLog}
              onStart={logStart}
              onClearStart={clearStart}
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
