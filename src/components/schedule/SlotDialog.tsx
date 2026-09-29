"use client";

import { useState } from "react";
import { toast } from "sonner";
import TimeField from "../TimeField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTime } from "@/lib/day";
import { isValidSlot } from "@/lib/timetable";
import type { Habit, TimeSlot, TimeSlotDraft } from "@/types";

const NONE = "__empty__";

interface SlotDialogProps {
  slot: TimeSlot | null;
  /** Prefills the times when adding a new slot from the day grid. */
  preset?: { start: string; end: string } | null;
  habits: Habit[];
  onSave: (draft: TimeSlotDraft) => void;
  onClose: () => void;
}

export default function SlotDialog({
  slot,
  preset,
  habits,
  onSave,
  onClose,
}: SlotDialogProps) {
  const [start, setStart] = useState(slot?.start ?? preset?.start ?? "09:00");
  const [end, setEnd] = useState(slot?.end ?? preset?.end ?? "10:00");
  const [habitId, setHabitId] = useState<string | null>(slot?.habitId ?? null);

  const submit = () => {
    if (!isValidSlot(start, end)) {
      toast.error("The end time must be after the start time");
      return;
    }
    onSave({ id: slot?.id, start, end, habitId });
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{slot ? "Edit slot" : "New slot"}</DialogTitle>
          <DialogDescription>
            Slots can be any length. Leave the habit unset to mark the time as
            empty.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="slot-start">Starts</Label>
              <TimeField
                id="slot-start"
                value={start}
                onChange={setStart}
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slot-end">Ends</Label>
              <TimeField
                id="slot-end"
                value={end}
                onChange={setEnd}
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatTime(start)} – {formatTime(end)}
            </p>
            <p className="text-xs text-muted-foreground">
              Use 12:00 AM as the end time when a slot runs until midnight.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slot-habit">Habit</Label>
            <Select
              value={habitId ?? NONE}
              onValueChange={(value) => setHabitId(value === NONE ? null : value)}
            >
              <SelectTrigger id="slot-habit" className="w-full">
                <SelectValue placeholder="Empty slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>
                  <span className="text-muted-foreground">Empty slot</span>
                </SelectItem>
                {habits.map((habit) => (
                  <SelectItem key={habit.id} value={habit.id}>
                    {habit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{slot ? "Save slot" : "Add slot"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
