"use client";

import {
  CheckIcon,
  CircleIcon,
  MessageSquarePlusIcon,
  MoonIcon,
  PencilIcon,
  Undo2Icon,
  XIcon,
} from "lucide-react";
import CategoryBadge from "../CategoryBadge";
import CategoryIcon from "../CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/day";
import { hasNote } from "@/lib/missed";
import { formatSlotTime } from "@/lib/timetable";
import { cn } from "@/lib/utils";
import type { PlanEntry, TimelineEntry } from "@/types";

const deviationLabel = (minutes: number): string =>
  minutes === 0
    ? "on time"
    : minutes > 0
      ? `${minutes}m late`
      : `${-minutes}m early`;

interface ReviewRowProps {
  entry: TimelineEntry;
  planned?: PlanEntry;
  /** False for future days — misses can only be flagged up to today. */
  canMiss: boolean;
  onToggle: () => void;
  onMiss: () => void;
  onUnmark: () => void;
  onEditNote: () => void;
  onSkip: () => void;
}

export default function ReviewRow({
  entry,
  planned,
  canMiss,
  onToggle,
  onMiss,
  onUnmark,
  onEditNote,
  onSkip,
}: ReviewRowProps) {
  const habit = entry.habit;
  if (!habit) return null;

  const category = entry.category;
  const isCheckin = entry.kind === "checkin";
  const isMissed = entry.kind === "missed";
  const isPending = entry.kind === "pending";
  const note = entry.missed;
  const noteFilled = note ? hasNote(note) : false;

  const deviation = planned?.deviationMinutes ?? null;

  return (
    <li className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50">
      <span
        aria-hidden
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
        style={{
          color: category?.color ?? "var(--muted-foreground)",
          backgroundColor: category
            ? `color-mix(in oklch, ${category.color} 14%, transparent)`
            : "var(--muted)",
        }}
      >
        {category ? (
          <CategoryIcon name={category.icon} className="size-3.5" />
        ) : (
          <CircleIcon className="size-3.5" />
        )}
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "min-w-0 truncate text-sm font-medium",
              isMissed && "text-muted-foreground",
            )}
            title={habit.name}
          >
            {habit.name}
          </span>
          {category && (
            <CategoryBadge
              category={category}
              className="hidden shrink-0 sm:inline-flex"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {planned && (
            <span className="tabular-nums">
              Planned {formatSlotTime(planned.slot)}
            </span>
          )}
          {isCheckin && entry.time && (
            <span className="tabular-nums">
              Logged {formatTime(entry.time)}
              {deviation !== null && deviation !== 0
                ? ` · ${deviationLabel(deviation)}`
                : ""}
            </span>
          )}
          {isMissed && <span>Not done</span>}
          {isPending && <span>Not logged yet</span>}
        </div>

        {isMissed && note && noteFilled && (
          <div className="space-y-0.5 rounded-md bg-destructive/5 px-2 py-1.5 text-xs">
            {note.reason.trim() && (
              <p className="text-foreground/80">
                <span className="text-muted-foreground">Why: </span>
                {note.reason.trim()}
              </p>
            )}
            {note.plan.trim() && (
              <p className="text-foreground/80">
                <span className="text-muted-foreground">Tomorrow: </span>
                {note.plan.trim()}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 pt-0.5">
        {isCheckin && (
          <>
            <Badge variant="outline" className="border-success/40 text-success">
              Done
            </Badge>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Undo ${habit.name}`}
              onClick={onToggle}
            >
              <Undo2Icon className="text-muted-foreground" />
            </Button>
          </>
        )}

        {isMissed && (
          <>
            <Badge variant="destructive">Missed</Badge>
            <Button
              variant="outline"
              size="icon-xs"
              aria-label={
                noteFilled
                  ? `Edit missed note for ${habit.name}`
                  : `Add a reason for missing ${habit.name}`
              }
              onClick={onEditNote}
            >
              {noteFilled ? (
                <PencilIcon />
              ) : (
                <MessageSquarePlusIcon />
              )}
            </Button>
            {note && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Undo missed mark for ${habit.name}`}
                onClick={onUnmark}
              >
                <XIcon className="text-muted-foreground" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="xs"
              aria-label={`Take a rest day for ${habit.name}`}
              onClick={onSkip}
            >
              <MoonIcon data-icon="inline-start" />
              Rest
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              aria-label={`Did ${habit.name} after all`}
              onClick={onToggle}
            >
              <CheckIcon />
            </Button>
          </>
        )}

        {isPending && (
          <>
            <Badge variant="outline" className="text-muted-foreground">
              Pending
            </Badge>
            {canMiss && (
              <Button
                variant="ghost"
                size="xs"
                aria-label={`Take a rest day for ${habit.name}`}
                onClick={onSkip}
              >
                <MoonIcon data-icon="inline-start" />
                Rest
              </Button>
            )}
            {canMiss && (
              <Button
                variant="outline"
                size="xs"
                aria-label={`Mark ${habit.name} missed`}
                onClick={onMiss}
              >
                <XIcon data-icon="inline-start" />
                Miss it
              </Button>
            )}
            <Button
              variant="outline"
              size="icon-xs"
              aria-label={`Mark ${habit.name} done`}
              onClick={onToggle}
            >
              <CheckIcon />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
