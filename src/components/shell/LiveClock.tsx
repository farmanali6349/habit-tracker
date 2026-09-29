"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let now = 0;
let timer: ReturnType<typeof setInterval> | null = null;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (timer === null) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
};

const getSnapshot = () => now;
const getServerSnapshot = () => 0;

export default function LiveClock() {
  const timestamp = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!timestamp) {
    return (
      <span
        aria-hidden
        className="inline-block h-3 w-48 rounded bg-muted/60 align-middle"
      />
    );
  }

  const at = new Date(timestamp);
  const date = at.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = at.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const region = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <span className="tabular-nums">
      {date} · <time dateTime={at.toISOString()}>{time}</time>
      <span className="text-muted-foreground/70"> · {region}</span>
    </span>
  );
}
