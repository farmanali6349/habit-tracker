import type { AppState, ExportKind } from "@/types";
import { categoryName } from "./categories";
import { today } from "./date";
import { sessionTimings, timingByKey } from "./timing";

const quote = (value: string): string => `"${value.replace(/"/g, '""')}"`;

export const toCsv = (state: AppState): string => {
  const timings = timingByKey(
    sessionTimings(
      state.habits,
      state.logs,
      state.starts,
      state.timetables,
      state.sleep,
      state.sleepGoal,
    ),
  );

  return [
    "habit,category,date,status,logged_at,reason,plan,started_at,actual_minutes,allocated_minutes",
  ]
    .concat(
      state.habits.flatMap((h) => {
        const name = quote(h.name);
        const category = categoryName(state.categories, h.categoryId);
        const done = Object.entries(state.logs[h.id] || {}).map(([d, ts]) => {
          const timing = timings.get(`${h.id}|${d}`);
          const startedAt = timing?.startISO ?? "";
          const actual = timing?.actualMinutes ?? "";
          const allocated = timing?.allocatedMinutes ?? "";
          return `${name},${category},${d},done,${ts},,,${startedAt},${actual},${allocated}`;
        });
        const missed = Object.entries(state.missed[h.id] || {}).map(
          ([d, entry]) =>
            `${name},${category},${d},missed,${entry.ts},${quote(
              entry.reason ?? "",
            )},${quote(entry.plan ?? "")},,,`,
        );
        return [...done, ...missed];
      }),
    )
    .join("\n");
};

export const downloadBlob = (text: string, kind: ExportKind): void => {
  const blob = new Blob([text], {
    type: kind === "json" ? "application/json" : "text/csv",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `habits-${today()}.${kind}`;
  a.click();
  URL.revokeObjectURL(a.href);
};
