import type { Habit } from "@/types";

/** Ids of habits that (transitively) stack after `id`, plus `id` itself. */
export const descendantIds = (habits: Habit[], id: string): Set<string> => {
  const result = new Set<string>([id]);
  const queue = [id];
  while (queue.length) {
    const current = queue.pop()!;
    for (const habit of habits) {
      if (habit.anchorHabitId === current && !result.has(habit.id)) {
        result.add(habit.id);
        queue.push(habit.id);
      }
    }
  }
  return result;
};

/**
 * Habits that can be used as an anchor for `habitId`: everything except the
 * habit itself and anything stacked (transitively) after it, so chains can't
 * loop back on themselves.
 */
export const anchorCandidates = (habits: Habit[], habitId?: string): Habit[] => {
  if (!habitId) return habits;
  const forbidden = descendantIds(habits, habitId);
  return habits.filter((habit) => !forbidden.has(habit.id));
};

/** Ordered chains ("after A, then B, then C") of length > 1. */
export const buildChains = (habits: Habit[]): Habit[][] => {
  const ids = new Set(habits.map((habit) => habit.id));
  const children = new Map<string, Habit[]>();
  for (const habit of habits) {
    if (habit.anchorHabitId && ids.has(habit.anchorHabitId)) {
      const list = children.get(habit.anchorHabitId) ?? [];
      list.push(habit);
      children.set(habit.anchorHabitId, list);
    }
  }

  const roots = habits.filter(
    (habit) => !habit.anchorHabitId || !ids.has(habit.anchorHabitId),
  );

  const chains: Habit[][] = [];
  const seen = new Set<string>();
  const walk = (habit: Habit, chain: Habit[]) => {
    if (seen.has(habit.id)) return;
    seen.add(habit.id);
    const next = [...chain, habit];
    const kids = children.get(habit.id) ?? [];
    if (!kids.length) chains.push(next);
    else for (const kid of kids) walk(kid, next);
  };

  for (const root of roots) walk(root, []);

  return chains.filter((chain) => chain.length > 1);
};
