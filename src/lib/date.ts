export const pad2 = (n: number): string => String(n).padStart(2, "0");

export const dateStr = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const today = (): string => dateStr(new Date());

export const addDays = (s: string, n: number): string => {
  const d = new Date(s + "T00:00:00");
  d.setDate(d.getDate() + n);
  return dateStr(d);
};

export const diffDays = (a: string, b: string): number =>
  Math.round(
    (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 864e5,
  );

/** Local "YYYY-MM-DD" + "HH:MM" → ISO timestamp of that wall-clock moment. */
export const isoFromTime = (date: string, time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};
