"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  NotebookPenIcon,
  PlayIcon,
  SearchIcon,
  StickyNoteIcon,
  TimerIcon,
  XIcon,
} from "lucide-react";
import CategoryIcon from "../CategoryIcon";
import StatTile from "../StatTile";
import TimingCard from "../analytics/TimingCard";
import TimeField from "../TimeField";
import { useApp } from "@/components/shell/AppProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNow } from "@/hooks/useNow";
import {
  activityStats,
  buildActivityDays,
  type ActivityDay,
  type ActivityEntry,
} from "@/lib/activity";
import { isoFromTime, today } from "@/lib/date";
import { formatDuration, formatTime, minutesToTime, timeToMinutes } from "@/lib/day";
import { buildFeed, isActive } from "@/lib/stats";
import { sessionTimings, timingByKey, timingInsights, timingSummaries } from "@/lib/timing";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

type FeedFilter = "all" | "done" | "notes";

const FEED_LIMIT = 500;

interface RowProps {
  entry: ActivityEntry;
  category?: Category;
  nowMinutes: number;
  onRemoveNote: (id: string) => void;
}

function ActivityRow({ entry, category, nowMinutes, onRemoveNote }: RowProps) {
  const isHabit = entry.kind === "habit";
  const isStart = entry.kind === "start";
  const isTracked = isHabit || isStart;
  const isToday = entry.day === today();

  const elapsed =
    isStart && isToday && entry.startedAt
      ? Math.max(0, nowMinutes - timeToMinutes(entry.startedAt))
      : null;

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50">
      <span
        aria-hidden
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg",
          !isTracked && "bg-muted text-muted-foreground",
        )}
        style={
          isTracked
            ? {
                color: category?.color ?? "var(--success)",
                backgroundColor: category
                  ? `color-mix(in oklch, ${category.color} 14%, transparent)`
                  : "color-mix(in oklch, var(--success) 14%, transparent)",
              }
            : undefined
        }
      >
        {isHabit ? (
          category ? (
            <CategoryIcon name={category.icon} className="size-3.5" />
          ) : (
            <CheckIcon className="size-3.5" />
          )
        ) : isStart ? (
          <PlayIcon className="size-3.5" />
        ) : (
          <StickyNoteIcon className="size-3.5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm whitespace-pre-wrap break-words",
            isTracked && "font-medium",
          )}
        >
          {entry.text}
        </p>
        {category && (
          <p className="text-xs text-muted-foreground">{category.name}</p>
        )}

        {isHabit && entry.startedAt && entry.endedAt && (
          <p className="text-xs tabular-nums text-muted-foreground">
            {formatTime(entry.startedAt)} → {formatTime(entry.endedAt)}
            {entry.durationMinutes !== null &&
              ` · ${formatDuration(entry.durationMinutes)}`}
          </p>
        )}
        {isHabit && !entry.startedAt && entry.endedAt && (
          <p className="text-xs tabular-nums text-muted-foreground">
            Completed {formatTime(entry.endedAt)}
          </p>
        )}
        {isStart && (
          <p className="text-xs tabular-nums text-muted-foreground">
            Started {entry.startedAt ? formatTime(entry.startedAt) : "—"}
            {elapsed !== null
              ? ` · ${formatDuration(elapsed)} so far`
              : " · not completed"}
          </p>
        )}
      </div>

      {isHabit &&
        entry.durationMinutes !== null &&
        entry.allocatedMinutes !== null && (
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 tabular-nums",
              entry.durationMinutes <= entry.allocatedMinutes
                ? "border-success/40 text-success"
                : "border-warning/40 text-warning",
            )}
          >
            planned {formatDuration(entry.allocatedMinutes)}
          </Badge>
        )}

      {isStart &&
        (isToday ? (
          <Badge
            variant="outline"
            className="shrink-0 border-success/40 text-success"
          >
            In progress
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0 text-muted-foreground">
            Unfinished
          </Badge>
        ))}

      <span className="w-16 shrink-0 text-end text-xs tabular-nums text-muted-foreground">
        {entry.time ? formatTime(entry.time) : ""}
      </span>

      {!isTracked && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Delete note: ${entry.text}`}
          onClick={() => onRemoveNote(entry.id)}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}

interface DayGroupProps {
  day: ActivityDay;
  categoryById: Map<string, Category>;
  nowMinutes: number;
  onRemoveNote: (id: string) => void;
}

function DayGroup({ day, categoryById, nowMinutes, onRemoveNote }: DayGroupProps) {
  return (
    <Collapsible
      defaultOpen
      className="rounded-xl border bg-card ring-1 ring-foreground/5"
    >
      <CollapsibleTrigger className="group flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-t-xl px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
        <span className="font-heading text-sm font-medium">{day.label}</span>
        <span className="h-px flex-1 bg-border" />
        {day.done > 0 && (
          <Badge variant="outline" className="border-success/40 text-success">
            {day.done} done
          </Badge>
        )}
        {day.notes > 0 && (
          <Badge variant="outline" className="text-muted-foreground">
            {day.notes} {day.notes === 1 ? "note" : "notes"}
          </Badge>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <ul className="border-t">
          {day.items.map((entry, index) => (
            <li key={entry.id}>
              {index > 0 && <Separator />}
              <ActivityRow
                entry={entry}
                category={
                  entry.habitId ? categoryById.get(entry.habitId) : undefined
                }
                nowMinutes={nowMinutes}
                onRemoveNote={onRemoveNote}
              />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function ActivitySection() {
  const { state, addNote, removeNote, logStart } = useApp();
  const { habits, categories, logs, notes, starts, timetables, sleep, sleepGoal } =
    state;

  const t = today();
  const now = useNow();

  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [startHabitId, setStartHabitId] = useState("");
  const [startTime, setStartTime] = useState(() => {
    const at = new Date();
    return minutesToTime(at.getHours() * 60 + at.getMinutes());
  });

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const timingsList = useMemo(
    () => sessionTimings(habits, logs, starts, timetables, sleep, sleepGoal),
    [habits, logs, starts, timetables, sleep, sleepGoal],
  );
  const timings = useMemo(() => timingByKey(timingsList), [timingsList]);

  const summaries = useMemo(
    () => timingSummaries(habits, logs, starts, timetables, sleep, sleepGoal),
    [habits, logs, starts, timetables, sleep, sleepGoal],
  );
  const timing = useMemo(() => timingInsights(summaries), [summaries]);

  const feed = useMemo(
    () => buildFeed(habits, logs, notes, FEED_LIMIT),
    [habits, logs, notes],
  );
  const days = useMemo(() => buildActivityDays(feed, timings), [feed, timings]);
  const stats = useMemo(
    () => activityStats(habits, logs, notes, timingsList),
    [habits, logs, notes, timingsList],
  );

  const startable = useMemo(
    () => habits.filter((habit) => isActive(habit, t) && !logs[habit.id]?.[t]),
    [habits, logs, t],
  );
  const startTarget = startable.some((habit) => habit.id === startHabitId)
    ? startHabitId
    : "";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return days
      .map((day) => ({
        ...day,
        items: day.items.filter((entry) => {
          const matchesKind =
            filter === "all" ||
            (filter === "done" ? entry.kind === "habit" : entry.kind === "note");
          const matchesQuery = !q || entry.text.toLowerCase().includes(q);
          return matchesKind && matchesQuery;
        }),
      }))
      .filter((day) => day.items.length > 0);
  }, [days, filter, query]);

  const shownCount = visible.reduce((sum, day) => sum + day.items.length, 0);
  const filtering = filter !== "all" || query.trim().length > 0;

  const submit = () => {
    if (!note.trim()) return;
    addNote(note);
    setNote("");
  };

  const submitStart = () => {
    if (!startTarget) return;
    logStart(startTarget, t, isoFromTime(t, startTime));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label="Check-ins today"
          value={String(stats.checkinsToday)}
          icon={<CheckIcon className="size-3.5 text-success" />}
        />
        <StatTile
          label="Notes today"
          value={String(stats.notesToday)}
          icon={<StickyNoteIcon className="size-3.5" />}
        />
        <StatTile
          label="Tracked today"
          value={formatDuration(stats.trackedToday)}
          hint="time on habits"
          icon={<TimerIcon className="size-3.5" />}
        />
        <StatTile
          label="Last 7 days"
          value={String(stats.checkinsWeek)}
          hint="check-ins"
        />
        <StatTile
          label="Tracked 7 days"
          value={formatDuration(stats.trackedWeek)}
          hint="time on habits"
        />
        <StatTile
          label="All-time"
          value={String(stats.totalCheckins)}
          hint={`${stats.totalNotes} ${stats.totalNotes === 1 ? "note" : "notes"}`}
        />
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <TimerIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium">Log a start</span>
            <span className="text-xs text-muted-foreground">
              Start a habit now — completing it later records the time it took.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={startTarget} onValueChange={setStartHabitId}>
              <SelectTrigger
                aria-label="Habit to start"
                className="w-full sm:w-56"
              >
                <SelectValue placeholder="Choose a habit" />
              </SelectTrigger>
              <SelectContent>
                {startable.length ? (
                  startable.map((habit) => (
                    <SelectItem key={habit.id} value={habit.id}>
                      {habit.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none" disabled>
                    No habits to start
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <TimeField value={startTime} onChange={setStartTime} />
            <Button
              type="button"
              disabled={!startTarget}
              onClick={submitStart}
            >
              <PlayIcon data-icon="inline-start" />
              Log start
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Textarea
              aria-label="New activity note"
              placeholder="Add a note about your day…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  submit();
                }
              }}
              className="min-h-16"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Ctrl/⌘ + Enter to add
              </p>
              <Button type="submit" disabled={!note.trim()}>
                <NotebookPenIcon data-icon="inline-start" />
                Add note
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <TimerIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium">Time tracking</span>
            <span className="text-xs text-muted-foreground">
              Actual time vs allocated, averaged per habit.
            </span>
          </div>
          <div className="mt-3">
            <TimingCard summaries={summaries} insights={timing} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 sm:max-w-xs sm:flex-1">
          <SearchIcon className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search activity"
            placeholder="Search activity…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="ps-8"
          />
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={filter}
          onValueChange={(value) => {
            if (value) setFilter(value as FeedFilter);
          }}
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="done">Check-ins</ToggleGroupItem>
          <ToggleGroupItem value="notes">Notes</ToggleGroupItem>
        </ToggleGroup>
        <span className="ms-auto text-xs tabular-nums text-muted-foreground">
          {shownCount} {shownCount === 1 ? "entry" : "entries"}
        </span>
      </div>

      {visible.length ? (
        <div className="space-y-4">
          {visible.map((day) => (
            <DayGroup
              key={day.day}
              day={day}
              categoryById={categoryById}
              nowMinutes={now.minutes}
              onRemoveNote={removeNote}
            />
          ))}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <NotebookPenIcon />
            </EmptyMedia>
            <EmptyTitle>
              {filtering ? "No matching activity" : "No activity yet"}
            </EmptyTitle>
            <EmptyDescription>
              {filtering
                ? "Try a different search or filter to find what you're after."
                : "Check off a habit or add a note, and it will appear here grouped by day."}
            </EmptyDescription>
          </EmptyHeader>
          {filtering && (
            <EmptyContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </Button>
            </EmptyContent>
          )}
        </Empty>
      )}
    </div>
  );
}
