import ProgressRowList from "@/components/ProgressRowList";
import StatTile from "@/components/StatTile";
import type { YearSummary } from "@/types";

export default function YearReviewCard({ summary }: { summary: YearSummary }) {
  const monthLabel = summary.mostConsistentMonth
    ? new Date(`${summary.mostConsistentMonth}-01T00:00:00`).toLocaleDateString(
        undefined,
        { month: "long" },
      )
    : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Check-ins" value={String(summary.totalDone)} />
        <StatTile label="Active days" value={String(summary.activeDays)} />
        <StatTile label="Consistency" value={`${summary.consistencyPct}%`} />
        <StatTile label="Best streak" value={`${summary.bestStreak}d`} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">
            Strongest
          </h4>
          <ProgressRowList rows={summary.strongest} tone="success" />
        </div>
        <div>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">
            Weakest
          </h4>
          <ProgressRowList rows={summary.weakest} tone="destructive" />
        </div>
      </div>

      {monthLabel && (
        <p className="text-xs text-muted-foreground">
          Most consistent month:{" "}
          <span className="font-medium text-foreground">{monthLabel}</span>
        </p>
      )}
    </div>
  );
}
