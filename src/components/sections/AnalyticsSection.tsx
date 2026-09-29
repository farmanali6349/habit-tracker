"use client";

import { useMemo, useState } from "react";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import CategoryBreakdownChart from "@/components/analytics/CategoryBreakdownChart";
import CategoryInsightsCard from "@/components/analytics/CategoryInsightsCard";
import CompletionTrendChart from "@/components/analytics/CompletionTrendChart";
import HourlyProductivityChart from "@/components/analytics/HourlyProductivityChart";
import InsightsList from "@/components/analytics/InsightsList";
import MissedReasonsCard from "@/components/analytics/MissedReasonsCard";
import MissedVsCompletedChart from "@/components/analytics/MissedVsCompletedChart";
import PeriodCompareCard from "@/components/analytics/PeriodCompareCard";
import PlanAccuracyCard from "@/components/analytics/PlanAccuracyCard";
import WeekdayTrendChart from "@/components/analytics/WeekdayTrendChart";
import YearReviewCard from "@/components/analytics/YearReviewCard";
import BadgeWall from "@/components/BadgeWall";
import ProgressRowList from "@/components/ProgressRowList";
import StatTile from "@/components/StatTile";
import { useApp } from "@/components/shell/AppProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  categoryStats,
  heatmapData,
  hourBuckets,
  missedVsCompleted,
  monthlySeries,
  periodDelta,
  planAccuracy,
  rankRange,
  weeklySeries,
  weekdayStat,
  yearSummary,
} from "@/lib/analytics";
import { currentPerfectStreak } from "@/lib/calendar";
import { addDays, diffDays, today } from "@/lib/date";
import { generateInsights } from "@/lib/insights";
import { buildMissedRollup } from "@/lib/missed";
import { overallCompletion } from "@/lib/stats";

const PERIODS = [
  { value: "7", label: "Week" },
  { value: "30", label: "Month" },
  { value: "90", label: "Quarter" },
  { value: "y", label: "Year" },
] as const;

const HEATMAP_CAP = 182;

