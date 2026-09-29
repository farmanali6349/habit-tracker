"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  Share2Icon,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";
import StatTile from "@/components/StatTile";
import { useApp } from "@/components/shell/AppProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { addDays, today } from "@/lib/date";
import { buildWeekSummary, weekStart } from "@/lib/review";
import { downloadText, weekSummaryText } from "@/lib/share";
import type { ReviewDraft, WeeklyReview } from "@/types";

const RATINGS = [1, 2, 3, 4, 5];

function ReviewForm({
  start,
  existing,
  onSave,
}: {
  start: string;
  existing?: WeeklyReview;
  onSave: (draft: ReviewDraft) => void;
}) {
  const [wentWell, setWentWell] = useState(existing?.wentWell ?? "");
  const [didntWork, setDidntWork] = useState(existing?.didntWork ?? "");
  const [adjust, setAdjust] = useState(existing?.adjust ?? "");
  const [rating, setRating] = useState(existing?.rating ?? 3);

  const save = () => {
    onSave({
      id: existing?.id,
      weekStart: start,
      wentWell: wentWell.trim(),
      didntWork: didntWork.trim(),
      adjust: adjust.trim(),
      rating,
    });
    toast.success(existing ? "Review updated" : "Review saved");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reflect</CardTitle>
        <CardDescription>
          Habits + deliberate practice + reflection = progress. What will you
          change next week?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="review-well">What went well?</Label>
          <Textarea
            id="review-well"
            value={wentWell}
            onChange={(e) => setWentWell(e.target.value)}
            placeholder="A habit that felt easy…"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="review-not">What didn&apos;t?</Label>
          <Textarea
            id="review-not"
            value={didntWork}
            onChange={(e) => setDidntWork(e.target.value)}
            placeholder="Where did you slip? Noting the reason helps."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="review-adjust">What will you adjust?</Label>
          <Textarea
            id="review-adjust"
            value={adjust}
            onChange={(e) => setAdjust(e.target.value)}
            placeholder="One small change for next week…"
          />
        </div>
        <div className="grid gap-2">
          <Label>How was the week?</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={String(rating)}
            onValueChange={(value) => {
              if (value) setRating(Number(value));
            }}
          >
            {RATINGS.map((value) => (
              <ToggleGroupItem key={value} value={String(value)}>
                {value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <Button onClick={save}>
          <CheckIcon data-icon="inline-start" />
          {existing ? "Update review" : "Save review"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ReviewSection() {
  const { state, saveReview, deleteReview, setProfile } = useApp();
  const [start, setStart] = useState(() => weekStart(today()));

  const summary = useMemo(() => buildWeekSummary(state, start), [state, start]);
  const existing = state.reviews.find((review) => review.weekStart === start);

  const copySummary = async () => {
    const text = weekSummaryText(state, start);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Weekly summary copied");
    } catch {
      downloadText(text, `habits-week-${start}.txt`);
      toast.success("Summary downloaded");
    }
  };

  const label = `${new Date(`${start}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${new Date(`${summary.end}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous week"
            onClick={() => setStart(addDays(start, -7))}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next week"
            disabled={start >= weekStart(today())}
            onClick={() => setStart(addDays(start, 7))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        <div className="me-auto">
          <div className="font-heading text-lg font-semibold">Weekly review</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
        {start !== weekStart(today()) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStart(weekStart(today()))}
          >
            This week
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Completed" value={`${summary.pct}%`} />
        <StatTile label="Check-ins" value={`${summary.done}`} />
        <StatTile
          label="Strongest"
          value={summary.bestHabit ? `${summary.bestHabit.pct}%` : "—"}
        />
        <StatTile
          label="Needs attention"
          value={summary.worstHabit ? `${summary.worstHabit.pct}%` : "—"}
        />
      </div>

      <ReviewForm
        key={start}
        start={start}
        existing={existing}
        onSave={saveReview}
      />

      <Card>
        <CardHeader>
          <CardTitle>Accountability</CardTitle>
          <CardDescription>
            Share your week with someone who keeps you honest. Everything stays
            on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="partner">Accountability partner (optional)</Label>
            <Input
              id="partner"
              placeholder="Their name"
              value={state.profile.partnerName}
              onChange={(e) => setProfile({ partnerName: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copySummary}>
              <Share2Icon data-icon="inline-start" />
              Copy summary
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                downloadText(
                  weekSummaryText(state, start),
                  `habits-week-${start}.txt`,
                )
              }
            >
              <DownloadIcon data-icon="inline-start" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {state.reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past reviews</CardTitle>
            <CardDescription>
              {state.reviews.length} saved{" "}
              {state.reviews.length === 1 ? "reflection" : "reflections"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="me-auto font-medium hover:underline"
                    onClick={() => setStart(review.weekStart)}
                  >
                    Week of {review.weekStart}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {review.rating}/5
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Delete review for ${review.weekStart}`}
                    onClick={() => deleteReview(review.id)}
                  >
                    <TrashIcon />
                  </Button>
                </div>
                {review.wentWell && (
                  <p className="mt-1 text-muted-foreground">{review.wentWell}</p>
                )}
                {review.adjust && (
                  <p className="text-muted-foreground">Next: {review.adjust}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
