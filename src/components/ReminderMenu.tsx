"use client";

import { BellIcon, PlayIcon, XIcon } from "lucide-react";
import { useApp } from "@/components/shell/AppProvider";
import TimeField from "@/components/TimeField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TONES, playTone, primeAudio } from "@/lib/sound";

const LEAD_OPTIONS = [
  { value: "0", label: "At start only" },
  { value: "1", label: "1 minute before" },
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
];

export default function ReminderMenu() {
  const {
    state,
    toggleRemind,
    setRemind,
    setReminderTime,
    setRemindSound,
    setRemindTone,
    setRemindLead,
    saveHabit,
  } = useApp();
  const { remind, rt, remindSound, remindTone, remindLead, habits } = state;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Reminder settings"
          className="relative"
        >
          <BellIcon data-icon="inline-start" />
          <span className="hidden sm:inline">Remind</span>
          {remind && (
            <span
              aria-hidden
              className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-success ring-2 ring-background"
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle>Reminders</PopoverTitle>
          <PopoverDescription>
            Alerts for habit times and timetable slots.
          </PopoverDescription>
        </PopoverHeader>

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="remind-toggle" className="font-normal">
            Reminders on
          </Label>
          <Switch
            id="remind-toggle"
            checked={remind}
            onCheckedChange={(next) => (next ? toggleRemind() : setRemind(false))}
          />
        </div>

        {remind && (
          <>
            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">
                Heads-up before a slot
              </Label>
              <Select
                value={String(remindLead)}
                onValueChange={(value) => setRemindLead(Number(value))}
              >
                <SelectTrigger className="w-full" aria-label="Reminder lead time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="remind-sound" className="font-normal">
                Sound
              </Label>
              <Switch
                id="remind-sound"
                checked={remindSound}
                onCheckedChange={setRemindSound}
              />
            </div>

            {remindSound && (
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Tone</Label>
                <div className="flex items-center gap-1.5">
                  <Select value={remindTone} onValueChange={setRemindTone}>
                    <SelectTrigger className="w-full" aria-label="Reminder tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone.id} value={tone.id}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Play the selected tone"
                    onClick={() => {
                      primeAudio();
                      playTone(remindTone);
                    }}
                  >
                    <PlayIcon />
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-2 border-t pt-2.5">
              <Label htmlFor="remind-eod" className="text-xs text-muted-foreground">
                End-of-day check-in
              </Label>
              <TimeField
                id="remind-eod"
                value={rt}
                onChange={setReminderTime}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                A nudge if habits are still pending.
              </p>
            </div>

            {habits.length > 0 && (
              <div className="grid gap-2 border-t pt-2.5">
                <Label className="text-xs text-muted-foreground">
                  Per-habit cues
                </Label>
                <div className="max-h-48 space-y-1.5 overflow-y-auto pe-1">
                  {habits.map((habit) => (
                    <div key={habit.id} className="flex items-center gap-2">
                      <span
                        className="min-w-0 flex-1 truncate text-xs"
                        title={habit.name}
                      >
                        {habit.name}
                      </span>
                      <TimeField
                        value={habit.remindTime}
                        onChange={(value) =>
                          saveHabit({ ...habit, remindTime: value })
                        }
                        placeholder="Set time"
                        className="h-7 w-28 text-xs"
                      />
                      {habit.remindTime && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Clear reminder for ${habit.name}`}
                          onClick={() =>
                            saveHabit({ ...habit, remindTime: null })
                          }
                        >
                          <XIcon />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
