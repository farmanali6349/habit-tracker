"use client";

import { useEffect, useState } from "react";
import { dateStr } from "@/lib/date";

export interface NowMoment {
  /** Local "YYYY-MM-DD". */
  date: string;
  /** Minutes past midnight, local. */
  minutes: number;
}

const read = (): NowMoment => {
  const at = new Date();
  return { date: dateStr(at), minutes: at.getHours() * 60 + at.getMinutes() };
};

/**
 * A live clock at minute resolution, so time-bound views re-render as the day
 * moves. Ticks every `intervalMs` (30s by default).
 */
export function useNow(intervalMs = 30_000): NowMoment {
  const [now, setNow] = useState<NowMoment>(read);

  useEffect(() => {
    const id = window.setInterval(() => setNow(read()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
