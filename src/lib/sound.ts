export interface ToneOption {
  id: string;
  label: string;
}

export const TONES: ToneOption[] = [
  { id: "chime", label: "Chime" },
  { id: "bell", label: "Bell" },
  { id: "ping", label: "Ping" },
  { id: "alert", label: "Alert" },
];

interface Note {
  freq: number;
  /** Seconds after the tone starts. */
  at: number;
  /** Seconds the note rings. */
  dur: number;
  type?: OscillatorType;
  /** Relative level within the tone. */
  gain?: number;
}

const TONE_NOTES: Record<string, Note[]> = {
  chime: [
    { freq: 880, at: 0, dur: 0.4, type: "sine", gain: 0.9 },
    { freq: 1174.66, at: 0.12, dur: 0.45, type: "sine", gain: 0.75 },
    { freq: 1567.98, at: 0.24, dur: 0.6, type: "sine", gain: 0.55 },
  ],
  bell: [
    { freq: 659.25, at: 0, dur: 1.1, type: "triangle", gain: 1 },
    { freq: 1318.51, at: 0, dur: 0.6, type: "sine", gain: 0.3 },
  ],
  ping: [{ freq: 1318.51, at: 0, dur: 0.22, type: "sine", gain: 0.9 }],
  alert: [
    { freq: 740, at: 0, dur: 0.16, type: "square", gain: 0.45 },
    { freq: 988, at: 0.2, dur: 0.16, type: "square", gain: 0.45 },
    { freq: 740, at: 0.4, dur: 0.16, type: "square", gain: 0.45 },
  ],
};

let context: AudioContext | null = null;

const audioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (context) return context;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
};

/** Resumes the audio context — call from a user gesture to satisfy autoplay rules. */
export const primeAudio = (): void => {
  const ctx = audioContext();
  if (ctx && ctx.state === "suspended") void ctx.resume();
};

/** Plays a short synthesised tone. Silently no-ops where audio isn't available. */
export const playTone = (toneId: string, volume = 0.5): void => {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const notes = TONE_NOTES[toneId] ?? TONE_NOTES.chime;
  const start = ctx.currentTime + 0.02;

  for (const note of notes) {
    const at = start + note.at;
    const peak = Math.max(0.0001, volume * (note.gain ?? 1));
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = note.type ?? "sine";
    oscillator.frequency.setValueAtTime(note.freq, at);

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + note.dur);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + note.dur + 0.03);
  }
};
