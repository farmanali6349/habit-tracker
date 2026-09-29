"use client";

import { FingerprintIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { today } from "@/lib/date";
import { habitsForIdentity, monthlyVotes } from "@/lib/identity";
import { cn } from "@/lib/utils";
import type { Habit, HabitLogs, Identity } from "@/types";

interface IdentityCardProps {
  identities: Identity[];
  habits: Habit[];
  logs: HabitLogs;
}

export default function IdentityCard({
  identities,
  habits,
  logs,
}: IdentityCardProps) {
  if (!identities.length) return null;

  const t = today();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FingerprintIcon className="size-4 text-muted-foreground" />
          Who you&apos;re becoming
        </CardTitle>
        <CardDescription>
          Every check-in is a vote for an identity. Votes cast in the last 30
          days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {identities.map((identity) => {
          const votes = monthlyVotes(identity, habits, logs, t);
          const linked = habitsForIdentity(habits, identity.id).length;
          const pct = Math.min(100, Math.round((votes / 30) * 100));
          return (
            <div key={identity.id} className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span aria-hidden className="text-base">
                  {identity.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  I am becoming{" "}
                  <strong className="font-medium">{identity.statement}</strong>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {votes} {votes === 1 ? "vote" : "votes"}
                </span>
              </div>
              <Progress
                value={pct}
                aria-label={`${identity.statement}: ${votes} votes in the last 30 days`}
                className={cn(
                  "h-1.5 [&>[data-slot=progress-indicator]]:bg-success",
                )}
              />
              <p className="text-xs text-muted-foreground">
                {linked
                  ? `${linked} ${linked === 1 ? "habit" : "habits"} casting votes`
                  : "No habits linked yet"}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
