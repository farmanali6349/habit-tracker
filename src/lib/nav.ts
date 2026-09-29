import {
  BarChart3Icon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  NotebookPenIcon,
  SunriseIcon,
  TagsIcon,
} from "lucide-react";
import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/habits", label: "Habits", icon: ListChecksIcon },
  { href: "/categories", label: "Categories", icon: TagsIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarDaysIcon },
  { href: "/timetable", label: "Timetable", icon: CalendarRangeIcon },
  { href: "/audit", label: "Day audit", icon: SunriseIcon },
  { href: "/analytics", label: "Analytics", icon: BarChart3Icon },
  { href: "/activity", label: "Activity", icon: NotebookPenIcon },
];

export const navItemFor = (pathname: string): NavItem | undefined =>
  pathname === "/"
    ? NAV_ITEMS[0]
    : NAV_ITEMS.find(
        (item) => item.href !== "/" && pathname.startsWith(item.href),
      );

export const isActivePath = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);
