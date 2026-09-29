"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CategoryStat } from "@/types";

export default function CategoryBreakdownChart({
  data,
}: {
  data: CategoryStat[];
}) {
  const slices = data
    .filter((stat) => stat.done > 0)
    .map((stat) => ({
      name: stat.category.name,
      value: stat.done,
      fill: stat.category.color,
    }));

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (!total) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No check-ins in this period yet.
      </p>
    );
  }

  const config: ChartConfig = Object.fromEntries(
    slices.map((slice) => [
      slice.name,
      { label: slice.name, color: slice.fill },
    ]),
  );

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-56">
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="name" hideLabel />}
        />
        <Pie
          data={slices}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          strokeWidth={2}
        >
          {slices.map((slice) => (
            <Cell key={slice.name} fill={slice.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
