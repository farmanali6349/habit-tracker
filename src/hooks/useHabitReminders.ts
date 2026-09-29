"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { isScheduled, isSkipped } from "@/lib/cadence";
import { today } from "@/lib/date";
import { timeToMinutes } from "@/lib/day";
import { playTone } from "@/lib/sound";
import type { Habit, HabitLogs, SkipLog } from "@/types";

/** Minutes past a trigger during which a reminder may still fire. */
const GRACE_MINUTES = 5;
const SNOOZE_MINUTES = 10;
const TICK_MS = 30_000;
const KEY_PREFIX = "ht_rem_h";
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
  /** Fallback lead when a habit has no per-habit override. */
  defaultLead: number;
  sound: boolean;
  tone: string;
  habits: Habit[];
  logs: HabitLogs;
  skips: SkipLog;
  /** Wake-time adjustment applied to the whole day's schedule. */
  shiftMinutes: number;
  onToggleLog: (id: string, date: string) => void;
}

/**
 * Fires an in-app + browser cue at each habit's own reminder time (once a few
 * minutes before and once at the time). Fired alerts are remembered per day so
 * reopening the app doesn't repeat them; "Snooze" re-arms one.
 */
export function useHabitReminders({
  enabled,
  defaultLead,
  sound,
  tone,
  habits,
  logs,
  skips,
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

      for (const habit of habits) {
        if (
          !habit.remindTime ||
          !isScheduled(habit, t) ||
          isSkipped(skips, habit.id, t) ||
          logs[habit.id]?.[t]
        ) {
          continue;
        }

        const at = timeToMinutes(habit.remindTime) + shiftMinutes;
        const lead = habit.remindLead ?? defaultLead;
        const triggers: { kind: "lead" | "start"; at: number }[] = [];
        if (lead > 0 && at - lead >= 0) {
          triggers.push({ kind: "lead", at: at - lead });
        }
        triggers.push({ kind: "start", at });

        for (const trigger of triggers) {
          const key = `${KEY_PREFIX}:${t}:${habit.id}:${trigger.kind}`;
          const state = readKey(key);
          if (state === DONE) continue;

          let due = false;
          if (state === null) {
            const inWindow =
              nowMin >= trigger.at && nowMin <= trigger.at + GRACE_MINUTES;
            due = inWindow && (trigger.kind === "start" || nowMin < at);
          } else {
            const snoozeAt = Number(state);
            due =
              Number.isFinite(snoozeAt) &&
              nowMs >= snoozeAt &&
              nowMs <= snoozeAt + GRACE_MINUTES * 60_000;
          }
          if (!due) continue;

          writeKey(key, DONE);
          if (sound) playTone(tone);

          const title =
            trigger.kind === "lead"
              ? `${habit.name} in ${lead} min`
              : `${habit.name} now`;

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(title, { tag: key, body: "Time for your habit" });
            } catch {
              /* some browsers require a service worker */
            }
          }

          toast(title, {
            description: "Time for your habit",
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
  }, [enabled, defaultLead, sound, tone, habits, logs, skips, shiftMinutes, onToggleLog]);
}
