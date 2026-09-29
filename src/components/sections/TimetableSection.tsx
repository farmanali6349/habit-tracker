"use client";

import { useMemo, useState } from "react";
import {
  CalendarRangeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  WandSparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import DateField from "@/components/DateField";
import DayTimeline from "@/components/schedule/DayTimeline";
import PlanVsActual from "@/components/schedule/PlanVsActual";
import ScheduleBar from "@/components/schedule/ScheduleBar";
import SlotDialog from "@/components/schedule/SlotDialog";
import SlotList from "@/components/schedule/SlotList";
import TimetableDialog from "@/components/schedule/TimetableDialog";
import { useApp } from "@/components/shell/AppProvider";
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
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNow } from "@/hooks/useNow";
import { addDays, today } from "@/lib/date";
import { MINUTES_PER_DAY, formatDuration, minutesToTime } from "@/lib/day";
import {
  buildPlanComparison,
  emptySlotCount,
  formatSlotTime,
  gapsAsSlots,
  overlappingSlotIds,
  slotDuration,
  sortSlots,
  timetableRangeLabel,
  totalScheduledMinutes,
} from "@/lib/timetable";
import { uid } from "@/lib/stats";
import type { TimeSlot, TimeSlotDraft, TimeTable, TimeTableDraft } from "@/types";

interface SlotEditor {
  slot: TimeSlot | null;
  preset?: { start: string; end: string };
}

