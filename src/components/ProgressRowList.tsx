import { Progress } from "@/components/ui/progress";
import type { RankRow } from "@/types";

interface ProgressRowListProps {
  rows: RankRow[];
  tone: "success" | "destructive";
}

export default function ProgressRowList({ rows, tone }: ProgressRowListProps) {
  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.h.id} className="flex items-center gap-3 text-sm">
          <span className="flex-1 truncate" title={row.h.name}>
            {row.h.name}
          </span>
          <Progress
            value={row.p}
            aria-label={`${row.h.name}: ${row.p}%`}
            className={`h-1.5 w-20 ${
              tone === "success"
                ? "[&>[data-slot=progress-indicator]]:bg-success"
                : "[&>[data-slot=progress-indicator]]:bg-destructive"
            }`}
          />
          <span className="w-9 text-end text-xs tabular-nums text-muted-foreground">
            {row.p}%
          </span>
        </div>
      ))}
    </div>
  );
}
