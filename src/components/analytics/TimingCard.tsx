"use client";

import InsightsList from "./InsightsList";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/day";
import { cn } from "@/lib/utils";
import type { TimingSummary } from "@/lib/timing";
import type { Insight } from "@/types";

interface TimingCardProps {
  summaries: TimingSummary[];
  insights: Insight[];
}

export default function TimingCard({ summaries, insights }: TimingCardProps) {
  if (!summaries.length) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        Start habits and complete them on the same day to compare how long they
        really take against the time you allocated.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {summaries.map((summary) => {
          const over = summary.avgOverBy > 0;
          return (
            <li
              key={summary.habit.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
            >
              <span
                className="min-w-0 flex-1 truncate"
                title={summary.habit.name}
              >
                {summary.habit.name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                actual {formatDuration(summary.avgActual)}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                planned {formatDuration(summary.avgAllocated)}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "tabular-nums",
                  over
                    ? "border-warning/40 text-warning"
                    : "border-success/40 text-success",
                )}
              >
                {over ? "+" : "−"}
                {formatDuration(Math.abs(summary.avgOverBy))}
              </Badge>
              <span className="w-10 text-end text-xs tabular-nums text-muted-foreground">
                {summary.sessions}×
              </span>
            </li>
          );
        })}
      </ul>

      {insights.length > 0 && <InsightsList insights={insights} />}
    </div>
  );
}
