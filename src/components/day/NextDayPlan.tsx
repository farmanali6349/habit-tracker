"use client";

import { useMemo } from "react";
import CategoryIcon from "../CategoryIcon";
import { addDays, today } from "@/lib/date";
import { isActive } from "@/lib/stats";
import type { Category, Habit } from "@/types";

interface NextDayPlanProps {
  /** The day being planned for (usually the day after the audited one). */
  date: string;
  habits: Habit[];
  categories: Category[];
}

export default function NextDayPlan({
  date,
  habits,
  categories,
}: NextDayPlanProps) {
  const goals = useMemo(
    () => habits.filter((habit) => isActive(habit, date)),
    [habits, date],
  );

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const t = today();
  const label =
    date === t
      ? "Today's goals"
      : date === addDays(t, 1)
        ? "Tomorrow's goals"
        : `Goals for ${new Date(`${date}T00:00:00`).toLocaleDateString()}`;

  if (!goals.length) return null;

  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs tabular-nums text-muted-foreground">
          {goals.length}
        </span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {goals.map((habit) => {
          const category = categoryById.get(habit.categoryId);
          return (
            <li
              key={habit.id}
              className="inline-flex items-center gap-1.5 rounded-full border py-0.5 ps-1.5 pe-2 text-xs"
            >
              {category ? (
                <CategoryIcon
                  name={category.icon}
                  aria-hidden
                  className="size-3.5"
                  style={{ color: category.color }}
                />
              ) : (
                <span className="size-3 rounded-full bg-muted-foreground/40" />
              )}
              <span className="max-w-48 truncate" title={habit.name}>
                {habit.name}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