export default function TimetableSection() {
  const {
    state,
    saveTimetable,
    deleteTimetable,
    addSlots,
    updateSlot,
    deleteSlot,
  } = useApp();
  const { habits, categories, logs, timetables } = state;

  const t = today();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slotEditor, setSlotEditor] = useState<SlotEditor | null>(null);
  const [showTimetableDialog, setShowTimetableDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TimeTable | null>(null);
  const [date, setDate] = useState(t);

  const selected = useMemo(
    () =>
      timetables.find((table) => table.id === selectedId) ??
      timetables[0] ??
      null,
    [timetables, selectedId],
  );

  const slots = useMemo(
    () => (selected ? sortSlots(selected.slots) : []),
    [selected],
  );
  const overlapping = useMemo(() => overlappingSlotIds(slots), [slots]);
  const comparison = useMemo(
    () => buildPlanComparison(date, timetables, habits, categories, logs),
    [date, timetables, habits, categories, logs],
  );

  const now = useNow();
  const nowMinutes = date === now.date ? now.minutes : null;

  const coveredMinutes = slots.reduce(
    (sum, slot) => sum + slotDuration(slot),
    0,
  );
  const stats = [
    { label: "Slots", value: String(slots.length) },
    { label: "Empty", value: String(emptySlotCount(slots)) },
    { label: "Scheduled", value: formatDuration(totalScheduledMinutes(slots)) },
    {
      label: "Day covered",
      value: `${Math.min(
        100,
        Math.round((coveredMinutes / MINUTES_PER_DAY) * 100),
      )}%`,
    },
  ];

  const handleSaveSlot = (draft: TimeSlotDraft) => {
    if (!selected) return;
    if (draft.id) updateSlot(selected.id, draft.id, draft);
    else addSlots(selected.id, [draft]);
    setSlotEditor(null);
  };

  const handleDeleteSlot = (slot: TimeSlot) => {
    if (!selected) return;
    const timetableId = selected.id;
    deleteSlot(timetableId, slot.id);
    toast("Slot removed", {
      description: formatSlotTime(slot),
      action: { label: "Undo", onClick: () => addSlots(timetableId, [slot]) },
    });
  };

  const handleFillGaps = () => {
    if (!selected) return;
    const gaps = gapsAsSlots(selected.slots);
    if (!gaps.length) {
      toast.info("There are no gaps left to fill");
      return;
    }
    addSlots(selected.id, gaps);
    toast.success(
      `Added ${gaps.length} empty ${gaps.length === 1 ? "slot" : "slots"}`,
    );
  };

  const handleDuplicate = () => {
    if (!selected) return;
    saveTimetable({
      name: `${selected.name} copy`,
      from: t,
      to: null,
      slots: selected.slots.map((slot) => ({ ...slot, id: uid() })),
    });
    toast.success("Timetable duplicated");
  };

  const handleSaveTimetable = (draft: TimeTableDraft) => {
    saveTimetable(draft);
    setShowTimetableDialog(false);
    toast.success(draft.id ? "Timetable updated" : "Timetable created");
  };

  const handleAddAt = (startMinutes: number) => {
    setSlotEditor({
      slot: null,
      preset: {
        start: minutesToTime(startMinutes),
        end: minutesToTime(Math.min(MINUTES_PER_DAY, startMinutes + 60)),
      },
    });
  };

  const daysAgo = date === t ? null : date < t ? "in the past" : "upcoming";

  if (!selected) {
    return (
      <>
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarRangeIcon />
            </EmptyMedia>
            <EmptyTitle>No timetables yet</EmptyTitle>
            <EmptyDescription>
              A timetable maps habits onto the hours of your day. Create one,
              then fill its slots and mark the rest as empty.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setShowTimetableDialog(true)}>
              <PlusIcon data-icon="inline-start" />
              New timetable
            </Button>
          </EmptyContent>
        </Empty>

        {showTimetableDialog && (
          <TimetableDialog
            timetable={null}
            onSave={handleSaveTimetable}
            onClose={() => setShowTimetableDialog(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selected.id} onValueChange={setSelectedId}>
          <SelectTrigger
            size="sm"
            className="w-full sm:w-56"
            aria-label="Timetable"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timetables.map((table) => (
              <SelectItem key={table.id} value={table.id}>
                {table.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="outline" className="text-muted-foreground">
          {timetableRangeLabel(selected)}
        </Badge>

        <div className="ms-auto flex flex-wrap items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTimetableDialog(true)}
          >
            <PlusIcon data-icon="inline-start" />
            New
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <CopyIcon data-icon="inline-start" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTimetableDialog(true)}
          >
            <PencilIcon data-icon="inline-start" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => setPendingDelete(selected)}
          >
            <TrashIcon data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div className="font-heading text-xl font-semibold tabular-nums">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Day at a glance</CardTitle>
          <CardDescription>
            {selected.name} · {timetableRangeLabel(selected)}
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={() => setSlotEditor({ slot: null })}
              >
                <PlusIcon data-icon="inline-start" />
                Add slot
              </Button>
              <Button variant="outline" size="sm" onClick={handleFillGaps}>
                <WandSparklesIcon data-icon="inline-start" />
                Fill time
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ScheduleBar slots={slots} habits={habits} categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Whole day</CardTitle>
          <CardDescription>
            Click a block to edit it, or click empty space to add a slot there.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DayTimeline
            slots={slots}
            habits={habits}
            categories={categories}
            nowMinutes={nowMinutes}
            onEditSlot={(slot) => setSlotEditor({ slot })}
            onAddAt={handleAddAt}
          />
        </CardContent>
      </Card>

      {slots.length ? (
        <SlotList
          slots={slots}
          habits={habits}
          categories={categories}
          overlapping={overlapping}
          onAssign={(slotId, habitId) =>
            updateSlot(selected.id, slotId, { habitId })
          }
          onEdit={(slot) => setSlotEditor({ slot })}
          onDelete={handleDeleteSlot}
        />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarRangeIcon />
            </EmptyMedia>
            <EmptyTitle>No slots in this timetable</EmptyTitle>
            <EmptyDescription>
              Click the day grid above to add a slot, or fill the whole day at
              once and mark the spare hours as empty.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={handleFillGaps}>
              <WandSparklesIcon data-icon="inline-start" />
              Fill remaining time
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous day"
              onClick={() => setDate(addDays(date, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next day"
              disabled={date >= t}
              onClick={() => setDate(addDays(date, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          <div className="me-auto">
            <div className="font-heading text-sm font-medium">
              {new Date(`${date}T00:00:00`).toDateString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {daysAgo ?? "Today"}
            </div>
          </div>
          <DateField
            value={date}
            onChange={(value) => {
              if (value) setDate(value);
            }}
            placeholder="Jump to a date"
            className="w-44"
          />
          {date !== t && (
            <Button variant="ghost" size="sm" onClick={() => setDate(t)}>
              Today
            </Button>
          )}
        </div>

        <PlanVsActual comparison={comparison} />
      </div>

      {slotEditor && (
        <SlotDialog
          slot={slotEditor.slot}
          preset={slotEditor.preset}
          habits={habits}
          onSave={handleSaveSlot}
          onClose={() => setSlotEditor(null)}
        />
      )}

      {showTimetableDialog && (
        <TimetableDialog
          timetable={selected}
          onSave={handleSaveTimetable}
          onClose={() => setShowTimetableDialog(false)}
        />
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the timetable and its{" "}
              {pendingDelete?.slots.length ?? 0} slots. Habits and check-ins are
              not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep timetable</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) deleteTimetable(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete timetable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
