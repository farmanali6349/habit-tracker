"use client";

import { SparklesIcon } from "lucide-react";
import { CATEGORY_COLORS } from "@/lib/categories";
import { cn } from "@/lib/utils";

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Deterministic colour from the name, so the avatar stays stable. */
const colorFor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length].value;
};

interface UserAvatarProps {
  name: string;
  className?: string;
}

export default function UserAvatar({ name, className }: UserAvatarProps) {
  const trimmed = name.trim();
  const initials = initialsOf(trimmed);

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        trimmed
          ? "text-white ring-1 ring-black/10 ring-inset"
          : "bg-muted text-muted-foreground",
        className,
      )}
      style={trimmed ? { backgroundColor: colorFor(trimmed) } : undefined}
    >
      {initials || <SparklesIcon className="size-4" />}
    </span>
  );
}
