"use client";

import { useRef, useState } from "react";
import CategoryIcon from "../CategoryIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MINUTES_PER_DAY,
  formatHour,
  formatTime,
  minutesToTime,
  timeToMinutes,
  type StripMarker,
} from "@/lib/day";
import { cn } from "@/lib/utils";

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const AXIS_TICKS = [0, 6, 12, 18, 24];

const pct = (minutes: number): string =>
  `${(minutes / MINUTES_PER_DAY) * 100}%`;

const dotClass: Record<StripMarker["kind"], string> = {
  checkin: "ring-2 ring-background",
  missed: "border-2 border-destructive bg-destructive/30",
  pending: "border-2 border-dashed border-muted-foreground/60 bg-background",
};

interface DayStripProps {
  wake: string | null;
  bed: string | null;
  markers: StripMarker[];
  /** Minutes past midnight for a "now" line, when the day is today. */
  nowMinutes?: number | null;
  onSelect?: (habitId: string) => void;
  className?: string;
}

/**
 * The 24-hour strip: the sleep window, an hourly grid, and one marker per
 * check-in (or planned-but-undone slot). Every marker is hoverable, focusable
 * and clickable so the whole day can be explored.
 */
export default function DayStrip({
  wake,
  bed,
  markers,
  nowMinutes = null,
  onSelect,
  className,
}: DayStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<number | null>(null);

  const wakeMin = wake ? timeToMinutes(wake) : null;
  const bedMin = bed ? timeToMinutes(bed) : null;

  const sleepSegments: [number, number][] = [];
  if (wakeMin !== null && bedMin !== null) {
    if (wakeMin <= bedMin) {
      if (wakeMin > 0) sleepSegments.push([0, wakeMin]);
      if (bedMin < MINUTES_PER_DAY) sleepSegments.push([bedMin, MINUTES_PER_DAY]);
    } else {
      sleepSegments.push([bedMin, wakeMin]);
    }
  }

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    setCursor(Math.round(ratio * MINUTES_PER_DAY));
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        ref={trackRef}
        onMouseMove={handleMove}
        onMouseLeave={() => setCursor(null)}
        className="relative h-10 overflow-hidden rounded-lg bg-muted/40 ring-1 ring-foreground/10"
      >
        {sleepSegments.map(([from, to]) => (
          <span
            key={`sleep-${from}`}
            aria-hidden
            className="absolute inset-y-0 bg-foreground/10"
            style={{
              left: pct(from),
              width: pct(to - from),
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent, transparent 4px, color-mix(in oklch, var(--foreground) 9%, transparent) 4px, color-mix(in oklch, var(--foreground) 9%, transparent) 8px)",
            }}
          />
        ))}

        {HOUR_TICKS.map((hour) => (
          <span
            key={`tick-${hour}`}
            aria-hidden
            className={cn(
              "absolute inset-y-0 w-px",
              hour % 6 === 0 ? "bg-border" : "bg-border/50",
            )}
            style={{ left: pct(hour) }}
          />
        ))}

        {nowMinutes !== null && (
          <span
            aria-hidden
            className="absolute inset-y-0 z-20 w-px bg-chart-1"
            style={{ left: pct(nowMinutes) }}
          />
        )}

        {cursor !== null && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-20 w-px bg-foreground/50"
            style={{ left: pct(cursor) }}
          >
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 rounded bg-foreground px-1 py-px text-[10px] font-medium tabular-nums text-background">
              {formatTime(minutesToTime(cursor))}
            </span>
          </span>
        )}

        {markers.map((marker, index) => (
          <Tooltip key={marker.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={marker.label}
                onClick={() => onSelect?.(marker.habitId)}
                className={cn(
                  "absolute z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition-transform after:absolute after:-inset-2 after:content-[''] hover:scale-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background motion-reduce:transition-none",
                  dotClass[marker.kind],
                )}
                style={{
                  left: pct(marker.minutes),
                  top: index % 2 === 0 ? "36%" : "68%",
                  ...(marker.kind === "checkin"
                    ? {
                        backgroundColor:
                          marker.category?.color ?? "var(--success)",
                      }
                    : {}),
                }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 font-medium">
                  {marker.category && (
                    <CategoryIcon
                      name={marker.category.icon}
                      aria-hidden
                      className="size-3"
                      style={{ color: marker.category.color }}
                    />
                  )}
                  {marker.habitName}
                </span>
                <span className="tabular-nums text-background/70">
                  {marker.kind === "checkin"
                    ? `Checked in · ${formatTime(minutesToTime(marker.minutes))}`
                    : marker.kind === "missed"
                      ? `Missed · planned ${formatTime(
                          minutesToTime(marker.minutes),
                        )}`
                      : `Upcoming · ${formatTime(
                          minutesToTime(marker.minutes),
                        )}`}
                </span>
                {marker.missed?.reason && (
                  <span className="max-w-56 text-background/70">
                    {marker.missed.reason}
                  </span>
                )}
              </span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div
        aria-hidden
        className="flex justify-between text-[10px] tabular-nums text-muted-foreground"
      >
        {AXIS_TICKS.map((hour) => (
          <span key={hour}>{formatHour(hour)}</span>
        ))}
      </div>
    </div>
  );
}
