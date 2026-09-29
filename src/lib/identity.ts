import type { Habit, HabitLogs, Identity } from "@/types";
import { addDays } from "./date";

/** Emoji offered when creating an identity. */
export const IDENTITY_EMOJIS = [
  "🏃",
  "💪",
  "📚",
  "🧘",
  "🥗",
  "💧",
  "😴",
  "🧠",
  "🎨",
  "✍️",
  "🌱",
  "❤️",
];

export const DEFAULT_IDENTITY_EMOJI = IDENTITY_EMOJIS[0];

export const habitsForIdentity = (
  habits: Habit[],
  identityId: string,
): Habit[] => habits.filter((habit) => habit.identityId === identityId);

export const identityForHabit = (
  identities: Identity[],
  habit: Habit,
): Identity | undefined =>
  habit.identityId
    ? identities.find((identity) => identity.id === habit.identityId)
    : undefined;

/** Check-ins cast for an identity's habits within an inclusive date range. */
export const identityVotes = (
  identity: Identity,
  habits: Habit[],
  logs: HabitLogs,
  from: string,
  to: string,
): number => {
  const ids = habitsForIdentity(habits, identity.id).map((habit) => habit.id);
  if (!ids.length) return 0;
  let votes = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    for (const id of ids) {
      if (logs[id]?.[d]) votes += 1;
    }
  }
  return votes;
};

/** Votes cast in the trailing 30 days (used for the identity card + toast). */
export const monthlyVotes = (
  identity: Identity,
  habits: Habit[],
  logs: HabitLogs,
  today: string,
): number => identityVotes(identity, habits, logs, addDays(today, -29), today);

export const identityVoteToast = (identity: Identity, votes: number): string =>
  `Vote cast for “${identity.statement}” — ${votes} ${
    votes === 1 ? "vote" : "votes"
  } in the last 30 days.`;
