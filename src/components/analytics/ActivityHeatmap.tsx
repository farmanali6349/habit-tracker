"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { today } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { HeatPoint } from "@/types";

const LEVELS = [
  "bg-muted",
  "bg-success/25",
  "bg-success/45",
  "bg-success/70",
  "bg-success",
];

interface ActivityHeatmapProps {
  data: HeatPoint[];
  className?: string;
}

export default function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  if (!data.length) return null;

  const t = today();
  const pad = new Date(`${data[0].date}T00:00:00`).getDay();
  const cells: (HeatPoint | null)[] = [
    ...Array.from({ length: pad }, () => null),
    ...data,
  ];

  const columns: (HeatPoint | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    columns.push(cells.slice(i, i + 7));
  }

  const tracked = data.filter((cell) => cell.active > 0).length;
  const perfect = data.filter((cell) => cell.level === 4).length;

  return (
    <figure className={cn("space-y-3", className)}>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, rowIndex) => {
              const cell = column[rowIndex];
              if (!cell) {
                return (
                  <span
                    key={rowIndex}
                    aria-hidden
                    className="size-3 rounded-[3px]"
                  />
                );
              }
              const label =
                cell.active === 0
                  ? "no habits scheduled"
                  : `${cell.done} of ${cell.active} habits done`;
              return (
                <Tooltip key={cell.date}>
                  <TooltipTrigger asChild>
                    <span
                      tabIndex={-1}
                      aria-hidden
                      className={cn(
                        "size-3 rounded-[3px] outline-none",
                        LEVELS[cell.level],
                        cell.date === t && "ring-1 ring-foreground/50",
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {new Date(`${cell.date}T00:00:00`).toDateString()} — {label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {LEVELS.map((level) => (
          <span key={level} className={cn("size-3 rounded-[3px]", level)} />
        ))}
        <span>More</span>
      </div>

      <figcaption className="sr-only">
        Daily activity heatmap: {tracked} tracked days, {perfect} perfect days
        in the shown range.
      </figcaption>
    </figure>
  );
}
