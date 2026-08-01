---
name: yudoku-habit-log
description: Use when the user shares a screenshot of the Yudoku (sudoku, YuLife app) daily results screen - the "Great work! Come back tomorrow for a new round." completion screen showing Personal best, Today's time, Hints, Mistakes and Reward. Extracts the day's session data and appends it to the sudoku habit log at _data/habits/sudoku.json so it shows up on /habits/sudoku/ and /habits/.
---

# Yudoku habit log import

Si tracks his daily Yudoku (sudoku, played in the YuLife app) sessions on his
blog at `/habits/sudoku/`, part of the combined `/habits/` section. When he
shares a screenshot of the Yudoku results screen, extract the day's data and
append it to `_data/habits/sudoku.json` - do not just describe the numbers back.

## What the screenshot looks like

A results screen titled "Yudoku" with a YuCoin reward card, "Great work! /
Come back tomorrow for a new round.", and a stats list:

- Personal best (all-time best duration - **ignore**, not tracked here)
- Today's time (this session's duration, e.g. "3m 45s")
- Hints (ignore - not tracked)
- Mistakes (integer count)
- Reward (YuCoin earned - ignore, not tracked)

The phone status bar at the top shows the current clock time (e.g. "18:05").

## What to extract

Only four fields matter, matching the schema already used in
`_data/habits/sudoku.json`:

| Field | Source | Format |
|---|---|---|
| `date` | Not on screen - use today's date (the date this screenshot was sent/saved) | `YYYY-MM-DD` |
| `time` | Status bar clock at the top of the screenshot | `HH:MM`, 24-hour |
| `durationSeconds` | "Today's time" row, converted | integer seconds (e.g. "3m 45s" → `225`) |
| `mistakes` | "Mistakes" row | integer |

Ignore Personal best, Hints, and Reward/YuCoin entirely - they're shown on
screen but intentionally not part of this log.

## Where it goes

1. Read `_data/habits/sudoku.json`.
2. Append a new object to the end of its `entries` array with the four fields
   above (entry order doesn't matter - the site sorts by date/time at build
   time).
3. **De-duplication**: sudoku is a once-a-day puzzle. If an entry for the same
   `date` already exists, ask Si whether to overwrite it rather than silently
   adding a second entry for the same day.
4. Save the file. No other file needs to change for a new sudoku session.
5. If a dev build is available in the session, you can run `npx eleventy` (or
   `npm run build`) to sanity-check the JSON is valid and the page builds, but
   it's not required - the site rebuilds on deploy.
6. Commit and push the change the same way you would any other content update
   in this repo (see the repo's branch/commit conventions) - a short message
   like `Log sudoku session for 2026-08-01` is enough. Don't ask for
   confirmation on this specific, low-risk data-only commit unless something
   about the extraction is ambiguous (e.g. an unreadable digit, a missing
   stat, or an existing entry for that date).

## A different habit, or a different app

This skill is specifically for the Yudoku results screen going into
`sudoku.json`. If Si shares a screenshot for a habit that isn't sudoku (e.g. a
fitness app), don't force the data into `sudoku.json`. Instead follow the same
shape:

1. Create `_data/habits/<slug>.json` with `id`, `name`, `icon`, `source`,
   `description`, `primaryMetric` (`key`/`label`/`unit`/`goal`), optionally
   `secondaryMetric`, and an `entries` array - copy the structure from
   `_data/habits/sudoku.json`.
2. Copy `src/pages/habits/sudoku.njk` to `src/pages/habits/<slug>.njk`,
   swapping the `"sudoku" | getHabit` slug and the page title/description.

Nothing else needs to change - `/habits/` and its shared table/chart
rendering (`_11ty/habits.js`, `_11ty/habits-data.js`) already work generically
off whatever habit JSON files exist in `_data/habits/`.
