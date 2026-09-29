"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DayStack } from "@/types";

const config = {
  done: { label: "Completed", color: "var(--success)" },
  missed: { label: "Missed", color: "var(--destructive)" },
} satisfies ChartConfig;

export default function MissedVsCompletedChart({ data }: { data: DayStack[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-48 w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="l"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={16}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="done" stackId="a" fill="var(--color-done)" />
        <Bar
          dataKey="missed"
          stackId="a"
          fill="var(--color-missed)"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
