"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import ScheduleBar from "@/components/schedule/ScheduleBar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Category, Habit, PlanComparison } from "@/types";

interface PlanSnapshotCardProps {
  comparison: PlanComparison;
  habits: Habit[];
  categories: Category[];
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-heading text-base font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

export default function PlanSnapshotCard({
  comparison,
  habits,
  categories,
}: PlanSnapshotCardProps) {
  const {
    timetable,
    doneCount,
    plannedCount,
    coveragePct,
    missedCount,
    pendingCount,
  } = comparison;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Today&apos;s plan</CardTitle>
        <CardDescription>
          {timetable ? timetable.name : "No timetable covers today"}
        </CardDescription>
        <CardAction>
          <Link
            href="/timetable"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Timetable
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {timetable ? (
          <>
            <div className="flex flex-wrap gap-5">
              <Metric label="Followed" value={`${doneCount}/${plannedCount}`} />
              <Metric label="Coverage" value={`${coveragePct}%`} />
              <Metric
                label={missedCount ? "Missed" : "Pending"}
                value={String(missedCount || pendingCount)}
              />
            </div>
            <ScheduleBar
              slots={timetable.slots}
              habits={habits}
              categories={categories}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Create a timetable to plan your day, then compare it against what you
            actually did.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
