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
import { today } from "@/lib/date";
import { windowLabel, habitWindowFor } from "@/lib/schedule";
import { isActive } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type {
  Category,
  Habit,
  HabitLogs,
  HabitStats,
  TimeTable,
} from "@/types";

interface HabitDetailDialogProps {
  habit: Habit;
  category?: Category;
  stats?: HabitStats;
  logs: HabitLogs;
  timetables: TimeTable[];
  onToggleTodo: (habitId: string, todoId: string) => void;
  onToggleToday: () => void;
  onEdit: () => void;
  onClose: () => void;
}

export default function HabitDetailDialog({
  habit,
  category,
  stats,
  logs,
  timetables,
  onToggleTodo,
  onToggleToday,
  onEdit,
  onClose,
}: HabitDetailDialogProps) {
  const t = today();
  const active = isActive(habit, t);
  const done = Boolean(logs[habit.id]?.[t]);
  const window = habitWindowFor(t, habit, timetables);
  const todoDone = habit.todos.filter((todo) => todo.done).length;

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
          {habit.description && (
            <section className="space-y-1.5">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Description
              </h3>
              <p className="text-sm whitespace-pre-wrap">{habit.description}</p>
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
