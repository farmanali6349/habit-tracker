"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { playTone } from "@/lib/sound";
import { today } from "@/lib/date";
import {
  activeTimetableFor,
  formatSlotTime,
  slotStartMinutes,
} from "@/lib/timetable";
import { isActive } from "@/lib/stats";
import type { Habit, HabitLogs, TimeTable } from "@/types";

/** Minutes past a trigger during which a reminder may still fire. */
const GRACE_MINUTES = 5;
const SNOOZE_MINUTES = 10;
const TICK_MS = 30_000;
const KEY_PREFIX = "ht_rem";
const DONE = "done";

const readKey = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeKey = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
};

interface Options {
  enabled: boolean;
  /** Minutes before a slot for the heads-up alert (0 = start only). */
  lead: number;
  sound: boolean;
  tone: string;
  timetables: TimeTable[];
  habits: Habit[];
  logs: HabitLogs;
  /** Wake-time adjustment applied to the whole day's schedule. */
  shiftMinutes: number;
  onToggleLog: (id: string, date: string) => void;
}

/**
 * Fires an in-app + browser reminder as each of today's planned timetable slots
 * comes up: once a few minutes before, and once at the start. Sound is played
 * via the Web Audio chime. Fired alerts are remembered per day so reopening the
 * app doesn't repeat them; "Snooze" re-arms one.
 */
export function useTimetableReminders({
  enabled,
  lead,
  sound,
  tone,
  timetables,
  habits,
  logs,
  shiftMinutes,
  onToggleLog,
}: Options) {
  useEffect(() => {
    if (!enabled) return;

    const check = () => {
      const now = new Date();
      const t = today();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const nowMs = now.getTime();
      const table = activeTimetableFor(t, timetables);
      if (!table) return;

      const habitById = new Map(habits.map((habit) => [habit.id, habit]));

      for (const slot of table.slots) {
        const habit = slot.habitId ? habitById.get(slot.habitId) : undefined;
        if (!habit || !isActive(habit, t) || logs[habit.id]?.[t]) continue;

        const start = slotStartMinutes(slot) + shiftMinutes;
        const triggers: { kind: "lead" | "start"; at: number }[] = [];
        if (lead > 0 && start - lead >= 0) {
          triggers.push({ kind: "lead", at: start - lead });
        }
        triggers.push({ kind: "start", at: start });

        for (const trigger of triggers) {
          const key = `${KEY_PREFIX}:${t}:${slot.id}:${trigger.kind}`;
          const state = readKey(key);
          if (state === DONE) continue;

          let due = false;
          if (state === null) {
            const inWindow =
              nowMin >= trigger.at && nowMin <= trigger.at + GRACE_MINUTES;
            // The heads-up must still be before the slot actually starts.
            due = inWindow && (trigger.kind === "start" || nowMin < start);
          } else {
            const at = Number(state);
            due =
              Number.isFinite(at) &&
              nowMs >= at &&
              nowMs <= at + GRACE_MINUTES * 60_000;
          }
          if (!due) continue;

          writeKey(key, DONE);
          if (sound) playTone(tone);

          const title =
            trigger.kind === "lead"
              ? `${habit.name} in ${lead} min`
              : `${habit.name} now`;
          const body = `Planned ${formatSlotTime(slot)}`;

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(title, { body, tag: key });
            } catch {
              /* some browsers require a service worker */
            }
          }

          toast(title, {
            description: body,
            duration: 20_000,
            action: {
              label: "Done",
              onClick: () => onToggleLog(habit.id, t),
            },
            cancel: {
              label: "Snooze 10m",
              onClick: () =>
                writeKey(key, String(Date.now() + SNOOZE_MINUTES * 60_000)),
            },
          });
        }
      }
    };

    check();
    const id = window.setInterval(check, TICK_MS);
    return () => window.clearInterval(id);
  }, [enabled, lead, sound, tone, timetables, habits, logs, shiftMinutes, onToggleLog]);
}
