/**
 * Time-of-day sky used behind the timetable day grid. Everything is derived from
 * the hour so the gradient, stars and glyphs line up with the 24-hour blocks.
 */

export interface SkyStop {
  /** Percent down the day (0 = 00:00, 100 = 24:00). */
  at: number;
  color: string;
}

const hour = (h: number): number => (h / 24) * 100;

/** Deep night → dawn → day → sunset → night, so each hour reads its light. */
export const SKY_STOPS: SkyStop[] = [
  { at: hour(0), color: "#070b1c" },
  { at: hour(3.5), color: "#0b1230" },
  { at: hour(5), color: "#242a52" },
  { at: hour(6), color: "#7d4a7a" },
  { at: hour(7), color: "#e0793f" },
  { at: hour(8), color: "#f0b25f" },
  { at: hour(9.5), color: "#8fc0e8" },
  { at: hour(12), color: "#57a6e2" },
  { at: hour(15), color: "#63b0e6" },
  { at: hour(17), color: "#f0b25f" },
  { at: hour(18), color: "#e9743c" },
  { at: hour(19), color: "#8a4a72" },
  { at: hour(20), color: "#3a2f5c" },
  { at: hour(21), color: "#131a3a" },
  { at: hour(24), color: "#070b1c" },
];

export const SKY_GRADIENT = `linear-gradient(to bottom, ${SKY_STOPS.map(
  (stop) => `${stop.color} ${stop.at}%`,
).join(", ")})`;

export interface SkyStar {
  /** Percent across the grid. */
  left: number;
  /** Percent down the grid. */
  top: number;
  /** Diameter in pixels. */
  size: number;
  /** Twinkle delay in seconds. */
  delay: number;
  opacity: number;
}

const mulberry32 = (seed: number): (() => number) => {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Night windows that stars are scattered across (hours). */
const NIGHT_BANDS: [number, number][] = [
  [0, 5],
  [21, 24],
];

const buildStars = (count: number): SkyStar[] => {
  const rng = mulberry32(20240929);
  return Array.from({ length: count }, () => {
    const band = NIGHT_BANDS[Math.floor(rng() * NIGHT_BANDS.length)];
    const at = band[0] + rng() * (band[1] - band[0]);
    return {
      left: rng() * 100,
      top: hour(at),
      size: 1 + Math.round(rng() * 2),
      delay: Math.round(rng() * 50) / 10,
      opacity: 0.35 + rng() * 0.6,
    };
  });
};

export const SKY_STARS: SkyStar[] = buildStars(48);

export interface SkyPeriod {
  label: string;
  color: string;
}

/** Legend bands shown under the grid. */
export const SKY_PERIODS: SkyPeriod[] = [
  { label: "Night", color: "#0b1230" },
  { label: "Morning", color: "#f0b25f" },
  { label: "Afternoon", color: "#63b0e6" },
  { label: "Evening", color: "#e9743c" },
];
