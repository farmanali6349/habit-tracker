"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import CategoryIcon from "../CategoryIcon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MissedRollup } from "@/types";

const config = {
  missed: { label: "Missed", color: "var(--destructive)" },
} satisfies ChartConfig;

export default function MissedReasonsCard({ rollup }: { rollup: MissedRollup }) {
  const { totalMissed, withNotes, topReasons, worstHabits, byDay } = rollup;
  const maxReason = topReasons[0]?.count ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Why habits get missed</CardTitle>
        <CardDescription>
          {totalMissed
            ? `${totalMissed} flagged ${
                totalMissed === 1 ? "miss" : "misses"
              } in the last ${rollup.windowDays} days · ${withNotes} with a reason.`
            : "The reasons behind the habits that slip, so you can act on them."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {totalMissed === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No misses were flagged in this period. When you flag one on the Day
            audit, its reason shows up here.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground">
                Top reasons
              </h3>
              {topReasons.length ? (
                <ul className="space-y-2.5">
                  {topReasons.map((reason) => (
                    <li key={reason.reason} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate">
                          {reason.reason}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {reason.count}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-destructive"
                          style={{
                            width: `${(reason.count / maxReason) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No reasons written yet — add one when you flag a habit missed.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground">
                Most missed habits
              </h3>
              <ul className="space-y-2.5">
                {worstHabits.map((row) => (
                  <li
                    key={row.habit.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {row.category && (
                      <CategoryIcon
                        name={row.category.icon}
                        aria-hidden
                        className="size-3.5 shrink-0"
                        style={{ color: row.category.color }}
                      />
                    )}
                    <span
                      className="min-w-0 flex-1 truncate"
                      title={row.habit.name}
                    >
                      {row.habit.name}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {row.missed}× · {row.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 md:col-span-2">
              <h3 className="text-xs font-medium text-muted-foreground">
                Misses per day
              </h3>
              <ChartContainer config={config} className="aspect-auto h-40 w-full">
                <BarChart accessibilityLayer data={byDay}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="l"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={20}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="missed"
                    fill="var(--color-missed)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