export default function AnalyticsSection() {
  const { state, derived } = useApp();
  const { habits, categories, logs, sleep, timetables, missed, skips, sleepGoal, starts } =
    state;
  const { stats, badges } = derived;

  const [periodValue, setPeriodValue] = useState<string>("30");

  const view = useMemo(() => {
    const t = today();
    const yearStart = `${t.slice(0, 4)}-01-01`;
    const span =
      periodValue === "y" ? diffDays(yearStart, t) + 1 : Number(periodValue);
    const from = addDays(t, -(span - 1));

    return {
      t,
      span,
      ranked: rankRange(habits, logs, from, t, skips).sort((a, b) => b.p - a.p),
      hours: hourBuckets(habits, logs, from, t),
      weekdays: weekdayStat(habits, logs, from, t, skips),
      stacks: missedVsCompleted(habits, logs, from, t, skips),
      delta: periodDelta(habits, logs, span, skips),
      weeks: weeklySeries(habits, logs, 8, skips),
      months: monthlySeries(habits, logs, 6, skips),
      cats: categoryStats(habits, categories, logs, from, t, skips).sort(
        (a, b) => b.pct - a.pct,
      ),
      accuracy: planAccuracy(timetables, habits, categories, logs, from, t, sleep, sleepGoal),
      heat: heatmapData(habits, logs, Math.min(span, HEATMAP_CAP), skips),
      year: yearSummary(habits, categories, logs, t.slice(0, 4), skips),
    };
  }, [habits, categories, logs, timetables, skips, sleep, sleepGoal, periodValue]);

  const insights = useMemo(
    () =>
      generateInsights(
        habits,
        categories,
        logs,
        sleep,
        timetables,
        sleepGoal,
        starts,
        skips,
      ),
    [habits, categories, logs, sleep, timetables, sleepGoal, starts, skips],
  );

  const perfectStreak = useMemo(
    () => currentPerfectStreak(habits, logs, skips),
    [habits, logs, skips],
  );

  const missedRollup = useMemo(
    () =>
      buildMissedRollup(habits, categories, logs, missed, { windowDays: 90 }, skips),
    [habits, categories, logs, missed, skips],
  );

  const trendIsYearly = view.span >= 180;
  const trendData = trendIsYearly ? view.months : view.weeks;

  const tiles = [
    { label: "Daily", value: `${overallCompletion(habits, logs, 1, skips)}%` },
    { label: "Weekly", value: `${overallCompletion(habits, logs, 7, skips)}%` },
    { label: "Monthly", value: `${overallCompletion(habits, logs, 30, skips)}%` },
    { label: "Period consistency", value: `${view.delta.current}%` },
    { label: "Perfect streak", value: `${perfectStreak}d` },
  ];

  const periodLabel =
    PERIODS.find((p) => p.value === periodValue)?.label.toLowerCase() ?? "period";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={periodValue}
          onValueChange={(value) => {
            if (value) setPeriodValue(value);
          }}
        >
          {PERIODS.map((period) => (
            <ToggleGroupItem key={period.value} value={period.value}>
              {period.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          Showing the last {view.span} days.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <StatTile key={tile.label} label={tile.label} value={tile.value} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>
            What your data says about when and how you show up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InsightsList insights={insights} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Versus the previous {periodLabel}</CardTitle>
          <CardDescription>
            Completion rate compared with the period before it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PeriodCompareCard delta={view.delta} label={periodLabel} />
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {trendIsYearly ? "Monthly trend" : "Weekly trend"}
            </CardTitle>
            <CardDescription>
              Completion rate per {trendIsYearly ? "month" : "week"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompletionTrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missed vs completed</CardTitle>
            <CardDescription>
              Habits completed against those missed, last 60 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MissedVsCompletedChart data={view.stacks.slice(-60)} />
          </CardContent>
        </Card>
      </div>

      <MissedReasonsCard rollup={missedRollup} />

      <Card>
        <CardHeader>
          <CardTitle>Daily activity</CardTitle>
          <CardDescription>
            A heatmap of daily completion over the selected period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap data={view.heat} />
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Peak productivity hours</CardTitle>
            <CardDescription>When you check habits off.</CardDescription>
          </CardHeader>
          <CardContent>
            <HourlyProductivityChart data={view.hours} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By weekday</CardTitle>
            <CardDescription>Which days you perform best.</CardDescription>
          </CardHeader>
          <CardContent>
            <WeekdayTrendChart data={view.weekdays} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planned vs actual</CardTitle>
          <CardDescription>
            How closely your timetable matched reality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanAccuracyCard accuracy={view.accuracy} />
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Check-ins by category</CardTitle>
            <CardDescription>Where your effort goes.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart data={view.cats} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category performance</CardTitle>
            <CardDescription>Completion rate per category.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryInsightsCard data={view.cats} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Strongest</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressRowList rows={view.ranked.slice(0, 3)} tone="success" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressRowList
              rows={[...view.ranked].reverse().slice(0, 3)}
              tone="destructive"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Streak tracker</CardTitle>
          <CardDescription>
            Current streak against each habit&apos;s best.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {habits.map((habit) => {
            const s = stats[habit.id];
            const pct = Math.min(
              100,
              Math.round((s.cur / Math.max(1, s.best)) * 100),
            );
            return (
              <div key={habit.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate" title={habit.name}>
                  {habit.name}
                </span>
                <Progress
                  value={pct}
                  aria-label={`${habit.name}: ${s.cur} of ${s.best} day streak`}
                  className="h-1.5 w-24 [&>[data-slot=progress-indicator]]:bg-warning"
                />
                <span className="w-14 text-end text-xs tabular-nums text-muted-foreground">
                  {s.cur}/{s.best}d
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>
            {badges.filter((b) => b.earned).length} of {badges.length} earned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BadgeWall badges={badges} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{view.t.slice(0, 4)} year in review</CardTitle>
          <CardDescription>
            Standings for the year so far, final on Dec 31.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <YearReviewCard summary={view.year} />
        </CardContent>
      </Card>
    </div>
  );
}
