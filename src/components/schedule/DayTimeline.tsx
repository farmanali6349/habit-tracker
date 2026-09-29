"use client";

import { useRef } from "react";
import CategoryIcon from "../CategoryIcon";
import SkyBackground from "./SkyBackground";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MINUTES_PER_DAY, formatDuration, formatHour } from "@/lib/day";
import { formatWindowEnd, progressPct } from "@/lib/schedule";
import { SKY_PERIODS } from "@/lib/sky";
import {
  formatSlotTime,
  slotDuration,
  slotEndMinutes,
  slotStartMinutes,
} from "@/lib/timetable";
import { cn } from "@/lib/utils";
import type { Category, Habit, TimeSlot } from "@/types";

const HOUR_PX = 52;
const TOTAL_PX = 24 * HOUR_PX;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SNAP_MINUTES = 15;

interface DayTimelineProps {
  slots: TimeSlot[];
  habits: Habit[];
  categories: Category[];
  /** Minutes past midnight for the "now" line (today only). */
  nowMinutes?: number | null;
  onEditSlot: (slot: TimeSlot) => void;
  /** Called with the snapped start time when empty space is clicked. */
  onAddAt: (startMinutes: number) => void;
}

/**
 * A vertical 24-hour grid of the timetable, set against a sky that reflects the
 * light at each hour. Blocks are positioned by start time and scaled by duration;
 * click a block to edit it, or click open space to add a slot at that time.
 */
export default function DayTimeline({
  slots,
  habits,
  categories,
  nowMinutes = null,
  onEditSlot,
  onAddAt,
}: DayTimelineProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const habitById = new Map(habits.map((habit) => [habit.id, habit]));
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  const handleGridClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return;
    const ratio = (event.clientY - rect.top) / rect.height;
    const snapped =
      Math.round((ratio * MINUTES_PER_DAY) / SNAP_MINUTES) * SNAP_MINUTES;
    onAddAt(Math.max(0, Math.min(MINUTES_PER_DAY - SNAP_MINUTES, snapped)));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div
          aria-hidden
          className="relative w-9 shrink-0"
          style={{ height: TOTAL_PX }}
        >
          {HOURS.map((hour) => (
            <span
              key={hour}
              className="absolute end-0 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
              style={{ top: hour * HOUR_PX }}
            >
              {hour === 0 ? "" : formatHour(hour)}
            </span>
          ))}
        </div>

        <div
          ref={gridRef}
          onClick={handleGridClick}
          className="relative flex-1 cursor-copy overflow-hidden rounded-lg border"
          style={{ height: TOTAL_PX }}
        >
          <SkyBackground />

          {HOURS.map((hour) => (
            <span
              key={hour}
              aria-hidden
              className={cn(
                "absolute inset-x-0 border-t",
                hour % 6 === 0 ? "border-foreground/20" : "border-foreground/10",
              )}
              style={{ top: hour * HOUR_PX }}
            />
          ))}

          {nowMinutes !== null && (
            <span
              aria-hidden
              className="absolute inset-x-0 z-20 border-t-2 border-chart-1"
              style={{ top: (nowMinutes / MINUTES_PER_DAY) * TOTAL_PX }}
            >
              <span className="absolute -top-2 end-1 rounded bg-chart-1 px-1 text-[10px] font-medium text-background">
                Now
              </span>
            </span>
          )}

          {slots.map((slot) => {
            const start = slotStartMinutes(slot);
            const end = slotEndMinutes(slot);
            if (end <= start) return null;

            const habit = slot.habitId ? habitById.get(slot.habitId) : undefined;
            const category = habit
              ? categoryById.get(habit.categoryId)
              : undefined;
            const color = category?.color;
            const top = (start / MINUTES_PER_DAY) * TOTAL_PX;
            const height = Math.max(
              20,
              ((end - start) / MINUTES_PER_DAY) * TOTAL_PX,
            );
            const range = formatSlotTime(slot);
            const duration = formatDuration(slotDuration(slot));
            const isNow =
              nowMinutes !== null && nowMinutes >= start && nowMinutes < end;
            const isPast = nowMinutes !== null && end <= nowMinutes;
            const label = habit
              ? `${habit.name}, ${range}, ${duration}. Click to edit.`
              : `Free, ${range}, ${duration}. Click to edit.`;

            return (
              <Tooltip key={slot.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditSlot(slot);
                    }}
                    aria-label={label}
                    className={cn(
                      "absolute inset-x-1 overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm outline-none transition-[filter,box-shadow,opacity] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring",
                      !habit &&
                        "border-dashed bg-card/85 text-muted-foreground",
                      isNow && "z-10 ring-2 ring-chart-1",
                      isPast && "opacity-60",
                    )}
                    style={{
                      top,
                      height,
                      ...(habit
                        ? {
                            backgroundColor: `color-mix(in oklch, ${
                              color ?? "var(--success)"
                            } 24%, var(--card))`,
                            borderColor: `color-mix(in oklch, ${
                              color ?? "var(--success)"
                            } 45%, transparent)`,
                          }
                        : {}),
                      ...(isNow
                        ? {
                            boxShadow:
                              "0 0 18px color-mix(in oklch, var(--chart-1) 45%, transparent)",
                          }
                        : {}),
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      {category && (
                        <CategoryIcon
                          name={category.icon}
                          aria-hidden
                          className="size-3 shrink-0"
                          style={{ color: category.color }}
                        />
                      )}
                      <span
                        className="truncate font-medium"
                        style={color ? { color } : undefined}
                      >
                        {habit ? habit.name : "Free"}
                      </span>
                    </span>
                    {height > 34 && (
                      <span className="mt-0.5 block truncate text-[10px] tabular-nums text-muted-foreground">
                        {range} · {duration}
                        {isNow
                          ? ` · ends ${formatWindowEnd({ start, end })}`
                          : ""}
                      </span>
                    )}
                    {isNow && nowMinutes !== null && (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-1 bg-foreground/10"
                      >
                        <span
                          className="block h-full"
                          style={{
                            width: `${progressPct(nowMinutes, {
                              start,
                              end,
                            })}%`,
                            backgroundColor: "var(--chart-1)",
                          }}
                        />
                      </span>
                    )}
                  </button>
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
      </div>

      <ul
        aria-hidden
        className="flex flex-wrap items-center gap-x-3 gap-y-1 ps-11 text-[10px] text-muted-foreground"
      >
        {SKY_PERIODS.map((period) => (
          <li key={period.label} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: period.color }}
            />
            {period.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
