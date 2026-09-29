"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
} from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import TimeField from "@/components/TimeField";
import { useApp } from "@/components/shell/AppProvider";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CATEGORY_COLORS, UNCATEGORIZED_ID } from "@/lib/categories";
import { minutesToTime, timeToMinutes } from "@/lib/day";
import { DEFAULT_IDENTITY_EMOJI, IDENTITY_EMOJIS } from "@/lib/identity";
import { uid } from "@/lib/stats";
import type { HabitDraft } from "@/types";

const IDENTITY_PRESETS = [
  "a healthy person",
  "a runner",
  "a reader",
  "a calm person",
  "an early riser",
];

const STEP_TITLES = ["Welcome", "Identity", "First habit", "Cues"];

export default function OnboardingDialog({ onClose }: { onClose: () => void }) {
  const {
    state,
    saveIdentity,
    saveHabit,
    setProfile,
    setRemind,
    setReminderTime,
    setOnboarded,
  } = useApp();
  const { categories, identities } = state;

  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.profile.displayName);
  const [partner, setPartner] = useState(state.profile.partnerName);
  const [statement, setStatement] = useState(IDENTITY_PRESETS[0]);
  const [emoji, setEmoji] = useState(DEFAULT_IDENTITY_EMOJI);
  const [firstIdentityId, setFirstIdentityId] = useState<string | null>(null);
  const [habitName, setHabitName] = useState("");
  const [categoryId, setCategoryId] = useState(
    categories[0]?.id ?? UNCATEGORIZED_ID,
  );
  const [cueTime, setCueTime] = useState("08:00");
  const [remindOn, setRemindOn] = useState(true);
  const [rt, setRt] = useState(state.rt);

  const finish = () => {
    setOnboarded(true);
    onClose();
  };

  const next = () => {
    if (step === 0) {
      setProfile({ displayName: name.trim(), partnerName: partner.trim() });
      setStep(1);
      return;
    }
    if (step === 1) {
      const trimmed = statement.trim();
      if (trimmed && !identities.some((i) => i.statement === trimmed)) {
        const id = uid();
        saveIdentity({
          id,
          statement: trimmed,
          emoji,
          color:
            CATEGORY_COLORS[identities.length % CATEGORY_COLORS.length].value,
        });
        setFirstIdentityId(id);
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (habitName.trim()) {
        const draft: HabitDraft = {
          name: habitName.trim(),
          categoryId,
          end: null,
          startTime: cueTime,
          endTime: minutesToTime(timeToMinutes(cueTime) + 60),
          description: "",
          todos: [],
          resources: [],
          identityId: firstIdentityId,
          kind: "build",
          frequency: { kind: "daily" },
          metric: null,
          anchorHabitId: null,
          anchorText: null,
          remindTime: null,
          remindLead: null,
        };
        saveHabit(draft);
      }
      setStep(3);
      return;
    }
    setRemind(remindOn);
    setReminderTime(rt);
    finish();
  };

  const canContinue =
    step !== 2 || habitName.trim().length > 0;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) finish();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-warning" />
            {STEP_TITLES[step]}
            <span className="ms-auto text-xs font-normal text-muted-foreground">
              {step + 1} / {STEP_TITLES.length}
            </span>
          </DialogTitle>
          <DialogDescription>
            Atomic Habits: start with identity and an obvious cue, then make it
            easy.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {step === 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                Let&apos;s set up the essentials. Two minutes now saves you from
                drifting later.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="onboard-name">What should I call you?</Label>
                <Input
                  id="onboard-name"
                  autoFocus
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="onboard-partner">
                  Accountability partner (optional)
                </Label>
                <Input
                  id="onboard-partner"
                  placeholder="Someone who'll check in on you"
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">
                Who do you want to become? Habits are votes for this identity.
              </p>
              <div className="grid gap-2">
                <Label>Pick one, or write your own</Label>
                <div className="flex flex-wrap gap-1.5">
                  {IDENTITY_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      size="sm"
                      variant={statement === preset ? "default" : "outline"}
                      onClick={() => setStatement(preset)}
                    >
                      I am becoming {preset}
                    </Button>
                  ))}
                </div>
                <Input
                  aria-label="Identity statement"
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Emoji</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={emoji}
                  onValueChange={(value) => {
                    if (value) setEmoji(value);
                  }}
                  className="flex-wrap justify-start"
                >
                  {IDENTITY_EMOJIS.map((value) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      size="sm"
                      aria-label={value}
                      className="size-8 p-0 text-base"
                    >
                      {value}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                Now one habit that votes for that identity. Keep it small — you
                can add more later.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="onboard-habit">Habit</Label>
                <Input
                  id="onboard-habit"
                  autoFocus
                  placeholder="Read 10 pages"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="onboard-category">Category</Label>
                <Select
                  value={categoryId}
                  onValueChange={(value) => setCategoryId(value)}
                >
                  <SelectTrigger id="onboard-category" className="w-full">
                    <SelectValue />
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
                <Label htmlFor="onboard-cue">When will you do it?</Label>
                <TimeField
                  id="onboard-cue"
                  value={cueTime}
                  onChange={setCueTime}
                  className="w-40"
                />
                <p className="text-xs text-muted-foreground">
                  A specific time makes the cue obvious. You can also stack it
                  after another habit later.
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label htmlFor="onboard-remind" className="font-normal">
                    Turn on reminders
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Cues while the app is open.
                  </p>
                </div>
                <Switch
                  id="onboard-remind"
                  checked={remindOn}
                  onCheckedChange={setRemindOn}
                />
              </div>
              {remindOn && (
                <div className="grid gap-2">
                  <Label htmlFor="onboard-rt" className="text-xs text-muted-foreground">
                    End-of-day check-in
                  </Label>
                  <TimeField
                    id="onboard-rt"
                    value={rt}
                    onChange={setRt}
                    className="w-40"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeftIcon data-icon="inline-start" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={finish}>
              Skip setup
            </Button>
          )}
          <Button onClick={next} disabled={!canContinue}>
            {step === STEP_TITLES.length - 1 ? (
              <>
                <CheckIcon data-icon="inline-start" />
                Finish
              </>
            ) : (
              <>
                Next
                <ArrowRightIcon data-icon="inline-end" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
