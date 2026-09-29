"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import TimeField from "../TimeField";
import DayStrip from "./DayStrip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cycleStats, formatDuration, type StripMarker } from "@/lib/day";
import { deviationLabel, sleepDeviation } from "@/lib/sleep";
import { cn } from "@/lib/utils";
import type { SleepEntry, SleepGoal } from "@/types";

interface SleepLoggerProps {
  sleep: SleepEntry | undefined;
  markers: StripMarker[];
  onChange: (patch: Partial<SleepEntry>) => void;
  onClear: () => void;
  onSelect?: (habitId: string) => void;
  /** Ideal window; when set, a deviation readout is shown. */
  goal?: SleepGoal;
  /** Wake-time adjustment applied to the day's schedule. */
  shiftMinutes?: number;
}

export default function SleepLogger({
  sleep,
  markers,
  onChange,
  onClear,
  onSelect,
  goal,
  shiftMinutes = 0,
}: SleepLoggerProps) {
  const stats = cycleStats(sleep);
  const hasEntry = Boolean(sleep?.wake || sleep?.bed);
  const deviation = goal ? sleepDeviation(goal, sleep) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your day, hour by hour</CardTitle>
        <CardDescription>
          {stats
            ? `${formatDuration(stats.asleepMinutes)} asleep · ${formatDuration(
                stats.awakeMinutes,
              )} awake`
            : "Set when you woke up and went to sleep to frame the whole day."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="grid gap-2">
            <Label
              htmlFor="sleep-wake"
              className="text-xs text-muted-foreground"
            >
              <SunIcon className="size-3.5" />
              Woke up
            </Label>
            <TimeField
              id="sleep-wake"
              value={sleep?.wake ?? null}
              onChange={(value) => onChange({ wake: value })}
              className="w-32"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sleep-bed" className="text-xs text-muted-foreground">
              <MoonIcon className="size-3.5" />
              Went to sleep
            </Label>
            <TimeField
              id="sleep-bed"
              value={sleep?.bed ?? null}
              onChange={(value) => onChange({ bed: value })}
              className="w-32"
            />
          </div>

          {hasEntry && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>

        {deviation && hasEntry && (
          <div className="flex flex-wrap items-center gap-1.5">
            {deviation.wakeDelta !== null && (
              <Badge
                variant="outline"
                className={cn(
                  "tabular-nums",
                  Math.abs(deviation.wakeDelta) <= 30
                    ? "border-success/40 text-success"
                    : "border-warning/40 text-warning",
                )}
              >
                Woke {deviationLabel(deviation.wakeDelta)}
              </Badge>
            )}
            {deviation.bedDelta !== null && (
              <Badge
                variant="outline"
                className={cn(
                  "tabular-nums",
                  Math.abs(deviation.bedDelta) <= 30
                    ? "border-success/40 text-success"
                    : "text-muted-foreground",
                )}
              >
                Bed {deviationLabel(deviation.bedDelta)}
              </Badge>
            )}
            {deviation.asleepMinutes !== null &&
              deviation.durationDelta !== null && (
                <Badge
                  variant="outline"
                  className={cn(
                    "tabular-nums",
                    deviation.durationDelta >= 0
                      ? "border-success/40 text-success"
                      : "border-warning/40 text-warning",
                  )}
                >
                  Slept {formatDuration(deviation.asleepMinutes)} ·{" "}
                  {deviation.durationDelta >= 0 ? "+" : "−"}
                  {formatDuration(Math.abs(deviation.durationDelta))} vs{" "}
                  {formatDuration(goal!.targetMinutes)}
                </Badge>
              )}
            {shiftMinutes !== 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                Day shifted {shiftMinutes > 0 ? "later" : "earlier"} by{" "}
                {formatDuration(Math.abs(shiftMinutes))}
              </Badge>
            )}
          </div>
        )}

        <DayStrip
          wake={sleep?.wake ?? null}
          bed={sleep?.bed ?? null}
          markers={markers}
          onSelect={onSelect}
        />

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-3 rounded-sm bg-foreground/10 ring-1 ring-foreground/10"
            />
            Sleep
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full bg-success" />
            Check-in
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full border-2 border-destructive bg-destructive/20"
            />
            Missed
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full border-2 border-dashed border-muted-foreground/60"
            />
            Upcoming
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
