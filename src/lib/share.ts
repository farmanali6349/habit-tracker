import type { AppState } from "@/types";
import { buildWeekSummary } from "./review";
import { habitStats } from "./stats";

/** A plain-text weekly summary that can be pasted into any chat or email. */
export const weekSummaryText = (state: AppState, start: string): string => {
  const summary = buildWeekSummary(state, start);
  const lines: string[] = [];

  lines.push(`Habit week — ${summary.start} to ${summary.end}`);
  lines.push(
    `Completion: ${summary.pct}% (${summary.done}/${summary.active} check-ins)`,
  );
  if (summary.bestHabit) {
    lines.push(
      `Strongest: ${summary.bestHabit.habit.name} (${summary.bestHabit.pct}%)`,
    );
  }
  if (summary.worstHabit) {
    lines.push(
      `Needs attention: ${summary.worstHabit.habit.name} (${summary.worstHabit.pct}%)`,
    );
  }
  if (summary.topMissReason) {
    lines.push(`Most common reason for missing: ${summary.topMissReason}`);
  }

  const topStreak = Math.max(
    0,
    ...state.habits.map((habit) => habitStats(habit, state.logs, state.skips).cur),
  );
  if (topStreak > 0) {
    lines.push(`Longest current streak: ${topStreak} days`);
  }

  if (state.profile.partnerName.trim()) {
    lines.push(`Shared with ${state.profile.partnerName.trim()}`);
  }
  lines.push(
    `— ${state.profile.displayName.trim() || "me"}, tracking with Habit Tracker`,
  );

  return lines.join("\n");
};

/** Triggers a .txt download of `text` (fallback when clipboard is blocked). */
export const downloadText = (text: string, filename: string): void => {
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};
