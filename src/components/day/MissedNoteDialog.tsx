"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import CategoryBadge from "../CategoryBadge";
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
import { Textarea } from "@/components/ui/textarea";
import { MISSED_PLAN_PRESETS, MISSED_REASON_PRESETS } from "@/lib/missed";
import { cn } from "@/lib/utils";
import type { Category, Habit, MissedEntry } from "@/types";

interface PresetChipsProps {
  options: string[];
  value: string;
  onPick: (value: string) => void;
  label: string;
}

function PresetChips({ options, value, onPick, label }: PresetChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((option) => {
        const active = value.trim() === option;
        return (
          <Button
            key={option}
            type="button"
            size="xs"
            variant={active ? "secondary" : "outline"}
            aria-pressed={active}
            className={cn("rounded-full", !active && "text-muted-foreground")}
            onClick={() => onPick(active ? "" : option)}
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
}

interface MissedNoteDialogProps {
  habit: Habit;
  category?: Category;
  date: string;
  entry?: MissedEntry;
  onSave: (patch: { reason: string; plan: string }) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function MissedNoteDialog({
  habit,
  category,
  date,
  entry,
  onSave,
  onClear,
  onClose,
}: MissedNoteDialogProps) {
  const [reason, setReason] = useState(entry?.reason ?? "");
  const [plan, setPlan] = useState(entry?.plan ?? "");

  const dateLabel = new Date(`${date}T00:00:00`).toDateString();

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="truncate">{habit.name}</span>
          </DialogTitle>
          <DialogDescription>
            Missed on {dateLabel}. Note why it slipped and how you&apos;ll cover
            it — you&apos;ll see this again tomorrow.
          </DialogDescription>
        </DialogHeader>

        {category && <CategoryBadge category={category} className="w-fit" />}

        <div className="space-y-2">
          <Label htmlFor="missed-reason">Why was it missed?</Label>
          <Textarea
            id="missed-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ran out of time after work…"
            className="min-h-16"
          />
          <PresetChips
            label="Common reasons"
            options={MISSED_REASON_PRESETS}
            value={reason}
            onPick={setReason}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="missed-plan">How will you cover it tomorrow?</Label>
          <Textarea
            id="missed-plan"
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            placeholder="Do it first thing, before anything else…"
            className="min-h-16"
          />
          <PresetChips
            label="Common plans"
            options={MISSED_PLAN_PRESETS}
            value={plan}
            onPick={setPlan}
          />
        </div>

        <DialogFooter className="flex-wrap">
          <Button
            type="button"
            variant="ghost"
            className="me-auto text-muted-foreground"
            onClick={() => {
              onClear();
              onClose();
            }}
          >
            <Trash2Icon data-icon="inline-start" />
            Clear missed mark
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave({ reason: reason.trim(), plan: plan.trim() });
              onClose();
            }}
          >
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
