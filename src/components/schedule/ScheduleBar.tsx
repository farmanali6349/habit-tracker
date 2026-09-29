"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MINUTES_PER_DAY, formatDuration, formatHour } from "@/lib/day";
import {
  formatSlotTime,
  slotDuration,
  slotEndMinutes,
  slotStartMinutes,
} from "@/lib/timetable";
import { cn } from "@/lib/utils";
import type { Category, Habit, TimeSlot } from "@/types";

interface ScheduleBarProps {
  slots: TimeSlot[];
  habits: Habit[];
  categories: Category[];
}

export default function ScheduleBar({
  slots,
  habits,
  categories,
}: ScheduleBarProps) {
  const habitById = new Map(habits.map((habit) => [habit.id, habit]));
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  return (
    <div className="space-y-1.5">
      <div
        role="group"
        aria-label="Daily schedule"
        className="relative h-8 overflow-hidden rounded-lg bg-muted/60"
      >
        {slots.map((slot) => {
          const start = slotStartMinutes(slot);
          const end = slotEndMinutes(slot);
          if (end <= start) return null;

          const habit = slot.habitId ? habitById.get(slot.habitId) : undefined;
          const category = habit
            ? categoryById.get(habit.categoryId)
            : undefined;
          const color = category?.color;
          const duration = formatDuration(slotDuration(slot));
          const range = formatSlotTime(slot);
          const label = habit
            ? `${habit.name}, ${range}, ${duration}`
            : `Free time, ${range}, ${duration}`;

          return (
            <Tooltip key={slot.id}>
              <TooltipTrigger asChild>
                <span
                  tabIndex={0}
                  aria-label={label}
                  className={cn(
                    "absolute inset-y-0 border-e border-background/50 outline-none transition-[box-shadow,filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    !habit && "bg-foreground/10",
                    habit && !color && "bg-foreground/30",
                  )}
                  style={{
                    left: `${(start / MINUTES_PER_DAY) * 100}%`,
                    width: `${((end - start) / MINUTES_PER_DAY) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent className="block max-w-56">
                <div className="space-y-0.5">
                  <div className="font-medium">
                    {habit ? habit.name : "Free time"}
                  </div>
                  <div className="text-background/70">
                    {range} · {duration}
                  </div>
                  {category ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="size-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  ) : (
                    !habit && (
                      <div className="text-background/70">Empty slot</div>
                    )
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div
        aria-hidden
        className="flex justify-between text-[10px] tabular-nums text-muted-foreground"
      >
        {[0, 6, 12, 18, 24].map((hour) => (
          <span key={hour}>{formatHour(hour)}</span>
        ))}
      </div>
    </div>
  );
}
