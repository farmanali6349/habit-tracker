import {
  BookOpen,
  Briefcase,
  Code,
  Dumbbell,
  Heart,
  Leaf,
  Moon,
  Palette,
  Sparkles,
  Sun,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Category, Habit } from "@/types";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  dumbbell: Dumbbell,
  book: BookOpen,
  code: Code,
  briefcase: Briefcase,
  users: Users,
  moon: Moon,
  sun: Sun,
  leaf: Leaf,
  wallet: Wallet,
  palette: Palette,
  sparkles: Sparkles,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export interface CategoryColor {
  id: string;
  label: string;
  value: string;
}

export const CATEGORY_COLORS: CategoryColor[] = [
  { id: "emerald", label: "Emerald", value: "oklch(0.58 0.13 155)" },
  { id: "sky", label: "Sky", value: "oklch(0.58 0.12 235)" },
  { id: "violet", label: "Violet", value: "oklch(0.56 0.15 295)" },
  { id: "rose", label: "Rose", value: "oklch(0.58 0.17 15)" },
  { id: "amber", label: "Amber", value: "oklch(0.62 0.13 70)" },
  { id: "teal", label: "Teal", value: "oklch(0.58 0.11 190)" },
  { id: "indigo", label: "Indigo", value: "oklch(0.52 0.15 270)" },
  { id: "slate", label: "Slate", value: "oklch(0.48 0.02 260)" },
];

export const DEFAULT_CATEGORY_ICON = "sparkles";
export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0].value;

export const UNCATEGORIZED_ID = "uncategorized";
export const UNCATEGORIZED_NAME = "Uncategorized";

export const uncategorizedCategory = (): Category => ({
  id: UNCATEGORIZED_ID,
  name: UNCATEGORIZED_NAME,
  icon: DEFAULT_CATEGORY_ICON,
  color: CATEGORY_COLORS[7].value,
});

export const getCategoryIcon = (icon: string): LucideIcon =>
  CATEGORY_ICONS[icon] ?? CATEGORY_ICONS[DEFAULT_CATEGORY_ICON];

export interface HabitGroupData {
  category: Category;
  habits: Habit[];
}

const uncategorizedLast = (a: Category, b: Category): number =>
  (a.id === UNCATEGORIZED_ID ? 1 : 0) - (b.id === UNCATEGORIZED_ID ? 1 : 0);

export const groupHabitsByCategory = (
  habits: Habit[],
  categories: Category[],
): HabitGroupData[] => {
  const byCategory = new Map<string, Habit[]>();
  for (const habit of habits) {
    const list = byCategory.get(habit.categoryId);
    if (list) list.push(habit);
    else byCategory.set(habit.categoryId, [habit]);
  }

  const ordered = [...categories].sort(uncategorizedLast);
  const groups: HabitGroupData[] = [];
  for (const category of ordered) {
    const list = byCategory.get(category.id);
    if (list?.length) groups.push({ category, habits: list });
  }

  const known = new Set(categories.map((c) => c.id));
  const orphans = habits.filter((h) => !known.has(h.categoryId));
  if (orphans.length) {
    const fallback =
      categories.find((c) => c.id === UNCATEGORIZED_ID) ?? uncategorizedCategory();
    groups.push({ category: fallback, habits: orphans });
  }

  return groups;
};

export const countHabitsInCategory = (
  habits: Habit[],
  categoryId: string,
): number => habits.filter((h) => h.categoryId === categoryId).length;

export const categoryName = (categories: Category[], id: string): string =>
  categories.find((c) => c.id === id)?.name ?? UNCATEGORIZED_NAME;
