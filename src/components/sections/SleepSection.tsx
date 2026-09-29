"use client";

import { useMemo, useState } from "react";
import { MoonIcon, SunriseIcon } from "lucide-react";
import SleepLogger from "@/components/day/SleepLogger";
import ScheduleBar from "@/components/schedule/ScheduleBar";
import { useApp } from "@/components/shell/AppProvider";
import TimeField from "@/components/TimeField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { today } from "@/lib/date";
import { buildDayAudit, buildDayStrip, formatDuration } from "@/lib/day";
import {
  deviationLabel,
  idealDurationMinutes,
  sleepTrend,
} from "@/lib/sleep";
import { buildPlanComparison } from "@/lib/timetable";
import { cn } from "@/lib/utils";

const TARGET_DELTA_TOLERANCE = 15;

const dateLabel = (date: string): string =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export default function SleepSection() {
  const {
    state,
    setSleep,
    setSleepGoal,
    sleepGoal,
    todayShift,
  } = useApp();
  const { habits, categories, logs, sleep, timetables, missed, skips } = state;

  const t = today();
  const entry = sleep[t];

  const [targetText, setTargetText] = useState(String(sleepGoal.targetMinutes / 60));
  const [trendDays, setTrendDays] = useState("7");

  const audit = useMemo(
    () => buildDayAudit(t, habits, categories, logs, entry, missed, skips),
    [t, habits, categories, logs, entry, missed, skips],
  );

  const comparison = useMemo(
    () => buildPlanComparison(t, timetables, habits, categories, logs, todayShift),
    [t, timetables, habits, categories, logs, todayShift],
  );

  const strip = useMemo(
    () => buildDayStrip(audit, comparison),
    [audit, comparison],
  );

  const ideal = idealDurationMinutes(sleepGoal);
  const mismatch =
    ideal !== null &&
    Math.abs(ideal - sleepGoal.targetMinutes) > TARGET_DELTA_TOLERANCE;

  const days = Number(trendDays);
  const trend = useMemo(
    () => sleepTrend(sleepGoal, sleep, days, t),
    [sleepGoal, sleep, days, t],
  );

  const updateTarget = (raw: string) => {
    setTargetText(raw);
    const hours = Number(raw);
    if (Number.isFinite(hours) && hours > 0) {
      setSleepGoal({ targetMinutes: Math.round(hours * 60) });
    }
  };

  const trendTiles = [
    {
      label: "Avg wake",
      value:
        trend.avgWakeDelta === null ? "—" : deviationLabel(trend.avgWakeDelta),
    },
    {
      label: "Avg bedtime",
      value:
        trend.avgBedDelta === null ? "—" : deviationLabel(trend.avgBedDelta),
    },
    {
      label: "Avg sleep",
      value:
        trend.avgAsleep === null ? "—" : formatDuration(trend.avgAsleep),
    },
    { label: "On time", value: `${trend.onTimePct}%` },
  ];

  const loggedNights = trend.points.filter(
    (point) => point.wakeDelta !== null || point.asleepMinutes !== null,
  );

  return (
    <div className="space-y-5">
      <div className="space-y-0.5">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold">
          <MoonIcon className="size-5 text-chart-1" />
          Sleep
        </h2>
        <p className="text-sm text-muted-foreground">
          Set the sleep you&apos;re aiming for; your day&apos;s schedule is
          anchored to your ideal wake time and slides with it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ideal sleep schedule</CardTitle>
          <CardDescription>
            Your timetable is authored around this wake time. Wake up earlier or
            later and the whole day adjusts by the same amount.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="goal-wake" className="text-xs text-muted-foreground">
                <SunriseIcon className="size-3.5" />
                Ideal wake up
              </Label>
              <TimeField
                id="goal-wake"
                value={sleepGoal.wake}
                onChange={(value) => setSleepGoal({ wake: value })}
                className="w-32"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="goal-bed" className="text-xs text-muted-foreground">
                <MoonIcon className="size-3.5" />
                Ideal bedtime
              </Label>
              <TimeField
                id="goal-bed"
                value={sleepGoal.bed}
                onChange={(value) => setSleepGoal({ bed: value })}
                className="w-32"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="goal-target" className="text-xs text-muted-foreground">
                Target sleep
              </Label>
              <div className="flex items-center gap-1.5">
                <Input
                  id="goal-target"
                  type="number"
                  min={1}
                  max={12}
                  step={0.5}
                  inputMode="decimal"
                  className="w-20"
                  value={targetText}
                  onChange={(e) => updateTarget(e.target.value)}
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </div>

            {(sleepGoal.wake || sleepGoal.bed) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSleepGoal({ wake: null, bed: null })}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {ideal !== null && (
              <Badge variant="outline" className="tabular-nums">
                Ideal window {formatDuration(ideal)}
              </Badge>
            )}
            {mismatch && (
              <Badge
                variant="outline"
                className="border-warning/40 text-warning tabular-nums"
              >
                Doesn&apos;t match your{" "}
                {formatDuration(sleepGoal.targetMinutes)} target
              </Badge>
            )}
            {ideal !== null && !mismatch && (
              <Badge
                variant="outline"
                className="border-success/40 text-success tabular-nums"
              >
                On target ({formatDuration(sleepGoal.targetMinutes)})
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <SleepLogger
        sleep={entry}
        markers={strip.markers}
        onChange={(patch) => setSleep(t, patch)}
        onClear={() => setSleep(t, { wake: null, bed: null })}
        goal={sleepGoal}
        shiftMinutes={todayShift}
      />

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s adjusted plan</CardTitle>
          <CardDescription>
            {comparison.timetable
              ? todayShift === 0
                ? `${comparison.timetable.name} at ideal times — log your wake-up to slide the day.`
                : `${comparison.timetable.name} shifted ${formatDuration(
                    Math.abs(todayShift),
                  )} ${todayShift > 0 ? "later" : "earlier"} to match your wake-up.`
              : "No timetable covers today yet — build one under Timetable."}
          </CardDescription>
        </CardHeader>
        {comparison.timetable && (
          <CardContent>
            <ScheduleBar
              slots={comparison.timetable.slots}
              habits={habits}
              categories={categories}
            />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep history</CardTitle>
          <CardDescription>
            How your last nights compare with the ideal window.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={trendDays}
            onValueChange={(value) => {
              if (value) setTrendDays(value);
            }}
          >
            <ToggleGroupItem value="7">7 nights</ToggleGroupItem>
            <ToggleGroupItem value="30">30 nights</ToggleGroupItem>
          </ToggleGroup>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {trendTiles.map((tile) => (
              <div key={tile.label}>
                <div className="text-xs text-muted-foreground">{tile.label}</div>
                <div className="font-heading text-lg font-semibold tabular-nums">
                  {tile.value}
                </div>
              </div>
            ))}
          </div>

          {loggedNights.length ? (
            <ul className="divide-y">
              {[...loggedNights].reverse().map((point) => (
                <li
                  key={point.d}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm"
                >
                  <span className="w-40 shrink-0 text-xs text-muted-foreground">
                    {dateLabel(point.d)}
                  </span>
                  {point.wakeDelta !== null ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "tabular-nums",
                        Math.abs(point.wakeDelta) <= 30
                          ? "border-success/40 text-success"
                          : "border-warning/40 text-warning",
                      )}
                    >
                      Woke {deviationLabel(point.wakeDelta)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No wake logged
                    </span>
                  )}
                  {point.bedDelta !== null && (
                    <Badge variant="outline" className="text-muted-foreground tabular-nums">
                      Bed {deviationLabel(point.bedDelta)}
                    </Badge>
                  )}
                  {point.asleepMinutes !== null && (
                    <span className="ms-auto text-xs tabular-nums text-muted-foreground">
                      {formatDuration(point.asleepMinutes)} asleep
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing logged yet — add your wake and sleep times above to start
              tracking the deviation.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
