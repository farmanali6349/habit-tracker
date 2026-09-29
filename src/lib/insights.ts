import type {
  Category,
  Habit,
  HabitLogs,
  Insight,
  SkipLog,
  SleepGoal,
  SleepLog,
  StartLog,
  TimeTable,
} from "@/types";
import { categoryStats, hourBuckets, planAccuracy, rankRange } from "./analytics";
import { isScheduled } from "./cadence";
import { currentPerfectStreak } from "./calendar";
import { addDays, today } from "./date";
import { cycleStats, formatTime } from "./day";
import { sleepTrend } from "./sleep";
import { habitStats } from "./stats";
import { timingInsights, timingSummaries } from "./timing";

const SLEEP_GOOD_MINUTES = 420;

/** Threshold-based, human-readable takeaways — no machine learning involved. */
export const generateInsights = (
  habits: Habit[],
  categories: Category[],
  logs: HabitLogs,
  sleep: SleepLog,
  timetables: TimeTable[],
  sleepGoal: SleepGoal,
  starts: StartLog,
  skips?: SkipLog,
): Insight[] => {
  const insights: Insight[] = [];
  const t = today();

  const buckets = hourBuckets(habits, logs, addDays(t, -29), t);
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  if (total >= 5) {
    const peak = buckets.reduce((best, bucket) =>
      bucket.count > best.count ? bucket : best,
    );
    if (peak.count > 0) {
      const part =
        peak.hour < 12
          ? "mornings"
          : peak.hour < 17
            ? "afternoons"
            : peak.hour < 21
              ? "evenings"
              : "late nights";
      insights.push({
        id: "peak-time",
        tone: "neutral",
        icon: "⏰",
        title: `You're most consistent in the ${part}`,
        detail: `${peak.count} of your last ${total} check-ins land around ${peak.label}.`,
      });
    }
  }

  let hiDone = 0;
  let hiActive = 0;
  let loDone = 0;
  let loActive = 0;
  let sleepDays = 0;
  for (let i = 0; i < 60; i += 1) {
    const d = addDays(t, -i);
    const stats = cycleStats(sleep[d]);
    if (!stats) continue;
    sleepDays += 1;
    const active = habits.filter(
      (habit) => isScheduled(habit, d) && !skips?.[habit.id]?.[d],
    );
    const done = active.filter((habit) => Boolean(logs[habit.id]?.[d])).length;
    if (stats.asleepMinutes >= SLEEP_GOOD_MINUTES) {
      hiActive += active.length;
      hiDone += done;
    } else {
      loActive += active.length;
      loDone += done;
    }
  }
  if (sleepDays >= 5 && hiActive > 0 && loActive > 0) {
    const hi = Math.round((hiDone / hiActive) * 100);
    const lo = Math.round((loDone / loActive) * 100);
    const diff = hi - lo;
    if (Math.abs(diff) >= 5) {
      insights.push({
        id: "sleep",
        tone: diff > 0 ? "positive" : "warning",
        icon: "😴",
        title:
          diff > 0
            ? "Good sleep is boosting your habits"
            : "Sleep patterns affect productivity",
        detail: `On 7h+ sleep days you complete ${hi}% of habits, versus ${lo}% on shorter nights.`,
      });
    }
  }

  const sleepStats = sleepTrend(sleepGoal, sleep, 30, t);
  const loggedNights = sleepStats.points.filter(
    (point) => point.wakeDelta !== null,
  ).length;
  if (sleepGoal.wake && loggedNights >= 5) {
    if (sleepStats.avgWakeDelta !== null && Math.abs(sleepStats.avgWakeDelta) >= 15) {
      const later = sleepStats.avgWakeDelta > 0;
      insights.push({
        id: "sleep-wake-drift",
        tone: "warning",
        icon: "⏰",
        title: `You're waking ${Math.abs(sleepStats.avgWakeDelta)}m ${
          later ? "later" : "earlier"
        } than planned`,
        detail: `Across ${loggedNights} logged ${loggedNights === 1 ? "night" : "nights"}, your average wake is ${
          later ? "behind" : "ahead of"
        } your ${formatTime(sleepGoal.wake)} ideal.`,
      });
    } else {
      insights.push({
        id: "sleep-wake-consistent",
        tone: "positive",
        icon: "🌅",
        title: `Waking on schedule ${sleepStats.onTimePct}% of nights`,
        detail: `Within 30m of your ${formatTime(sleepGoal.wake)} ideal across ${loggedNights} logged ${
          loggedNights === 1 ? "night" : "nights"
        }.`,
      });
    }
  }

  const cats = categoryStats(habits, categories, logs, addDays(t, -29), t, skips)
    .filter((stat) => stat.active >= 5)
    .sort((a, b) => b.pct - a.pct);
  if (cats.length >= 2) {
    insights.push({
      id: "top-category",
      tone: "positive",
      icon: "🏅",
      title: `${cats[0].category.name} is your strongest category`,
      detail: `${cats[0].pct}% completion across ${cats[0].habits} ${
        cats[0].habits === 1 ? "habit" : "habits"
      } in the last 30 days.`,
    });
    const weakest = cats[cats.length - 1];
    insights.push({
      id: "weak-category",
      tone: "warning",
      icon: "🧩",
      title: `${weakest.category.name} is falling behind`,
      detail: `Only ${weakest.pct}% completion in the last 30 days.`,
    });
  }

  const streak = currentPerfectStreak(habits, logs, skips);
  if (streak >= 3) {
    insights.push({
      id: "perfect-streak",
      tone: "positive",
      icon: "🌟",
      title: `${streak}-day perfect run`,
      detail: "Every active habit completed on each of those days.",
    });
  }

  const yesterday = addDays(t, -1);
  const slipped = habits.find(
    (habit) =>
      isScheduled(habit, yesterday) &&
      !logs[habit.id]?.[yesterday] &&
      !skips?.[habit.id]?.[yesterday] &&
      isScheduled(habit, t) &&
      !logs[habit.id]?.[t],
  );
  if (slipped) {
    insights.push({
      id: "dont-miss-twice",
      tone: "warning",
      icon: "🔁",
      title: `Don't miss ${slipped.name} twice`,
      detail: "You slipped yesterday — doing it today keeps the habit alive.",
    });
  }

  const accuracy = planAccuracy(
    timetables,
    habits,
    categories,
    logs,
    addDays(t, -29),
    t,
    sleep,
    sleepGoal,
  );
  if (accuracy.planned >= 5) {
    const deviation =
      accuracy.avgDeviation === null
        ? ""
        : ` Average deviation ${Math.abs(accuracy.avgDeviation)}m ${
            accuracy.avgDeviation >= 0 ? "late" : "early"
          }.`;
    insights.push({
      id: "plan-accuracy",
      tone: accuracy.onTimePct >= 70 ? "positive" : "warning",
      icon: "🎯",
      title: `${accuracy.onTimePct}% of planned habits started on time`,
      detail: `${accuracy.done}/${accuracy.planned} followed across the last 30 days.${deviation}`,
    });
  }

  const atRisk = rankRange(habits, logs, addDays(t, -13), t, skips)
    .filter((row) => row.a >= 3 && row.p < 50)
    .sort((a, b) => a.p - b.p);
  if (atRisk.length) {
    insights.push({
      id: "habit-at-risk",
      tone: "warning",
      icon: "⚠️",
      title: `${atRisk[0].h.name} needs attention`,
      detail: `Completed just ${atRisk[0].p}% of the last two weeks.`,
    });
  }

  const best = habits
    .map((habit) => ({ habit, stats: habitStats(habit, logs, skips) }))
    .sort((a, b) => b.stats.cur - a.stats.cur)[0];
  if (best && best.stats.cur >= 3) {
    insights.push({
      id: "top-streak",
      tone: "positive",
      icon: "🔥",
      title: `${best.habit.name} is on a ${best.stats.cur}-day streak`,
      detail: "Your longest active streak right now.",
    });
  }

  const timing = timingInsights(
    timingSummaries(habits, logs, starts, timetables, sleep, sleepGoal),
  );

  return [...timing, ...insights].slice(0, 8);
};
