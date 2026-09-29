"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRightIcon, PlusIcon, SparklesIcon } from "lucide-react";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import InsightsList from "@/components/analytics/InsightsList";
import NowCard from "@/components/dashboard/NowCard";
import PlanSnapshotCard from "@/components/dashboard/PlanSnapshotCard";
import RecoveryCard from "@/components/dashboard/RecoveryCard";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import TodayProgressCard from "@/components/dashboard/TodayProgressCard";
import TodayTasksCard from "@/components/dashboard/TodayTasksCard";
import UpcomingGoalsCard from "@/components/dashboard/UpcomingGoalsCard";
import WeeklyReviewCard from "@/components/dashboard/WeeklyReviewCard";
import FollowUpsCard from "@/components/day/FollowUpsCard";
import SleepLogger from "@/components/day/SleepLogger";
import IdentityCard from "@/components/dashboard/IdentityCard";
import { useApp } from "@/components/shell/AppProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNow } from "@/hooks/useNow";
import { heatmapData } from "@/lib/analytics";
import { addDays, today } from "@/lib/date";
import { buildDayAudit, buildDayStrip } from "@/lib/day";
import { generateInsights } from "@/lib/insights";
import { buildPlanComparison } from "@/lib/timetable";

const HEATMAP_DAYS = 8 * 7;

const greeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function DashboardSection() {
  const { state, derived, toggleLog, setSleep, sleepGoal, todayShift } = useApp();
  const { habits, categories, logs, sleep, timetables, missed, skips, identities } =
    state;
  const { badges, feed, active, doneToday, todayPct, topStreak } = derived;
  const hasHistory = Object.keys(logs).length > 0 || timetables.length > 0;
  const now = useNow();

  const t = today();
  const entry = sleep[t];

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

  const heat = useMemo(
    () => heatmapData(habits, logs, HEATMAP_DAYS, skips),
    [habits, logs, skips],
  );

  const insights = useMemo(
    () =>
      generateInsights(
        habits,
        categories,
        logs,
        sleep,
        timetables,
        sleepGoal,
        skips,
      ),
    [habits, categories, logs, sleep, timetables, sleepGoal, skips],
  );

  const earned = badges.filter((badge) => badge.earned).length;

  return (
    <div className="space-y-5">
      <div className="space-y-0.5">
        <h2 className="font-heading text-xl font-semibold">{greeting()}</h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {!hasHistory && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed bg-muted/30 p-4">
          <SparklesIcon className="size-4 shrink-0 text-muted-foreground" />
          <p className="me-auto text-sm text-muted-foreground">
            You&apos;re starting with a clean slate. Create your first habit and
            log a check-in to bring these charts and panels to life.
          </p>
          <Button size="sm" asChild>
            <Link href="/habits">
              <PlusIcon data-icon="inline-start" />
              Add a habit
            </Link>
          </Button>
        </div>
      )}

      <NowCard
        now={now}
        habits={habits}
        categories={categories}
        logs={logs}
        timetables={timetables}
        shiftMinutes={todayShift}
        onToggle={toggleLog}
      />

      <RecoveryCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TodayProgressCard
          percent={todayPct}
          done={doneToday}
          total={active.length}
          streak={topStreak}
          earnedBadges={earned}
          totalBadges={badges.length}
        />
        <TodayTasksCard
          habits={active}
          categories={categories}
          logs={logs}
          timetables={timetables}
          now={now}
          shiftMinutes={todayShift}
          onToggle={toggleLog}
        />
        <UpcomingGoalsCard habits={habits} categories={categories} />
      </div>

      <SleepLogger
        sleep={entry}
        markers={strip.markers}
        onChange={(patch) => setSleep(t, patch)}
        onClear={() => setSleep(t, { wake: null, bed: null })}
        goal={sleepGoal}
        shiftMinutes={todayShift}
      />

      <FollowUpsCard fromDate={addDays(t, -1)} />

      <IdentityCard identities={identities} habits={habits} logs={logs} />

      <WeeklyReviewCard />

      <div className="grid gap-4 lg:grid-cols-2">
        <PlanSnapshotCard
          comparison={comparison}
          habits={habits}
          categories={categories}
        />

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Last 8 weeks</CardTitle>
            <CardDescription>Daily habit completion</CardDescription>
            <CardAction>
              <Link
                href="/calendar"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Calendar
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="flex-1">
            <ActivityHeatmap data={heat} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Insights</CardTitle>
            <CardDescription>Patterns worth acting on</CardDescription>
            <CardAction>
              <Link
                href="/analytics"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Analytics
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="flex-1">
            <InsightsList insights={insights} />
          </CardContent>
        </Card>

        <RecentActivityCard feed={feed} />
      </div>
    </div>
  );
}
