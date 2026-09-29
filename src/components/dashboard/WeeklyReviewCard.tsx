"use client";

import Link from "next/link";
import { ClipboardCheckIcon } from "lucide-react";
import { useApp } from "@/components/shell/AppProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { today } from "@/lib/date";
import { weekStart } from "@/lib/review";

export default function WeeklyReviewCard() {
  const { state } = useApp();
  const reviewed = state.reviews.some(
    (review) => review.weekStart === weekStart(today()),
  );

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3">
        <ClipboardCheckIcon className="size-4 shrink-0 text-muted-foreground" />
        <div className="me-auto">
          <div className="font-heading text-sm font-medium">Weekly review</div>
          <div className="text-xs text-muted-foreground">
            {reviewed
              ? "You've reflected on this week. Nice."
              : "A few minutes of reflection compounds. How did this week go?"}
          </div>
        </div>
        <Button
          size="sm"
          variant={reviewed ? "outline" : "default"}
          asChild
        >
          <Link href="/review">{reviewed ? "View" : "Start review"}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
