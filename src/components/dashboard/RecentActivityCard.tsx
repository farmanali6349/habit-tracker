import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FeedItem } from "@/types";

export default function RecentActivityCard({ feed }: { feed: FeedItem[] }) {
  const items = feed.slice(0, 5);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest check-ins and notes</CardDescription>
        <CardAction>
          <Link
            href="/activity"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            All activity
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length ? (
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-2.5">
                <span aria-hidden className="mt-0.5 text-sm">
                  {item.t === "note" ? "📝" : "✅"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.x}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.ts).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
