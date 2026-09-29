import {
  BarChart3Icon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  ClipboardCheckIcon,
  FingerprintIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  MoonIcon,
  NotebookPenIcon,
  SunriseIcon,
  TagsIcon,
} from "lucide-react";
import type { NavItem } from "@/types";

/** A labelled cluster of nav items shown together with a section heading. */
export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Track",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
      { href: "/habits", label: "Habits", icon: ListChecksIcon },
      { href: "/categories", label: "Categories", icon: TagsIcon },
      { href: "/identities", label: "Identities", icon: FingerprintIcon },
    ],
  },
  {
    label: "Plan",
    items: [
      { href: "/timetable", label: "Timetable", icon: CalendarRangeIcon },
      { href: "/sleep", label: "Sleep", icon: MoonIcon },
      { href: "/calendar", label: "Calendar", icon: CalendarDaysIcon },
      { href: "/audit", label: "Day audit", icon: SunriseIcon },
    ],
  },
  {
    label: "Review",
    items: [
      { href: "/review", label: "Weekly review", icon: ClipboardCheckIcon },
      { href: "/analytics", label: "Analytics", icon: BarChart3Icon },
      { href: "/activity", label: "Activity", icon: NotebookPenIcon },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const navItemFor = (pathname: string): NavItem | undefined =>
  pathname === "/"
    ? NAV_ITEMS[0]
    : NAV_ITEMS.find(
        (item) => item.href !== "/" && pathname.startsWith(item.href),
      );

export const isActivePath = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);
