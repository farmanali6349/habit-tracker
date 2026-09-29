"use client";

import { CheckIcon, RepeatIcon } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import { useApp } from "@/components/shell/AppProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isScheduled, isSkipped } from "@/lib/cadence";
import { addDays, today } from "@/lib/date";

/**
 * Atomic Habits' "never miss twice": if a habit was missed yesterday and is due
 * again today, surface a one-tap recovery instead of letting the slip become a
 * streak-break.
 */
export default function RecoveryCard() {
  const { state, toggleLog } = useApp();
  const { habits, categories, logs, skips } = state;

  const t = today();
  const yesterday = addDays(t, -1);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const slipping = habits.filter(
    (habit) =>
      isScheduled(habit, yesterday) &&
      !logs[habit.id]?.[yesterday] &&
      !isSkipped(skips, habit.id, yesterday) &&
      isScheduled(habit, t) &&
      !logs[habit.id]?.[t],
  );

  if (!slipping.length) return null;

  return (
    <Card className="border-warning/40">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <RepeatIcon className="size-4 text-warning" />
          <div>
            <div className="font-heading text-sm font-medium">
              Don&apos;t miss twice
            </div>
            <div className="text-xs text-muted-foreground">
              Missed yesterday — do it today to keep the habit alive.
            </div>
          </div>
        </div>

        <ul className="space-y-1.5">
          {slipping.map((habit) => {
            const category = categoryById.get(habit.categoryId);
            return (
              <li
                key={habit.id}
                className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-2.5 py-1.5"
              >
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-md"
                  style={{
                    color: category?.color ?? "var(--muted-foreground)",
                    backgroundColor: category
                      ? `color-mix(in oklch, ${category.color} 14%, transparent)`
                      : "var(--muted)",
                  }}
                >
                  {category && <CategoryIcon name={category.icon} className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {habit.name}
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => toggleLog(habit.id, t)}
                >
                  <CheckIcon data-icon="inline-start" />
                  Do it today
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
