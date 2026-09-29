import { AwardIcon, FlameIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TodayProgressCardProps {
  percent: number;
  done: number;
  total: number;
  streak: number;
  earnedBadges: number;
  totalBadges: number;
}

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TodayProgressCard({
  percent,
  done,
  total,
  streak,
  earnedBadges,
  totalBadges,
}: TodayProgressCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-5">
        <div className="relative size-20 shrink-0">
          <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={RADIUS}
              className="fill-none stroke-muted"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r={RADIUS}
              className="fill-none stroke-success"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-heading text-lg font-semibold tabular-nums">
            {percent}%
          </span>
        </div>

        <div className="min-w-0 space-y-2">
          <div>
            <div className="font-heading text-sm font-medium">Today</div>
            <div className="text-sm text-muted-foreground">
              {done} of {total} habits done
            </div>
          </div>
          <div className="flex gap-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FlameIcon className="size-3.5 text-warning" />
                Streak
              </div>
              <div className="font-heading text-base font-semibold tabular-nums">
                {streak}d
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AwardIcon className="size-3.5" />
                Badges
              </div>
              <div className="font-heading text-base font-semibold tabular-nums">
                {earnedBadges}/{totalBadges}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
