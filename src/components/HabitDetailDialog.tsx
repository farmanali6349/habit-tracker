"use client";

import {
  CheckIcon,
  ClockIcon,
  ExternalLinkIcon,
  FlameIcon,
  PencilIcon,
} from "lucide-react";
import CategoryBadge from "./CategoryBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { amountFor, frequencyLabel, weeklyQuotaProgress } from "@/lib/cadence";
import { today } from "@/lib/date";
import { identitiesForHabit } from "@/lib/identity";
import { windowLabel, habitWindowFor } from "@/lib/schedule";
import { isActive } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type {
  Category,
  Habit,
  HabitLogs,
  HabitStats,
  Identity,
  ProgressLog,
  TimeTable,
} from "@/types";

interface HabitDetailDialogProps {
  habit: Habit;
  category?: Category;
  identities?: Identity[];
  anchorHabit?: Habit;
  stats?: HabitStats;
  logs: HabitLogs;
  progress?: ProgressLog;
  timetables: TimeTable[];
  /** Wake-time adjustment applied to today's window. */
  shiftMinutes?: number;
  onToggleTodo: (habitId: string, todoId: string) => void;
  onToggleToday: () => void;
  onSetProgress?: (habitId: string, date: string, amount: number) => void;
  onEdit: () => void;
  onClose: () => void;
}

export default function HabitDetailDialog({
  habit,
  category,
  identities = [],
  anchorHabit,
  stats,
  logs,
  progress,
  timetables,
  shiftMinutes = 0,
  onToggleTodo,
  onToggleToday,
  onSetProgress,
  onEdit,
  onClose,
}: HabitDetailDialogProps) {
  const t = today();
  const active = isActive(habit, t);
  const done = Boolean(logs[habit.id]?.[t]);
  const window = habitWindowFor(t, habit, timetables, shiftMinutes);
  const todoDone = habit.todos.filter((todo) => todo.done).length;
  const links = identitiesForHabit(identities, habit);
  const amount = amountFor(progress, habit.id, t);
  const metricPct = habit.metric
    ? Math.min(100, Math.round((amount / habit.metric.target) * 100))
    : 0;
  const quota = weeklyQuotaProgress(habit, logs, t);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{habit.name}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-1.5">
              {category && <CategoryBadge category={category} />}
              {links.map((identity) => (
                <Badge
                  key={identity.id}
                  variant="outline"
                  style={{
                    borderColor: `color-mix(in oklch, ${identity.color} 40%, transparent)`,
                    color: identity.color,
                  }}
                >
                  {identity.emoji} I am becoming {identity.statement}
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
              <Badge variant="outline" className="text-muted-foreground">
                {habit.end ? `Until ${habit.end}` : "Lifetime"}
              </Badge>
              {habit.frequency.kind !== "daily" && (
                <Badge variant="outline" className="text-muted-foreground">
                  {frequencyLabel(habit.frequency)}
                </Badge>
              )}
              {stats && (
                <>
                  <Badge
                    variant="outline"
                    className="border-warning/40 text-warning"
                  >
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
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {(habit.anchorHabitId || habit.anchorText) && (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">After </span>
              <strong className="font-medium">
                {habit.anchorText?.trim() || anchorHabit?.name || "an existing habit"}
              </strong>
              <span className="text-muted-foreground">, I will </span>
              <strong className="font-medium">{habit.name}</strong>.
            </p>
          )}

          {habit.description && (
            <section className="space-y-1.5">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Description
              </h3>
              <p className="text-sm whitespace-pre-wrap">{habit.description}</p>
            </section>
          )}

          {(habit.metric || habit.frequency.kind === "weekly") && (
            <section className="space-y-3">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Progress
              </h3>
              {habit.metric && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Today</span>
                    <span className="tabular-nums">
                      {amount} / {habit.metric.target} {habit.metric.unit}
                    </span>
                  </div>
                  <Progress
                    value={metricPct}
                    aria-label={`${habit.name}: ${amount} of ${habit.metric.target}`}
                    className="h-1.5 [&>[data-slot=progress-indicator]]:bg-success"
                  />
                  {onSetProgress && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        className="h-8 w-24"
                        aria-label={`Log amount for ${habit.name}`}
                        value={amount}
                        disabled={!active}
                        onChange={(e) =>
                          onSetProgress(habit.id, t, Number(e.target.value) || 0)
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        log today&apos;s amount
                      </span>
                    </div>
                  )}
                </div>
              )}
              {habit.frequency.kind === "weekly" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>This week</span>
                    <span className="tabular-nums">
                      {quota.done} / {quota.target}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      Math.round((quota.done / quota.target) * 100),
                    )}
                    aria-label={`${habit.name}: ${quota.done} of ${quota.target} this week`}
                    className="h-1.5 [&>[data-slot=progress-indicator]]:bg-warning"
                  />
                </div>
              )}
            </section>
          )}

          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Todos
              </h3>
              {habit.todos.length > 0 && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {todoDone}/{habit.todos.length}
                </span>
              )}
            </div>
            {habit.todos.length ? (
              <ul className="space-y-1.5">
                {habit.todos.map((todo) => (
                  <li key={todo.id} className="flex items-start gap-2.5">
                    <Checkbox
                      id={`todo-${todo.id}`}
                      checked={todo.done}
                      onCheckedChange={() => onToggleTodo(habit.id, todo.id)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={cn(
                        "text-sm leading-snug",
                        todo.done &&
                          "text-muted-foreground line-through decoration-muted-foreground/50",
                      )}
                    >
                      {todo.text}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No todos yet — add some with Edit.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Resources
            </h3>
            {habit.resources.length ? (
              <ul className="space-y-1.5">
                {habit.resources.map((resource) => (
                  <li key={resource.id}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm underline underline-offset-3 hover:text-foreground"
                    >
                      <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      {resource.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No resources yet.
              </p>
            )}
          </section>
        </div>

        <DialogFooter>
          <Button
            variant={done ? "outline" : "default"}
            disabled={!active}
            onClick={onToggleToday}
            className={cn(done && "text-muted-foreground")}
          >
            <CheckIcon className={cn(!done && "opacity-60")} />
            {done ? "Done today" : "Mark done today"}
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <PencilIcon />
            Edit
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
