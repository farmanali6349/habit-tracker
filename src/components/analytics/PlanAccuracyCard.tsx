import StatTile from "@/components/StatTile";
import { cn } from "@/lib/utils";
import type { PlanAccuracy } from "@/types";

const SEGMENTS = [
  { key: "onTime", label: "On time", className: "bg-success" },
  { key: "early", label: "Early", className: "bg-chart-2" },
  { key: "late", label: "Late", className: "bg-warning" },
] as const;

export default function PlanAccuracyCard({
  accuracy,
}: {
  accuracy: PlanAccuracy;
}) {
  if (!accuracy.planned) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        No timetable covered these days, so there&apos;s nothing to compare yet.
      </p>
    );
  }

  const total = Math.max(1, accuracy.onTime + accuracy.early + accuracy.late);
  const deviation =
    accuracy.avgDeviation === null
      ? "—"
      : `${Math.abs(accuracy.avgDeviation)}m ${
          accuracy.avgDeviation >= 0 ? "late" : "early"
        }`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="On time" value={`${accuracy.onTimePct}%`} />
        <StatTile label="Followed" value={`${accuracy.done}/${accuracy.planned}`} />
        <StatTile label="Missed" value={String(accuracy.missed)} />
        <StatTile label="Avg deviation" value={deviation} />
      </div>

      <div className="space-y-2">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          {SEGMENTS.map((segment) => {
            const value = accuracy[segment.key];
            if (!value) return null;
            return (
              <span
                key={segment.key}
                className={cn("h-full", segment.className)}
                style={{ width: `${(value / total) * 100}%` }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {SEGMENTS.map((segment) => (
            <span key={segment.key} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", segment.className)} />
              {segment.label} · {accuracy[segment.key]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
