"use client";

import CalendarDayCell from "./CalendarDayCell";
import { WEEKDAYS } from "@/lib/calendar";
import type { CalendarDay } from "@/types";

interface MonthGridProps {
  days: CalendarDay[];
  selection: string[];
  onSelect: (date: string) => void;
}

export default function MonthGrid({ days, selection, onSelect }: MonthGridProps) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[11px] font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <CalendarDayCell
            key={day.date}
            day={day}
            selected={selection.includes(day.date)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
