import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PeriodDelta } from "@/types";

interface PeriodCompareCardProps {
  delta: PeriodDelta;
  label: string;
}

export default function PeriodCompareCard({
  delta,
  label,
}: PeriodCompareCardProps) {
  const up = delta.delta > 0;
  const down = delta.delta < 0;
  const Icon = up ? TrendingUpIcon : down ? TrendingDownIcon : MinusIcon;

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
      <div>
        <div className="text-xs text-muted-foreground">This {label}</div>
        <div className="font-heading text-2xl font-semibold tabular-nums">
          {delta.current}%
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Previous {label}</div>
        <div className="font-heading text-2xl font-semibold tabular-nums text-muted-foreground">
          {delta.previous}%
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "gap-1",
          up && "border-success/40 text-success",
          down && "border-destructive/40 text-destructive",
        )}
      >
        <Icon className="size-3.5" />
        {delta.delta === 0
          ? "No change"
          : `${up ? "+" : ""}${delta.delta} points`}
      </Badge>
    </div>
  );
}
