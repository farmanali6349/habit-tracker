"use client";

import { MoonStarIcon, SunIcon } from "lucide-react";
import { SKY_GRADIENT, SKY_STARS } from "@/lib/sky";
import { cn } from "@/lib/utils";

const hourTop = (h: number): string => `${(h / 24) * 100}%`;

/** Decorative sky behind the day grid: gradient, stars, sun, moon and clouds. */
export default function SkyBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      style={{ backgroundImage: SKY_GRADIENT }}
    >
      {SKY_STARS.map((star, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-white animate-pulse motion-reduce:animate-none"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: "4.5s",
          }}
        />
      ))}

      {/* Moon — small hours */}
      <div className="absolute" style={{ top: hourTop(2), left: "24%" }}>
        <span className="absolute -inset-4 rounded-full bg-white/15 blur-xl" />
        <MoonStarIcon className="relative size-4 text-slate-100/90" />
      </div>

      {/* Sun — early afternoon */}
      <div className="absolute" style={{ top: hourTop(13), left: "68%" }}>
        <span className="absolute -inset-6 rounded-full bg-yellow-200/40 blur-2xl" />
        <SunIcon className="relative size-6 text-yellow-100 drop-shadow" />
      </div>

      {/* Soft daytime clouds */}
      <span
        className="absolute h-4 w-24 rounded-full bg-white/25 blur-md"
        style={{ top: hourTop(10), left: "18%" }}
      />
      <span
        className="absolute h-3 w-16 rounded-full bg-white/20 blur-md"
        style={{ top: hourTop(15.5), left: "46%" }}
      />
      <span
        className="absolute h-4 w-20 rounded-full bg-white/20 blur-md"
        style={{ top: hourTop(16.5), left: "72%" }}
      />

      {/* Warm horizon glow at dusk */}
      <span
        className="absolute inset-x-0 h-16 blur-2xl"
        style={{
          top: hourTop(18),
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,170,90,0.55), transparent 70%)",
        }}
      />
    </div>
  );
}
