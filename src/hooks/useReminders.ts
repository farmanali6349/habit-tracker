"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { Habit, HabitLogs } from "@/types";
import { today } from "@/lib/date";
import { playTone } from "@/lib/sound";
import { isActive } from "@/lib/stats";

interface Options {
  remind: boolean;
  rt: string;
  sound: boolean;
  tone: string;
  habits: Habit[];
  logs: HabitLogs;
  onRemindChange: (remind: boolean) => void;
}

export function useReminders({
  remind,
  rt,
  sound,
  tone,
  habits,
  logs,
  onRemindChange,
}: Options) {
  const toggleRemind = useCallback(() => {
    if (remind) {
      onRemindChange(false);
      return;
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notifications aren't supported in this browser");
      return;
    }
    Notification.requestPermission().then((permission) => {
      const granted = permission === "granted";
      onRemindChange(granted);
      if (granted) {
        toast.success("Reminders on", {
          description: "Works while this tab stays open.",
        });
      } else {
        toast.error("Notifications are blocked", {
          description: "Allow them in your browser settings to get reminders.",
        });
      }
    });
  }, [remind, onRemindChange]);

  useEffect(() => {
    if (!remind) return;

    const check = () => {
      const now = new Date();
      const [hh, mm] = (rt || "20:00").split(":");
      const due = now.getHours() * 60 + now.getMinutes() >= Number(hh) * 60 + Number(mm);
      if (!due || localStorage.getItem("ht_n") === today()) return;

      const t = today();
      const pending = habits.filter(
        (h) => isActive(h, t) && !(logs[h.id] && logs[h.id][t]),
      );
      if (!pending.length) return;

      const message = `${pending.length} still pending: ${pending
        .slice(0, 3)
        .map((h) => h.name)
        .join(", ")}`;

      if (sound) playTone(tone);
      toast("Habit reminder", { description: message });

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Habit reminder", { body: message });
      }
      try {
        localStorage.setItem("ht_n", t);
      } catch {
        /* ignore */
      }
    };

    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [remind, rt, sound, tone, logs, habits]);

  return { toggleRemind };
}
