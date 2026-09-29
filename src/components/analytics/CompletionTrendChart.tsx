"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TrendPoint } from "@/types";

const config = {
  pct: { label: "Completion", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function CompletionTrendChart({
  data,
}: {
  data: TrendPoint[];
}) {
  return (
    <ChartContainer config={config} className="aspect-auto h-48 w-full">
      <AreaChart accessibilityLayer data={data} margin={{ right: 8 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-pct)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-pct)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis hide domain={[0, 100]} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="pct"
          type="monotone"
          stroke="var(--color-pct)"
          strokeWidth={2}
          fill="url(#trend-fill)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
