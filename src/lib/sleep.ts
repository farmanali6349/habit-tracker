import type {
  SleepDeviation,
  SleepEntry,
  SleepGoal,
  SleepTrend,
  SleepTrendPoint,
  TimeSlot,
} from "@/types";
import { addDays, today } from "./date";
import { MINUTES_PER_DAY, cycleStats, minutesToTime, timeToMinutes } from "./day";

/** Default target: 7 hours. */
export const DEFAULT_SLEEP_TARGET_MINUTES = 420;

/** Nights within this many minutes of the ideal wake count as "on time". */
const ON_TIME_MINUTES = 30;

/** Wraps a raw minute delta into [-720, 720) so 23:30 vs 00:15 reads as +45. */
export const signedMinutes = (raw: number): number => {
  const wrapped = ((raw % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return wrapped >= MINUTES_PER_DAY / 2 ? wrapped - MINUTES_PER_DAY : wrapped;
};

/** Minutes from ideal bedtime to ideal wake, or null when either is unset. */
export const idealDurationMinutes = (goal: SleepGoal): number | null => {
  if (!goal.wake || !goal.bed) return null;
  const wake = timeToMinutes(goal.wake);
  const bed = timeToMinutes(goal.bed);
  return (wake - bed + MINUTES_PER_DAY) % MINUTES_PER_DAY || MINUTES_PER_DAY;
};

/**
 * How far the whole day's schedule should slide for a date: the offset between
 * the actual and ideal wake times. Zero when the ideal wake is unset or the day
 * has no recorded wake-up yet.
 */
export const dayShiftMinutes = (
  goal: SleepGoal,
  sleep: SleepEntry | undefined,
): number => {
  if (!goal.wake || !sleep?.wake) return 0;
  return signedMinutes(timeToMinutes(sleep.wake) - timeToMinutes(goal.wake));
};

/** Shifts a "HH:MM" time by `minutes`, wrapping past midnight. Null-safe. */
export const shiftTime = (time: string | null, minutes: number): string | null =>
  time === null ? null : minutesToTime(timeToMinutes(time) + minutes);

export const shiftSlot = (slot: TimeSlot, minutes: number): TimeSlot =>
  minutes === 0
    ? slot
    : {
        ...slot,
        start: minutesToTime(timeToMinutes(slot.start) + minutes),
        end:
          slot.end === "00:00"
            ? "00:00"
            : minutesToTime(timeToMinutes(slot.end) + minutes),
      };

/** How one night compares to the ideal window and target duration. */
export const sleepDeviation = (
  goal: SleepGoal,
  sleep: SleepEntry | undefined,
): SleepDeviation => {
  const wakeDelta =
    goal.wake && sleep?.wake
      ? signedMinutes(timeToMinutes(sleep.wake) - timeToMinutes(goal.wake))
      : null;
  const bedDelta =
    goal.bed && sleep?.bed
      ? signedMinutes(timeToMinutes(sleep.bed) - timeToMinutes(goal.bed))
      : null;
  const stats = cycleStats(sleep);
  const asleepMinutes = stats?.asleepMinutes ?? null;
  return {
    wakeDelta,
    bedDelta,
    asleepMinutes,
    targetMinutes: goal.targetMinutes,
    durationDelta:
      asleepMinutes === null ? null : asleepMinutes - goal.targetMinutes,
  };
};

/** Nightly deviations over the trailing `days`, ending at `endDate`. */
export const sleepTrend = (
  goal: SleepGoal,
  sleep: Record<string, SleepEntry>,
  days: number,
  endDate: string = today(),
): SleepTrend => {
  const points: SleepTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = addDays(endDate, -i);
    const deviation = sleepDeviation(goal, sleep[d]);
    points.push({
      d,
      wakeDelta: deviation.wakeDelta,
      bedDelta: deviation.bedDelta,
      asleepMinutes: deviation.asleepMinutes,
    });
  }

  const average = (values: number[]): number | null =>
    values.length
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : null;

  const wakeDeltas = points
    .map((point) => point.wakeDelta)
    .filter((value): value is number => value !== null);
  const onTime = wakeDeltas.filter(
    (delta) => Math.abs(delta) <= ON_TIME_MINUTES,
  ).length;

  return {
    points,
    days,
    avgWakeDelta: average(wakeDeltas),
    avgBedDelta: average(
      points
        .map((point) => point.bedDelta)
        .filter((value): value is number => value !== null),
    ),
    avgAsleep: average(
      points
        .map((point) => point.asleepMinutes)
        .filter((value): value is number => value !== null),
    ),
    onTimePct: wakeDeltas.length
      ? Math.round((onTime / wakeDeltas.length) * 100)
      : 0,
  };
};

/** "on time" / "25m late" / "15m early" for a signed deviation. */
export const deviationLabel = (minutes: number): string =>
  minutes === 0
    ? "on time"
    : minutes > 0
      ? `${minutes}m late`
      : `${-minutes}m early`;
