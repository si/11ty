---
name: yudoku-habit-log
description: Use when the user shares a screenshot of the Yudoku (sudoku, YuLife app) daily results screen - the "Great work! Come back tomorrow for a new round." completion screen showing Personal best, Today's time, Hints, Mistakes and Reward. Extracts the day's session data and logs it to the sudoku habit's Google Sheet via the habits-api webhook, so it shows up on /habits/sudoku/ and /habits/.
---

# Yudoku habit log import

Si tracks his daily Yudoku (sudoku, played in the YuLife app) sessions on his
blog at `/habits/sudoku/`, part of the combined `/habits/` section. When he
shares a screenshot of the Yudoku results screen, extract the day's data and
POST it to the habits-api webhook (see "Where it goes" below) - do not just
describe the numbers back.

Entries live in a Google Sheet now, not in git (`_data/habits/sudoku.json`
only holds schema metadata - see `worker/README.md` for the architecture).
This skill needs `HABITS_WORKER_URL` and `HABITS_WEBHOOK_SECRET` available as
environment variables in the session. If either is missing, ask Si for them
rather than guessing or falling back to editing the JSON file directly.

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

1. `GET ${HABITS_WORKER_URL}/habits/sudoku` and check whether an entry for
   this screenshot's `date` already exists.
2. **De-duplication**: sudoku is a once-a-day puzzle. If an entry for the
   same `date` already exists, ask Si whether to log it anyway (it currently
   appends rather than overwrites, so re-sending would create a second row
   for that day) rather than silently double-logging.
3. `POST ${HABITS_WORKER_URL}/habits/sudoku/entries` with header
   `X-Habit-Webhook-Secret: ${HABITS_WEBHOOK_SECRET}` and a JSON body with
   the four fields above:
   ```json
   {"date": "2026-08-01", "time": "18:05", "durationSeconds": 225, "mistakes": 1}
   ```
4. Verify by re-fetching `GET ${HABITS_WORKER_URL}/habits/sudoku` and
   checking the new entry is present. No git commit is needed - entries live
   in the sudoku Google Sheet now, not in this repo.

## A different habit, or a different app

This skill is specifically for the Yudoku results screen. If Si shares a
screenshot for a habit that isn't sudoku (e.g. a fitness app), don't force
the data into this flow. Instead follow the same shape:

1. Create `_data/habits/<slug>.json` with `id`, `name`, `icon`, `source`,
   `description`, `primaryMetric` (`key`/`label`/`unit`/`goal`), optionally
   `secondaryMetric`, and a `sheetId` - copy the structure from
   `_data/habits/sudoku.json`. See `worker/README.md` for creating the
   Google Sheet and adding the habit to `worker/src/habitConfigs.js`.
2. Copy `src/pages/habits/sudoku.njk` to `src/pages/habits/<slug>.njk`,
   swapping the `"sudoku" | getHabit` slug and the page title/description.

Nothing else needs to change - `/habits/` and the habits-api Worker both
work generically off whatever schema-configs exist in `_data/habits/`.
