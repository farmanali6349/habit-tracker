import { CalendarDaysIcon } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { addDays, today } from "@/lib/date";
import { isActive } from "@/lib/stats";
import type { Category, Habit } from "@/types";

interface UpcomingGoalsCardProps {
  habits: Habit[];
  categories: Category[];
}

export default function UpcomingGoalsCard({
  habits,
  categories,
}: UpcomingGoalsCardProps) {
  const tomorrow = addDays(today(), 1);
  const goals = habits.filter((habit) => isActive(habit, tomorrow));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Tomorrow&apos;s goals</CardTitle>
        <CardDescription>
          {goals.length} {goals.length === 1 ? "habit" : "habits"} lined up
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {goals.length ? (
          <ul className="space-y-1.5">
            {goals.map((habit) => {
              const category = categoryById.get(habit.categoryId);
              return (
                <li key={habit.id} className="flex items-center gap-2 text-sm">
                  {category ? (
                    <CategoryIcon
                      name={category.icon}
                      aria-hidden
                      className="size-3.5 shrink-0"
                      style={{ color: category.color }}
                    />
                  ) : (
                    <CalendarDaysIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 truncate" title={habit.name}>
                    {habit.name}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            Nothing scheduled for tomorrow.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
