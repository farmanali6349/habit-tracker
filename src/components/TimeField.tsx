"use client";

import { ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTime, minutesToTime } from "@/lib/day";
import { cn } from "@/lib/utils";

interface TimeFieldProps {
  id?: string;
  /** Local "HH:MM" (24-hour), or null when unset. */
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const BASE_MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * shadcn-styled time picker: a popover with hour / minute / AM-PM selects.
 * Stores a 24-hour "HH:MM" string so it stays consistent with the rest of the app.
 */
export default function TimeField({
  id,
  value,
  onChange,
  placeholder = "Set time",
  className,
  disabled,
}: TimeFieldProps) {
  const source = value ?? "08:00";
  const [rawHour, rawMinute] = source.split(":");
  const hour24 = Number(rawHour);
  const minute = Number(rawMinute);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  // 5-minute steps, plus the current minute if it isn't on the grid.
  const minutes = BASE_MINUTES.includes(minute)
    ? BASE_MINUTES
    : [...BASE_MINUTES, minute].sort((a, b) => a - b);

  const commit = (nextHour12: number, nextMinute: number, nextPeriod: string) => {
    const h24 = (nextHour12 % 12) + (nextPeriod === "PM" ? 12 : 0);
    onChange(minutesToTime(h24 * 60 + nextMinute));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start font-normal tabular-nums",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <ClockIcon data-icon="inline-start" />
          {value ? formatTime(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="flex items-center gap-1.5">
          <Select
            value={String(hour12)}
            onValueChange={(next) => commit(Number(next), minute, period)}
          >
            <SelectTrigger size="sm" aria-label="Hour" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((hour) => (
                <SelectItem key={hour} value={String(hour)}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span aria-hidden className="text-muted-foreground">
            :
          </span>

          <Select
            value={String(minute)}
            onValueChange={(next) => commit(hour12, Number(next), period)}
          >
            <SelectTrigger size="sm" aria-label="Minute" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((minuteValue) => (
                <SelectItem key={minuteValue} value={String(minuteValue)}>
                  {pad(minuteValue)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={period}
            onValueChange={(next) => commit(hour12, minute, next)}
          >
            <SelectTrigger size="sm" aria-label="AM or PM" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
