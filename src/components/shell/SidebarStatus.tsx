"use client";

import { useApp } from "./AppProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const RING = 34;
const STROKE = 4;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function Ring({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <svg
      width={RING}
      height={RING}
      viewBox={`0 0 ${RING} ${RING}`}
      className="-rotate-90"
      role="img"
      aria-label={`${clamped}% of today's habits complete`}
    >
      <circle
        cx={RING / 2}
        cy={RING / 2}
        r={RADIUS}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={STROKE}
      />
      <circle
        cx={RING / 2}
        cy={RING / 2}
        r={RADIUS}
        fill="none"
        stroke="var(--success)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - clamped / 100)}
        className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}

interface SidebarStatusProps {
  collapsed?: boolean;
}

/** Compact today progress: a completion ring plus what's still pending. */
export default function SidebarStatus({ collapsed = false }: SidebarStatusProps) {
  const { derived } = useApp();
  const { todayPct, pendingToday, doneToday } = derived;

  const label =
    pendingToday > 0
      ? `${pendingToday} ${pendingToday === 1 ? "habit" : "habits"} left today`
      : "All done for today";

  const body = (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg p-1.5",
        collapsed && "justify-center p-0",
      )}
    >
      <Ring pct={todayPct} />
      {!collapsed && (
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">{label}</div>
          <div className="text-xs tabular-nums text-muted-foreground">
            {todayPct}% · {doneToday} done
          </div>
        </div>
      )}
    </div>
  );

  if (!collapsed) return body;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div tabIndex={0} className="rounded-lg outline-none">
          {body}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        {label} · {todayPct}%
      </TooltipContent>
    </Tooltip>
  );
}
