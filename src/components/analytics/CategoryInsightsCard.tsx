import { Badge } from "@/components/ui/badge";
import type { CategoryStat } from "@/types";

export default function CategoryInsightsCard({
  data,
}: {
  data: CategoryStat[];
}) {
  const rows = [...data].filter((row) => row.active > 0).sort((a, b) => b.pct - a.pct);

  if (!rows.length) {
    return (
      <p className="py-6 text-sm text-muted-foreground">
        No per-category activity in this period yet.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {rows.map((row, index) => (
        <li key={row.category.id} className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.category.color }}
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              {row.category.name}
            </span>
            {index === 0 && (
              <Badge variant="outline" className="border-success/40 text-success">
                Best
              </Badge>
            )}
            {rows.length > 1 && index === rows.length - 1 && (
              <Badge variant="outline" className="border-warning/40 text-warning">
                Weakest
              </Badge>
            )}
            <span className="w-9 text-end text-xs tabular-nums text-muted-foreground">
              {row.pct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${row.pct}%`,
                backgroundColor: row.category.color,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {row.habits} {row.habits === 1 ? "habit" : "habits"}
            {row.bestHabit ? ` · top: ${row.bestHabit.name}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
