"use client";

import { useState } from "react";
import { toast } from "sonner";
import DateField from "../DateField";
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
import { today } from "@/lib/date";
import type { TimeTable, TimeTableDraft } from "@/types";

interface TimetableDialogProps {
  timetable: TimeTable | null;
  onSave: (draft: TimeTableDraft) => void;
  onClose: () => void;
}

export default function TimetableDialog({
  timetable,
  onSave,
  onClose,
}: TimetableDialogProps) {
  const [name, setName] = useState(timetable?.name ?? "");
  const [from, setFrom] = useState<string | null>(timetable?.from ?? today());
  const [to, setTo] = useState<string | null>(timetable?.to ?? null);
  const [ongoing, setOngoing] = useState(
    timetable ? timetable.to === null : false,
  );

  const submit = () => {
    if (!name.trim()) {
      toast.error("Give the timetable a name");
      return;
    }
    if (!from) {
      toast.error("Pick a start date");
      return;
    }
    if (!ongoing && !to) {
      toast.error("Pick an end date, or mark the timetable as ongoing");
      return;
    }
    if (!ongoing && to && to < from) {
      toast.error("The end date can't be before the start date");
      return;
    }
    onSave({
      id: timetable?.id,
      name: name.trim(),
      from,
      to: ongoing ? null : to,
    });
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
          <DialogTitle>{timetable ? "Edit timetable" : "New timetable"}</DialogTitle>
          <DialogDescription>
            A timetable applies to every day in its date range. Where ranges
            overlap, the most recent one wins.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="timetable-name">Name</Label>
            <Input
              id="timetable-name"
              autoFocus
              placeholder="Weekdays"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="timetable-from">Starts on</Label>
            <DateField id="timetable-from" value={from} onChange={setFrom} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="timetable-ongoing"
              checked={ongoing}
              onCheckedChange={(checked) => setOngoing(checked === true)}
            />
            <Label htmlFor="timetable-ongoing" className="font-normal">
              Ongoing (no end date)
            </Label>
          </div>

          {!ongoing && (
            <div className="grid gap-2">
              <Label htmlFor="timetable-to">Ends on</Label>
              <DateField
                id="timetable-to"
                value={to}
                onChange={setTo}
                placeholder="Pick an end date"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            {timetable ? "Save timetable" : "Create timetable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
