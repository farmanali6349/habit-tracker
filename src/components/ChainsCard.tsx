"use client";

import { LinkIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildChains } from "@/lib/stacking";
import type { Habit } from "@/types";

export default function ChainsCard({ habits }: { habits: Habit[] }) {
  const chains = buildChains(habits);
  if (!chains.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="size-4 text-muted-foreground" />
          Habit stacks
        </CardTitle>
        <CardDescription>
          One habit cues the next — “after X, I will Y”.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {chains.map((chain) => (
          <div
            key={chain.map((habit) => habit.id).join("-")}
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            {chain.map((habit, position) => (
              <span key={habit.id} className="flex items-center gap-2">
                {position > 0 && (
                  <span aria-hidden className="text-muted-foreground">
                    →
                  </span>
                )}
                <span className="rounded-md bg-muted px-2 py-0.5">
                  {habit.name}
                </span>
              </span>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
