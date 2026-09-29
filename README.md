# Habit Tracker

A local-first habit tracker for turning intentions into identity. Build the
habits, plan the hours, log what you actually did, and watch the evidence add
up — all in your browser, with **no account, no server, and no data leaving your
device**.

The app is built around a simple idea from *Atomic Habits*: **every check-in is a
vote for the kind of person you want to become.** So instead of a bare checklist,
you define the identities you're working toward, link habits to them, and the app
tallies the votes — alongside timetables, a sleep schedule, day audits, streaks,
and analytics.

---

## Table of contents

- [What it is](#what-it-is)
- [Why it exists](#why-it-exists)
- [Quick start](#quick-start)
- [Feature tour](#feature-tour)
- [Complete usage guide](#complete-usage-guide)
- [How the wake-time auto-adjust works](#how-the-wake-time-auto-adjust-works)
- [Navigation map](#navigation-map)
- [Data, backup & privacy](#data-backup--privacy)
- [Scripts](#scripts)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Design notes](#design-notes)

---

## What it is

Habit Tracker is a single-page Next.js app that runs entirely on your machine. It
combines four things that are usually separate tools:

- a **habit tracker** — daily check-ins, streaks, cadences and targets,
- a **day planner** — time-bound habits and a date-ranged timetable,
- a **sleep schedule** — an ideal wake/bed window that automatically shifts your
  day when reality differs, and
- a **review + analytics** loop — a nightly audit, a weekly reflection, and
  insights generated from your own data.

Everything is stored in your browser's `localStorage` and persists across reloads
and route changes. You can export it all as JSON/CSV at any time.

## Why it exists

Most habit apps just count. This one is designed to **close the loop across
time**:

- habits are **time-bound**, so the live clock can tell you what's in progress and
  what's overdue;
- when you miss something, you record **why** and **how you'll cover it**, and
  that note resurfaces the next day;
- your **plan and your reality** are compared side by side, with the deviation
  from each scheduled slot;
- and the whole day is **anchored to the sleep you want**, so an early or late
  wake-up doesn't wreck the plan — the plan moves with you.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app starts **empty** —
there is no demo data — and walks you through a short setup on first run.

To produce a production build:

```bash
npm run build
npm run start
```

---

## Feature tour

### Dashboard (`/`)
One screen that answers "where am I right now?":

- a live **Now** card highlighting the habit currently in progress, with its end
  time and a progress bar (or the next one up);
- today's **progress ring**, time-grouped task list (ongoing / upcoming / overdue
  / completed), and upcoming goals;
- a **sleep logger** for today's wake and sleep times, with deviation readouts
  against your ideal window;
- a **plan-vs-actual snapshot**, an eight-week completion heatmap, generated
  **insights**, an identity card, and a recent-activity feed.

### Habits (`/habits`)
The daily checklist:

- habits are **grouped by category** and ordered by the live clock (ongoing
  first, then upcoming, then overdue, then completed);
- each habit carries a **14-day backfill strip** — click any past day to correct
  the record;
- search across habits, and a separate **Reduce** section for habits you're
  cutting back on (a check-in means you *resisted*).

Each habit can define a **name**, category, description, **time window**, cadence
(every day / specific weekdays / N times per week), an optional **numeric target**
(e.g. 20 pages), a **build/limit** kind, **todos** (a private checklist, not
counted in analytics), **resources** (links), a **stacking anchor** ("after X, I
will…"), linked **identities**, and its own reminder.

### Categories (`/categories`)
Create, rename, recolor and delete categories, each with an icon. Category colors
are the one place arbitrary hue is allowed — the color *is* the category's
identity. Deleting a category re-homes its habits to *Uncategorized*.

### Identities (`/identities`)
The "who am I becoming" layer:

- define an identity as a statement ("I am becoming **a runner**") with an emoji
  and color;
- **link habits to one or more identities** — a habit can cast votes for several
  at once;
- every check-in on a linked habit is a **vote**, counted over the last 30 days;
- the dashboard identity card and this page show each identity's vote count and
  how many habits feed it.

Deleting an identity leaves the habits in place, they simply stop voting for it.

### Timetable (`/timetable`)
Plan the shape of a day:

- create **timetables** with a from/to date range (where ranges overlap, the most
  recent wins);
- a click-to-edit **24-hour grid** and a compact day bar — click a block to edit
  it, or click empty space to add a slot at that time;
- assign a **habit** to each slot or leave it **empty**; a "fill remaining time"
  shortcut marks the gaps;
- duplicate, edit and delete timetables;
- a **Planned vs actual** panel showing, per slot, what happened and the
  **deviation** (e.g. "20m late").

A timetable slot for the day takes precedence over a habit's own time window.

### Sleep (`/sleep`)
Anchor the day to the sleep you want:

- set an **ideal wake time**, an **ideal bedtime**, and a **target duration**
  (default 7h). The ideal window is shown against the target and flags a
  mismatch;
- log your **actual** wake and sleep times each day (also available on the
  Dashboard and Day audit);
- see today's **deviation** — how early/late you woke, how your bedtime and total
  sleep compare;
- a **history** panel (7 or 30 nights) with average deviations, average sleep and
  an on-time percentage;
- a preview of **today's adjusted plan**, showing the day's timetable shifted to
  match your actual wake-up.

### Calendar (`/calendar`)
A monthly grid with each day color-coded (complete / partial / missed / empty /
future), month consistency and best-streak stats, click-through to any day's
audit, and a **compare** mode that puts two days side by side (including sleep).

### Day audit (`/audit`)
The night-time review:

- a **day scorecard** — completion ring, a done/missed/pending bar, and a
  per-category read of where the day went;
- an interactive **24-hour strip** where each check-in, miss and upcoming item is
  a hoverable, focusable marker colored by category;
- a review list separating what's done from what still needs attention;
- **flag a habit as missed** with a reason and a plan for tomorrow; those notes
  reappear the next day in a **Follow-ups** card;
- tomorrow's plan, and the sleep logger for the selected day.

You can navigate to any recent day to catch up on reviews.

### Weekly review (`/review`)
A reflection form (what went well / what didn't / what you'll adjust, plus a 1–5
rating) with a week summary, an optional **accountability partner** name, a
copyable/downloadable plain-text summary to share, and a list of past reviews.

### Analytics (`/analytics`)
Everything derived from your data, over a selectable period (week / month /
quarter / year):

- **insights** (peak times, sleep's effect on consistency, sleep-vs-ideal drift,
  strongest/weakest categories, streaks, habits at risk, plan accuracy);
- a **why habits get missed** rollup (top reasons, most-missed habits, misses per
  day);
- weekly/monthly completion trends, missed-vs-completed, an activity heatmap,
  peak productivity hours, and per-weekday performance;
- per-category breakdown and performance, strongest/weakest habits, a streak
  tracker, badges, and a **year in review**.

Plan accuracy accounts for the wake-time auto-adjust, comparing check-ins against
the *adjusted* plan.

### Activity (`/activity`)
A general note log merged with every check-in into one scannable, day-grouped
feed, with search and filters.

### Reminders
Optional alerts that fire while the tab is open:

- a heads-up a few minutes before each planned timetable slot and again at its
  start, plus an optional **per-habit** cue time;
- delivered as an in-app toast (with **Done** / **Snooze**) and a **browser
  notification**;
- an optional synthesised **chime** (several tones, no audio files);
- an **end-of-day** nudge if habits are still pending.

Reminders follow the wake-time auto-adjust, so a shifted day produces shifted
cues.

### Navigation & theme
A collapsible sidebar rail with your name, grouped navigation, today's progress,
quick actions and your current streak/identity; a slide-out drawer on mobile. The
app supports **light / dark / system** themes.

---

## Complete usage guide

### 1. Install and run
```bash
npm install
npm run dev
```
Then open the app in your browser.

### 2. First run (setup)
On a fresh install the app opens the setup dialog:

1. **Welcome** — optionally enter your name and an accountability partner.
2. **Identity** — pick or type the person you want to become (e.g. "a healthy
   person") and an emoji.
3. **First habit** — name it and pick when it happens.
4. **Cues** — choose your reminder time and tones.

You can finish or skip it; re-open it any time with **Setup** in the header.

### 3. Set your name (any time)
Click your **avatar/name** at the top of the sidebar to open **Your profile** and
edit your name and accountability partner. The sidebar avatar is generated from
your initials and updates instantly.

### 4. Build your categories
Go to **Categories** and add a few (e.g. Health, Mind, Work) with an icon and
color. Habits are grouped by category, so a small set goes a long way.

### 5. Create your habits
On **Habits** (or the **Add habit** quick action in the sidebar) click **Add
habit** and fill in what you need:

- **Name** and optional description.
- **Category**.
- **Type** — *build* a habit, or *reduce* one (check-in = resisted).
- **Identities** — tick every identity this habit should cast votes for.
- **Stack after** — tie it to an existing routine ("After I brush my teeth, I
  will…"), or type a cue.
- **Scheduled from / Until** — the window the habit is considered "ongoing".
- **Frequency** — every day, specific weekdays, or N times per week.
- **Daily target** — optional amount + unit (e.g. 20 pages).
- **Remind me at a time** — a per-habit cue.
- **Lifetime / ends on** — whether it's ongoing or time-boxed.
- **Todos / Resources** — an optional private checklist and reference links.

Save, and the habit appears in its category, ordered by the clock.

### 6. Check in, backfill and adjust
Click the round check button on a habit to mark it done today. Use the **14-day
strip** under each habit to backfill or fix any past day. Mark a day as a planned
**rest day** with Skip, or record partial **progress** against a target.

### 7. Plan your day (Timetable)
Go to **Timetable**, create a timetable with a date range, then click the day
grid to add slots. Assign habits (or leave slots empty), and use **Fill time** to
mark the remaining hours. Review **Planned vs actual** to see how closely you
followed it.

### 8. Set your ideal sleep and let the day adjust
Go to **Sleep** and set your **ideal wake** and **bedtime** plus a **target**.

Then, each day, log the time you actually **woke up** and **went to sleep**
(here, on the Dashboard, or in the Day audit). As soon as a wake time is logged:

- the app computes the offset between your actual and ideal wake time;
- your whole timetable for that day **shifts by that offset** everywhere it's
  shown — the Dashboard, the task list, the day strip, the audit and
  **reminders** — while the **Timetable editor stays in ideal times** so you're
  always authoring the plan you designed;
- the **deviation** (woke early/late, bedtime, sleep vs target) is shown, and a
  history builds up over time.

Clear the wake time and the day snaps back to ideal times.

### 9. Run the nightly audit
Open **Day audit** at the end of the day. Review the scorecard and the 24-hour
strip, tick off anything you did, and **flag misses with a reason and a plan**.
Those notes come back the next day under **Follow-ups** so you can act on them.

### 10. Reflect weekly
On **Weekly review**, fill in what went well, what didn't, and what you'll
adjust, then rate the week. Copy or download the summary to share with your
accountability partner.

### 11. Read the analytics
On **Analytics**, switch periods and read the insights, miss-reasons rollup,
trends, heatmap and plan accuracy to find patterns worth acting on.

### 12. Keep notes
Use **Activity** to jot general notes; they're merged with your check-ins into one
day-grouped history.

### 13. Back up and restore
Use **Import / Export** (the sidebar quick action, or the drawer's on mobile) to
open the backup dialog:

- **JSON** — a complete, self-contained snapshot; re-import it to restore
  everything;
- **CSV** — a spreadsheet-friendly log of check-ins and misses;
- **Copy** / **Download** to save a copy anywhere.

**Clear data** permanently wipes everything on this device: it asks you to back
up first and to type a confirmation word before deleting.

### Keyboard shortcuts
- **Ctrl/Cmd + B** — collapse or expand the sidebar.

---

## How the wake-time auto-adjust works

1. You set an **ideal wake time** (say 07:00) on the Sleep page and author your
   timetable around it (e.g. "read at 07:00").
2. Each day you log when you **actually woke**.
3. The app computes `offset = actual wake − ideal wake` (shortest signed
   difference, so midnight wrap is handled).
4. Every slot and habit window for **that day** is shifted by `offset` when shown
   on the Dashboard, the task list, the day strip, the audit and the timetable
   preview — and **reminders** fire at the shifted times.
5. The timetable itself is never mutated; the shift is a view over your stored
   plan, recomputed from each day's logged wake time. No wake logged → no shift.

A single uniform shift keeps the day's shape and is easy to reason about. One
edge case: an extreme offset on a very early slot can wrap past midnight.

---

## Navigation map

The app uses real URL routes behind a shared, collapsible sidebar (an icon rail
on desktop, a slide-out drawer on mobile).

| Route         | Section       | Route         | Section        |
| ------------- | ------------- | ------------- | -------------- |
| `/`           | Dashboard     | `/sleep`      | Sleep          |
| `/habits`     | Habits        | `/calendar`   | Calendar       |
| `/categories` | Categories    | `/audit`      | Day audit      |
| `/identities` | Identities    | `/review`     | Weekly review  |
| `/timetable`  | Timetable     | `/analytics`  | Analytics      |
|               |               | `/activity`   | Activity       |

---

## Data, backup & privacy

- **Everything is local.** No account, no backend, no network calls with your
  data. State lives in `localStorage` under the key **`ht_v2`**.
- **The app starts empty.** No sample data is seeded; every habit, category,
  identity, timetable and log entry is yours.
- **Older data is migrated automatically on load.** For example: habits that
  stored a plain category name are given a matching category; a single
  `identityId` is converted to the `identityIds` array; and a default sleep goal
  is added if one is missing.
- **Back up often.** Use **Import / Export** for JSON/CSV. Clearing data is
  destructive and guarded by a typed confirmation; back up first.

---

## Scripts

| Command         | What it does              |
| --------------- | ------------------------- |
| `npm run dev`   | Start the dev server      |
| `npm run build` | Production build          |
| `npm run start` | Run the production build  |
| `npm run lint`  | Lint with ESLint          |

---

## Tech stack

- **Next.js** (App Router) + **React 19**
- **Tailwind CSS v4** with **shadcn/ui** (radix-nova preset)
- **Radix UI** primitives, **lucide-react** icons
- **Recharts** for analytics charts
- **sonner** for toasts, **next-themes** for theming, **date-fns** for dates
- Local persistence through the browser's `localStorage` (no database)

---

## Project structure

```
src/
  app/               # routes (one segment per section), layout, global styles
  components/
    shell/           # AppProvider (store context), AppShell, sidebar rail,
                     # mobile drawer, grouped nav, profile/status/quick-actions
    sections/        # per-route screens (Dashboard, Habits, ..., Sleep, Analytics)
    dashboard/       # dashboard cards (Now, progress, tasks, goals, plan, activity)
    analytics/       # recharts wrappers, activity heatmap, insights list, cards
    categories/      # category manager + form dialog
    day/             # day-review pieces: scorecard, 24-hour strip, review list,
                     # missed-note dialog, follow-ups, sleep logger, audit panel
    schedule/        # timetable bar, click-to-edit day grid, slot list and
                     # dialogs, planned vs actual
    calendar/        # month grid, day cell, two-day comparison
    ui/              # shadcn/ui primitives
  hooks/             # useHabitStore (state + persistence), useDerivedData,
                     # useSidebar, useNow, reminder hooks
  lib/               # pure helpers: date, day, calendar, timetable, sleep, stats,
                     # analytics, insights, identity, categories, nav, storage
  types/             # shared TypeScript types
```

---

## Design notes

- The theme keeps a deliberately **monochrome base** with a small semantic layer
  on top: `--success` for completed, `--destructive` for missed, `--warning` for
  streaks. The `--chart-1..5` tokens add hue for analytics, and **category
  colors** remain the one place arbitrary hue is allowed, because the color is the
  category's identity.
- All time entry uses a shadcn popover time picker (hour / minute / AM-PM), and
  dates use the shadcn calendar. The app displays **12-hour AM/PM** time
  throughout while storing 24-hour values internally.
- The sidebar animates its width and label positions together and respects
  **`prefers-reduced-motion`**.
