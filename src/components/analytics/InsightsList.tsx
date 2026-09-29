import { LightbulbIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Insight, InsightTone } from "@/types";

const toneClasses: Record<InsightTone, string> = {
  positive: "border-success/40 bg-success/5",
  warning: "border-warning/40 bg-warning/5",
  neutral: "border-border bg-muted/30",
};

export default function InsightsList({ insights }: { insights: Insight[] }) {
  if (!insights.length) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <LightbulbIcon className="size-4" />
        Keep checking off habits — insights appear once there&apos;s enough data.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {insights.map((insight) => (
        <li
          key={insight.id}
          className={cn(
            "flex gap-3 rounded-lg border p-3",
            toneClasses[insight.tone],
          )}
        >
          <span aria-hidden className="text-base leading-none">
            {insight.icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{insight.title}</p>
            <p className="text-xs text-muted-foreground">{insight.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
