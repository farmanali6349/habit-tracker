import { Badge } from "@/components/ui/badge";
import type { BadgeInfo } from "@/types";

export default function BadgeWall({ badges }: { badges: BadgeInfo[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Badge
          key={badge.label}
          variant={badge.earned ? "secondary" : "outline"}
          className={badge.earned ? undefined : "text-muted-foreground/60"}
        >
          <span aria-hidden>{badge.icon}</span>
          {badge.label}
          {!badge.earned && <span className="sr-only"> (locked)</span>}
        </Badge>
      ))}
    </div>
  );
}
