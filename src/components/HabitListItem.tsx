"use client";

import { useState } from "react";
import {
  CheckIcon,
  ClockIcon,
  EyeIcon,
  FlameIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CategoryBadge from "./CategoryBadge";
import { frequencyLabel, isScheduled, isWeeklyQuota } from "@/lib/cadence";
import { addDays, today } from "@/lib/date";
import { formatDuration, logTimeForDate, timeToMinutes } from "@/lib/day";
import { formatWindowEnd, progressPct, windowLabel } from "@/lib/schedule";
import { isActive } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type {
  Category,
  Habit,
  HabitLogs,
  HabitMomentInfo,
  HabitStats,
  Identity,
  StartLog,
} from "@/types";

const STRIP_DAYS = 14;

interface HabitListItemProps {
  habit: Habit;
  category: Category;
  identities?: Identity[];
  anchorName?: string;
  logs: HabitLogs;
  /** habitId → date → ISO start timestamp, for the running-timer affordance. */
  starts: StartLog;
  stats: HabitStats;
  /** Live window + status for today, if the habit is active. */
  info?: HabitMomentInfo;
  nowMinutes: number;
  onToggle: (id: string, date: string) => void;
  onStart: (id: string, date: string) => void;
  onClearStart: (id: string, date: string) => void;
  onEdit: (habit: Habit) => void;
  onView: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

export default function HabitListItem({
  habit,
  category,
  identities = [],
  anchorName,
  logs,
  starts,
  stats,
  info,
  nowMinutes,
  onToggle,
  onStart,
  onClearStart,
  onEdit,
  onView,
  onDelete,
}: HabitListItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const t = today();
  const log = logs[habit.id] || {};
  const active = isActive(habit, t);
  const done = Boolean(log[t]);

  const startTime = starts[habit.id]?.[t]
    ? logTimeForDate(t, starts[habit.id][t])
    : null;
  const elapsed = startTime
    ? Math.max(0, nowMinutes - timeToMinutes(startTime))
    : 0;

  const window = info?.window ?? null;
  const moment = info?.moment;
  const isOngoing = moment === "ongoing";
  const isOverdue = moment === "overdue";
  const isLimit = habit.kind === "limit";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-3 sm:flex-row sm:items-start",
        isOngoing && "bg-muted/30",
      )}
      style={
        isOngoing
          ? { boxShadow: `inset 3px 0 0 0 ${category.color}` }
          : undefined
      }
    >
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <Button
          variant={done ? "default" : "outline"}
          size="icon"
          disabled={!active}
          aria-pressed={done}
          aria-label={`${
            done ? "Undo" : isLimit ? "Mark resisted" : "Mark"
          } ${habit.name}`}
          onClick={() => onToggle(habit.id, t)}
          className={cn(
            "size-10 shrink-0 rounded-full",
            done && "bg-success text-success-foreground hover:bg-success/90",
          )}
        >
          <CheckIcon className={cn("size-4", !done && "opacity-0")} />
        </Button>

        {active && !done && startTime ? (
          <Button
            variant="ghost"
            size="xs"
            className="text-[11px] tabular-nums text-success"
            aria-label={`Clear start for ${habit.name}`}
            onClick={() => onClearStart(habit.id, t)}
          >
            <PlayIcon data-icon="inline-start" />
            {formatDuration(elapsed)}
          </Button>
        ) : active && !done ? (
          <Button
            variant="ghost"
            size="xs"
            className="text-[11px] text-muted-foreground"
            aria-label={`Start ${habit.name}`}
            onClick={() => onStart(habit.id, t)}
          >
            <PlayIcon data-icon="inline-start" />
            Start
          </Button>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => onView(habit)}
            className={cn(
              "min-w-0 flex-1 truncate text-start text-sm font-medium hover:underline",
              "underline-offset-2 outline-none focus-visible:underline",
              done && "text-muted-foreground line-through",
            )}
            title={habit.name}
          >
            {habit.name}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${habit.name}`}
              >
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onView(habit)}>
                <EyeIcon />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(habit)}>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setConfirmOpen(true)}
              >
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={category} />
          {identities.map((identity) => (
            <Badge
              key={identity.id}
              variant="outline"
              style={{
                borderColor: `color-mix(in oklch, ${identity.color} 40%, transparent)`,
                color: identity.color,
              }}
            >
              {identity.emoji} {identity.statement}
            </Badge>
          ))}
          {window && (
            <Badge
              variant="outline"
              className="text-muted-foreground tabular-nums"
            >
              <ClockIcon />
              {windowLabel(window)}
            </Badge>
          )}
          {isOngoing && (
            <Badge variant="outline" className="border-success/40 text-success">
              Ongoing
            </Badge>
          )}
          {isOverdue && !done && (
            <Badge variant="outline" className="border-warning/40 text-warning">
              Overdue
            </Badge>
          )}
          <Badge variant="outline" className="text-muted-foreground">
            {habit.end ? `Until ${habit.end}` : "Lifetime"}
          </Badge>
          {habit.frequency.kind !== "daily" && (
            <Badge variant="outline" className="text-muted-foreground">
              {frequencyLabel(habit.frequency)}
            </Badge>
          )}
          {(habit.anchorHabitId || habit.anchorText) && (
            <Badge variant="outline" className="text-muted-foreground">
              <LinkIcon />
              After {habit.anchorText?.trim() || anchorName || "a habit"}
            </Badge>
          )}
          {isLimit ? (
            <Badge variant="outline" className="text-muted-foreground">
              Reduce · resist days count
            </Badge>
          ) : (
            <>
              <Badge variant="outline" className="border-warning/40 text-warning">
                <FlameIcon />
                {stats.cur}d
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                Best {stats.best}d
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  stats.pct === 100
                    ? "border-success/40 text-success"
                    : "text-muted-foreground",
                )}
              >
                {stats.pct}%
              </Badge>
            </>
          )}
        </div>

        {isOngoing && window && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>In progress</span>
              <span className="tabular-nums">
                {progressPct(nowMinutes, window)}% · ends{" "}
                {formatWindowEnd(window)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                style={{
                  width: `${progressPct(nowMinutes, window)}%`,
                  backgroundColor: category.color,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          {Array.from({ length: STRIP_DAYS }, (_, i) => {
            const d = addDays(t, i - STRIP_DAYS + 1);
            const dayActive = isWeeklyQuota(habit)
              ? isActive(habit, d)
              : isScheduled(habit, d);
            const dayDone = Boolean(log[d]);
            const missed = dayActive && !dayDone && d < t;
            const label = `${new Date(`${d}T00:00:00`).toDateString()} — ${
              dayDone
                ? "done"
                : missed
                  ? "missed"
                  : dayActive
                    ? "not done"
                    : "not tracked"
            }`;

            return (
              <Tooltip key={d}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    disabled={!dayActive}
                    aria-label={label}
                    onClick={() => onToggle(habit.id, d)}
                    className={cn(
                      "relative size-5 rounded-[4px] p-0",
                      "after:absolute after:inset-x-0 after:-inset-y-2 after:content-['']",
                      dayDone && "bg-success/80 hover:bg-success",
                      missed && "bg-destructive/25 hover:bg-destructive/40",
                      dayActive &&
                        !dayDone &&
                        !missed &&
                        "bg-muted hover:bg-muted-foreground/30",
                      !dayActive && "bg-muted/40 opacity-40",
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{habit.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the habit and its entire check-in history. It can&apos;t
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep habit</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => onDelete(habit.id)}
            >
              Delete habit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
