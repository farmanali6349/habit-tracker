"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import CategoryBadge from "./CategoryBadge";
import DateField from "./DateField";
import TimeField from "./TimeField";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UNCATEGORIZED_ID } from "@/lib/categories";
import { minutesToTime } from "@/lib/day";
import { anchorCandidates } from "@/lib/stacking";
import { uid } from "@/lib/stats";
import type { Category, Habit, HabitDraft, HabitResource, Identity } from "@/types";

const WEEKDAY_CHIPS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const REMIND_LEAD_OPTIONS = [
  { value: "0", label: "At the time" },
  { value: "1", label: "1 min before" },
  { value: "5", label: "5 min before" },
  { value: "10", label: "10 min before" },
  { value: "15", label: "15 min before" },
];

interface HabitFormDialogProps {
  habit: Habit | null;
  categories: Category[];
  identities: Identity[];
  habits: Habit[];
  onSave: (draft: HabitDraft) => void;
  onClose: () => void;
}

export default function HabitFormDialog({
  habit,
  categories,
  identities,
  habits,
  onSave,
  onClose,
}: HabitFormDialogProps) {
  const [form, setForm] = useState<HabitDraft>(() => {
    if (habit) return habit;
    const at = new Date();
    const start = Math.floor((at.getHours() * 60 + at.getMinutes()) / 5) * 5;
    return {
      name: "",
      categoryId: categories[0]?.id ?? UNCATEGORIZED_ID,
      end: null,
      startTime: minutesToTime(start),
      endTime: minutesToTime(start + 60),
      description: "",
      todos: [],
      resources: [],
      identityId: null,
      kind: "build",
      frequency: { kind: "daily" },
      metric: null,
      anchorHabitId: null,
      anchorText: null,
      remindTime: null,
      remindLead: null,
    };
  });
  const [lifetime, setLifetime] = useState(!habit?.end);

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("Give the habit a name first");
      return;
    }
    if (
      form.startTime &&
      form.endTime &&
      form.endTime !== "00:00" &&
      form.endTime <= form.startTime
    ) {
      toast.error("The end time must be after the start time");
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      end: lifetime ? null : form.end || null,
      metric:
        form.metric && form.metric.target > 0
          ? { target: form.metric.target, unit: form.metric.unit.trim() }
          : null,
      todos: form.todos
        .filter((todo) => todo.text.trim())
        .map((todo) => ({ ...todo, text: todo.text.trim() })),
      resources: form.resources
        .filter((resource) => resource.title.trim() && resource.url.trim())
        .map((resource) => ({
          ...resource,
          title: resource.title.trim(),
          url: resource.url.trim(),
        })),
    });
  };

  const addTodo = () =>
    setForm((prev) => ({
      ...prev,
      todos: [...prev.todos, { id: uid(), text: "", done: false }],
    }));

  const updateTodo = (id: string, text: string) =>
    setForm((prev) => ({
      ...prev,
      todos: prev.todos.map((todo) =>
        todo.id === id ? { ...todo, text } : todo,
      ),
    }));

  const removeTodo = (id: string) =>
    setForm((prev) => ({
      ...prev,
      todos: prev.todos.filter((todo) => todo.id !== id),
    }));

  const addResource = () =>
    setForm((prev) => ({
      ...prev,
      resources: [...prev.resources, { id: uid(), title: "", url: "" }],
    }));

  const updateResource = (id: string, patch: Partial<HabitResource>) =>
    setForm((prev) => ({
      ...prev,
      resources: prev.resources.map((resource) =>
        resource.id === id ? { ...resource, ...patch } : resource,
      ),
    }));

  const removeResource = (id: string) =>
    setForm((prev) => ({
      ...prev,
      resources: prev.resources.filter((resource) => resource.id !== id),
    }));

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle>
          <DialogDescription>
            Habits are time-bound — the live clock is compared against this
            window, and a new habit starts tracking from now.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              autoFocus
              placeholder="Read 20 pages"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="habit-description">Description</Label>
            <Textarea
              id="habit-description"
              placeholder="Why this habit matters, how to do it…"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="habit-category">Category</Label>
            <Select
              value={form.categoryId}
              onValueChange={(value) => setForm({ ...form, categoryId: value })}
            >
              <SelectTrigger id="habit-category" className="w-full">
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <CategoryBadge category={category} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={form.kind}
              onValueChange={(value) => {
                if (value) setForm({ ...form, kind: value as "build" | "limit" });
              }}
            >
              <ToggleGroupItem value="build">Build a habit</ToggleGroupItem>
              <ToggleGroupItem value="limit">Reduce a habit</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">
              For a habit you want to cut back on, a check-in means you resisted
              that day.
            </p>
          </div>

          {identities.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="habit-identity">Identity</Label>
              <Select
                value={form.identityId ?? "none"}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    identityId: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger id="habit-identity" className="w-full">
                  <SelectValue placeholder="No identity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No identity</SelectItem>
                  {identities.map((identity) => (
                    <SelectItem key={identity.id} value={identity.id}>
                      {identity.emoji} I am becoming {identity.statement}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Completing this habit casts a vote for the identity.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="habit-anchor">Stack after (optional)</Label>
            <Select
              value={form.anchorHabitId ?? "none"}
              onValueChange={(value) =>
                setForm({
                  ...form,
                  anchorHabitId: value === "none" ? null : value,
                })
              }
            >
              <SelectTrigger id="habit-anchor" className="w-full">
                <SelectValue placeholder="Select a habit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nothing</SelectItem>
                {anchorCandidates(habits, habit?.id).map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="…or a cue, e.g. After I brush my teeth"
              value={form.anchorText ?? ""}
              onChange={(e) =>
                setForm({ ...form, anchorText: e.target.value || null })
              }
            />
            <p className="text-xs text-muted-foreground">
              Tie this habit to an existing routine — “After X, I will Y”.
            </p>
          </div>

          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="habit-start-time">Scheduled from</Label>
                <TimeField
                  id="habit-start-time"
                  value={form.startTime}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, startTime: value }))
                  }
                  className="w-full"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="habit-end-time">Until</Label>
                <TimeField
                  id="habit-end-time"
                  value={form.endTime}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, endTime: value }))
                  }
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The habit shows as ongoing between these times. A timetable slot
              for the day takes precedence.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Frequency</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={form.frequency.kind}
              onValueChange={(value) => {
                if (!value) return;
                if (value === "daily") {
                  setForm((prev) => ({ ...prev, frequency: { kind: "daily" } }));
                } else if (value === "weekdays") {
                  setForm((prev) => ({
                    ...prev,
                    frequency: {
                      kind: "weekdays",
                      days:
                        prev.frequency.kind === "weekdays"
                          ? prev.frequency.days
                          : [1, 2, 3, 4, 5],
                    },
                  }));
                } else {
                  setForm((prev) => ({
                    ...prev,
                    frequency: {
                      kind: "weekly",
                      times:
                        prev.frequency.kind === "weekly"
                          ? prev.frequency.times
                          : 3,
                    },
                  }));
                }
              }}
              className="flex-wrap justify-start"
            >
              <ToggleGroupItem value="daily">Every day</ToggleGroupItem>
              <ToggleGroupItem value="weekdays">Specific days</ToggleGroupItem>
              <ToggleGroupItem value="weekly">Times per week</ToggleGroupItem>
            </ToggleGroup>

            {form.frequency.kind === "weekdays" && (
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                value={form.frequency.days.map(String)}
                onValueChange={(values) =>
                  setForm((prev) => ({
                    ...prev,
                    frequency: {
                      kind: "weekdays",
                      days: values
                        .map(Number)
                        .sort((a, b) => a - b),
                    },
                  }))
                }
                className="flex-wrap justify-start"
              >
                {WEEKDAY_CHIPS.map((chip) => (
                  <ToggleGroupItem
                    key={chip.value}
                    value={String(chip.value)}
                  >
                    {chip.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}

            {form.frequency.kind === "weekly" && (
              <Select
                value={String(form.frequency.times)}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    frequency: { kind: "weekly", times: Number(value) },
                  }))
                }
              >
                <SelectTrigger className="w-full" aria-label="Times per week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "time" : "times"} per week
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="habit-target">Daily target (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="habit-target"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="20"
                className="w-24"
                value={form.metric?.target ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (!raw) {
                    setForm((prev) => ({ ...prev, metric: null }));
                    return;
                  }
                  const target = Math.max(1, Math.round(Number(raw) || 0));
                  setForm((prev) => ({
                    ...prev,
                    metric: { target, unit: prev.metric?.unit ?? "" },
                  }));
                }}
              />
              <Input
                aria-label="Target unit"
                placeholder="pages, km, minutes…"
                disabled={!form.metric}
                value={form.metric?.unit ?? ""}
                onChange={(e) =>
                  setForm((prev) =>
                    prev.metric
                      ? { ...prev, metric: { ...prev.metric, unit: e.target.value } }
                      : prev,
                  )
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Track an amount (e.g. 20 pages). Leave blank for a simple done /
              not-done habit.
            </p>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="habit-remind"
                checked={form.remindTime !== null}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    remindTime:
                      checked === true ? form.startTime ?? "09:00" : null,
                  })
                }
              />
              <Label htmlFor="habit-remind" className="font-normal">
                Remind me at a time
              </Label>
            </div>
            {form.remindTime !== null && (
              <div className="flex items-center gap-2">
                <TimeField
                  id="habit-remind-time"
                  value={form.remindTime}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, remindTime: value }))
                  }
                  className="w-40"
                />
                <Select
                  value={String(form.remindLead ?? 0)}
                  onValueChange={(value) =>
                    setForm({ ...form, remindLead: Number(value) })
                  }
                >
                  <SelectTrigger className="w-full" aria-label="Reminder lead">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMIND_LEAD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              A cue fires at this time on days the habit is due.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="habit-lifetime"
              checked={lifetime}
              onCheckedChange={(checked) => setLifetime(checked === true)}
            />
            <Label htmlFor="habit-lifetime" className="font-normal">
              Lifetime habit (ongoing)
            </Label>
          </div>

          {!lifetime && (
            <div className="grid gap-2">
              <Label htmlFor="habit-end">Ends on</Label>
              <DateField
                id="habit-end"
                value={form.end}
                onChange={(value) => setForm((prev) => ({ ...prev, end: value }))}
              />
            </div>
          )}

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Todos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTodo}
              >
                <PlusIcon data-icon="inline-start" />
                Add todo
              </Button>
            </div>
            {form.todos.length ? (
              <div className="grid gap-2">
                {form.todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-2">
                    <Input
                      value={todo.text}
                      placeholder="Todo item"
                      onChange={(e) => updateTodo(todo.id, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove todo"
                      onClick={() => removeTodo(todo.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Optional checklist steps. Checking a todo off is for your own
                reference and isn&apos;t tracked in analytics.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Resources</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addResource}
              >
                <PlusIcon data-icon="inline-start" />
                Add resource
              </Button>
            </div>
            {form.resources.length ? (
              <div className="grid gap-2">
                {form.resources.map((resource) => (
                  <div key={resource.id} className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={resource.title}
                        placeholder="Title"
                        aria-label="Resource title"
                        onChange={(e) =>
                          updateResource(resource.id, { title: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove resource"
                        className="sm:hidden"
                        onClick={() => removeResource(resource.id)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={resource.url}
                        placeholder="https://…"
                        aria-label="Resource link"
                        inputMode="url"
                        onChange={(e) =>
                          updateResource(resource.id, { url: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove resource"
                        className="hidden sm:inline-flex"
                        onClick={() => removeResource(resource.id)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Optional links — a title and a URL — shown in the habit detail.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save habit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
