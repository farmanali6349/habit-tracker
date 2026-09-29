# Habit Tracker

A local-first habit tracker built with Next.js (App Router), Tailwind CSS v4 and
shadcn/ui. Track daily habits, audit your 24-hour cycle, plan a timetable, watch
streaks and badges, and explore deep analytics — all stored in your browser's
`localStorage` (no account, no server).

## Features

- **Dashboard** (`/`): a single overview with a live **Now** card for the habit in
  progress (its end time and a progress bar), today's progress ring, time-grouped
  tasks (ongoing / upcoming / overdue / completed), tomorrow's goals, sleep cycle,
  a plan-vs-actual snapshot, an eight-week heatmap, generated insights and recent
  activity.
- **Habits** (`/habits`): daily checklist with a 14-day backfill strip per habit,
  grouped by category, with search. Each habit carries a time window, and the list
  is ordered by the live clock — the ongoing habit highlighted with a progress bar,
  overdue ones badged.
- **Time-bound**: every habit has a scheduled window; a new habit starts tracking
  from the moment it's created, and a timetable slot for the day takes precedence.
- **Categories** (`/categories`): create, rename, recolour and delete categories,
  each with its own icon.
- **Calendar** (`/calendar`): a monthly grid with completed / partial / missed
  days colour-coded, click-through to any day's audit, and a two-day side-by-side
  comparison.
- **Timetable** (`/timetable`): timetables with a from/to date range and a
  click-to-edit 24-hour day grid — pick a block to edit it, or click empty space to
  add a slot there. Blocks show the habit, colour, time and duration; there's
  per-slot habit assignment, empty-slot marking, a "fill remaining time" shortcut,
  duplicate/edit/delete for timetables, and a **planned vs actual** panel.
- **Day audit** (`/audit`): a night-time review. A day scorecard (completion
  ring, done / missed / pending bar, per-category read) sits above an
  interactive 24-hour strip where every check-in is a hoverable, focusable
  marker coloured by category. The review list groups what still needs
  attention and what's done, and you can **flag a habit as missed** with a
  reason and how you'll cover it tomorrow. Those notes resurface the next day in
  a **Follow-ups** card, and tomorrow's plan is listed alongside.
- **Analytics** (`/analytics`): actionable insights; a **why habits get missed**
  rollup (top reasons, most-missed habits, misses per day); planned vs actual
  accuracy; weekly/monthly trends; missed-vs-completed; an activity heatmap;
  peak productivity hours; weekday performance; per-category breakdown and
  performance; strongest / weakest habits; streak tracker; badges; and a
  year-in-review summary.
- **Activity** (`/activity`): a general note log merged with every check-in.
- **Reminders**: optional alerts as each planned timetable slot comes up — a
  heads-up a few minutes before and again at the start. They fire as an in-app
  toast (with Done / Snooze) plus a browser notification, and play a synthesised
  chime (a pickable tone, no audio files) when sound is on. There's also an
  end-of-day nudge if habits are still pending. Works while the tab stays open.
- JSON / CSV export and JSON import, light / dark theme. All time entry uses the
  shadcn popover time picker (hour / minute / AM-PM), and dates use the shadcn
  calendar.

## Navigation

The app uses real URL routes behind a shared, collapsible sidebar (an icon rail
on desktop, a slide-out drawer on mobile). The store is a client singleton, so
data persists as you move between sections.

```
/            Dashboard      /timetable   Timetable
/habits      Habits         /audit       Day audit
/categories  Categories     /analytics   Analytics
/calendar    Calendar       /activity    Activity
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint

## Data

All data lives in `localStorage` under the key `ht_v2`: habits, categories,
check-in logs, missed-flag notes (reason + plan), sleep entries, timetables,
notes and reminder settings. Use the
**Export** button to download a JSON or CSV backup; the JSON backup can be
re-imported. Older saved data is migrated automatically on load (for example,
habits that stored a plain category name are given a matching category).

The app starts empty — every habit, category, check-in and entry is created by
you, nothing is seeded. **Export → Clear data** permanently wipes everything on
this device; it asks you to back up first and to type a confirmation word before
deleting.

## Project Structure

```
src/
  app/               # routes (one segment per section), layout, global styles
  components/
    shell/           # AppProvider (store context), AppShell, sidebar, mobile nav
    sections/        # per-route screens: Dashboard, Habits, Categories, Calendar,
                     # Timetable, Audit, Analytics, Activity
    dashboard/       # dashboard cards (progress, tasks, goals, plan, activity)
    analytics/       # recharts wrappers, activity heatmap, insights list, cards
    categories/      # category manager + form dialog
    day/             # day-review pieces: scorecard, 24-hour strip, review list,
                     # missed-note dialog, follow-ups, sleep logger, audit panel
    schedule/        # timetable bar, click-to-edit day grid, slot list and
                     # dialogs, planned vs actual
    calendar/        # month grid, day cell, two-day comparison
    ui/              # shadcn/ui primitives (incl. sheet)
  hooks/             # useHabitStore (state + persistence), useDerivedData,
                     # useReminders, useTimetableReminders
  lib/               # pure helpers: date, day, calendar, timetable, stats,
                     # analytics, insights, categories, nav, storage
  types/             # shared TypeScript types
```

## Design notes

The theme keeps a deliberately monochrome base (from the shadcn `radix-nova`
preset) with a small semantic layer on top: `--success` for completed,
`--destructive` for missed, and `--warning` for streaks. The `--chart-1..5`
tokens add hue for the analytics charts, and category colours remain the one
place where arbitrary hue is allowed, because the colour is the category's
identity.
