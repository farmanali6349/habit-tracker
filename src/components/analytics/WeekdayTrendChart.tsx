"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeekdayStat } from "@/types";

const config = {
  pct: { label: "Completion", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function WeekdayTrendChart({
  data,
}: {
  data: WeekdayStat[];
}) {
  return (
    <ChartContainer config={config} className="aspect-auto h-48 w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis hide domain={[0, 100]} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="pct" fill="var(--color-pct)" radius={3} />
      </BarChart>
    </ChartContainer>
  );
}
