"use client";

import { useMemo } from "react";
import CategoryIcon from "../CategoryIcon";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDuration, type DayAudit } from "@/lib/day";
import { cn } from "@/lib/utils";

const RING = 124;
const STROKE = 11;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DayHeroProps {
  audit: DayAudit;
  asleepMinutes: number | null;
  className?: string;
}

interface CategorySlice {
  key: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  done: number;
}

/**
 * The day scorecard: a completion ring, a segmented done / missed / pending bar
 * and a per-category read of where the day went.
 */
export default function DayHero({
  audit,
  asleepMinutes,
  className,
}: DayHeroProps) {
  const { done, activeCount, missed, pending } = audit;
  const pct = activeCount ? Math.round((done / activeCount) * 100) : 0;

  const slices = useMemo<CategorySlice[]>(() => {
    const map = new Map<string, CategorySlice>();
    for (const entry of audit.entries) {
      if (!entry.habit) continue;
      const category = entry.category;
      const key = category?.id ?? "none";
      const slice = map.get(key) ?? {
        key,
        name: category?.name ?? "Uncategorised",
        color: category?.color ?? "var(--muted-foreground)",
        icon: category?.icon ?? "circle",
        total: 0,
        done: 0,
      };
      slice.total += 1;
      if (entry.kind === "checkin") slice.done += 1;
      map.set(key, slice);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [audit.entries]);

  const segments = [
    { key: "done", label: "Completed", value: done, className: "bg-success" },
    {
      key: "missed",
      label: "Missed",
      value: missed,
      className: "bg-destructive",
    },
    {
      key: "pending",
      label: "Pending",
      value: pending,
      className: "bg-muted-foreground/40",
    },
  ].filter((segment) => segment.value > 0);

  const tiles = [
    { label: "Completed", value: `${done}/${activeCount}` },
    { label: "Missed", value: String(missed) },
    { label: "Pending", value: String(pending) },
    {
      label: "Asleep",
      value: asleepMinutes === null ? "—" : formatDuration(asleepMinutes),
    },
  ];

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          className="relative mx-auto shrink-0"
          style={{ width: RING, height: RING }}
        >
          <svg
            width={RING}
            height={RING}
            viewBox={`0 0 ${RING} ${RING}`}
            className="-rotate-90"
            role="img"
            aria-label={`${pct}% of the day's habits completed`}
          >
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={STROKE}
            />
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--success)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - pct / 100)}
              className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-2xl font-semibold tabular-nums">
              {done}
              <span className="text-muted-foreground">/{activeCount}</span>
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {pct}% done
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-heading text-sm font-medium">Day scorecard</p>
            <p className="text-xs text-muted-foreground">
              {activeCount
                ? `${done} done · ${missed} missed · ${pending} still open`
                : "No habits were scheduled for this day."}
            </p>
          </div>

          {activeCount > 0 && (
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              {segments.map((segment) => (
                <Tooltip key={segment.key}>
                  <TooltipTrigger asChild>
                    <span
                      tabIndex={0}
                      aria-label={`${segment.label}: ${segment.value}`}
                      className={cn(
                        "h-full outline-none first:rounded-s-full last:rounded-e-full focus-visible:ring-2 focus-visible:ring-ring",
                        segment.className,
                      )}
                      style={{ width: `${(segment.value / activeCount) * 100}%` }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {segment.label}: {segment.value}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          {slices.length > 0 && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
              {slices.map((slice) => (
                <li
                  key={slice.key}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <CategoryIcon
                    name={slice.icon}
                    aria-hidden
                    className="size-3.5"
                    style={{ color: slice.color }}
                  />
                  <span className="text-foreground">{slice.name}</span>
                  <span className="tabular-nums">
                    {slice.done}/{slice.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-1 sm:text-end">
          {tiles.map((tile) => (
            <div key={tile.label}>
              <dt className="text-xs text-muted-foreground">{tile.label}</dt>
              <dd className="font-heading text-lg font-semibold tabular-nums">
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
