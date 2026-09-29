"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

const NAV_KEY = "ht_nav";

const listeners = new Set<() => void>();

let collapsed = false;
let hydrated = false;

const read = (): boolean => {
  try {
    return localStorage.getItem(NAV_KEY) === "1";
  } catch {
    return false;
  }
};

const getSnapshot = (): boolean => {
  if (!hydrated) {
    collapsed = read();
    hydrated = true;
  }
  return collapsed;
};

const getServerSnapshot = (): boolean => false;

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const setCollapsed = (value: boolean): void => {
  collapsed = value;
  try {
    localStorage.setItem(NAV_KEY, value ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
  listeners.forEach((listener) => listener());
};

/**
 * Persisted desktop sidebar state, plus a global Ctrl/Cmd+B shortcut. `collapsed`
 * is a shared external store so the rail and anything else stay in sync.
 */
export function useSidebar() {
  const isCollapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = useCallback(() => setCollapsed(!collapsed), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setCollapsed(!collapsed);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { collapsed: isCollapsed, toggle, setCollapsed };
}
