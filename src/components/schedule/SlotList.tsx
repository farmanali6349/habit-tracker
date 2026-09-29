"use client";

import { PencilIcon, TrashIcon } from "lucide-react";
import CategoryIcon from "../CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDuration } from "@/lib/day";
import { formatSlotTime, slotDuration } from "@/lib/timetable";
import { cn } from "@/lib/utils";
import type { Category, Habit, TimeSlot } from "@/types";

const NONE = "__empty__";

interface SlotListProps {
  slots: TimeSlot[];
  habits: Habit[];
  categories: Category[];
  overlapping: Set<string>;
  onAssign: (slotId: string, habitId: string | null) => void;
  onEdit: (slot: TimeSlot) => void;
  onDelete: (slot: TimeSlot) => void;
}

export default function SlotList({
  slots,
  habits,
  categories,
  overlapping,
  onAssign,
  onEdit,
  onDelete,
}: SlotListProps) {
  const habitById = new Map(habits.map((habit) => [habit.id, habit]));
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  return (
    <ul className="divide-y overflow-hidden rounded-xl border">
      {slots.map((slot) => {
        const habit = slot.habitId ? habitById.get(slot.habitId) : undefined;
        const category = habit ? categoryById.get(habit.categoryId) : undefined;

        return (
          <li
            key={slot.id}
            className={cn(
              "flex flex-wrap items-center gap-2 p-2.5",
              !habit && "bg-muted/30",
            )}
          >
            <span className="w-28 shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatSlotTime(slot)}
            </span>

            {category && (
              <CategoryIcon
                name={category.icon}
                aria-hidden
                className="size-3.5 shrink-0"
                style={{ color: category.color }}
              />
            )}

            <Select
              value={slot.habitId ?? NONE}
              onValueChange={(value) =>
                onAssign(slot.id, value === NONE ? null : value)
              }
            >
              <SelectTrigger
                size="sm"
                className="w-full max-w-56"
                aria-label={`Habit for the ${formatSlotTime(slot)} slot`}
              >
                <SelectValue placeholder="Empty slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>
                  <span className="text-muted-foreground">Empty slot</span>
                </SelectItem>
                {habits.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {overlapping.has(slot.id) && (
              <Badge variant="destructive">Overlap</Badge>
            )}

            <span className="ms-auto text-xs tabular-nums text-muted-foreground">
              {formatDuration(slotDuration(slot))}
            </span>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit slot ${formatSlotTime(slot)}`}
              onClick={() => onEdit(slot)}
            >
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete slot ${formatSlotTime(slot)}`}
              onClick={() => onDelete(slot)}
            >
              <TrashIcon />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
