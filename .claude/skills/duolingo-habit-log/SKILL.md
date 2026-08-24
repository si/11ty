---
name: duolingo-habit-log
description: Use when Si shares a new Duolingo data export (a zip or CSV from the "Progress" Numbers spreadsheet - "Progress-Data.csv" plus pivot-table CSVs like "Daily Average", "Weekly Average", "Weekday Average", "Data Pivot") to log the new lesson sessions to the Duolingo habit's Google Sheet via the habits-api webhook, so they show up on /habits/duolingo/ and /habits/.
---

# Duolingo habit log import

Si tracks his Duolingo lesson sessions on his blog at `/habits/duolingo/`, part
of the combined `/habits/` section. He logs sessions in a Numbers spreadsheet
on iCloud and periodically exports it as a zip of CSVs. When he shares a new
export, extract the *new* rows and POST them to the habits-api webhook (see
"Where it goes" below) - do not just describe the numbers back.

Entries live in a Google Sheet now, not in git (`_data/habits/duolingo.json`
only holds schema metadata - see `worker/README.md` for the architecture).
This skill needs `HABITS_WORKER_URL` and `HABITS_WEBHOOK_SECRET` available as
environment variables in the session. If either is missing, ask Si for them
rather than guessing or falling back to editing the JSON file directly.

## What's in the export

A zip with several CSVs, only one of which matters for the raw log:

- **`Progress-Data.csv`** - the source of truth, one row per lesson session.
  Header: `When,XP,Accuracy,Time taken,Language,Level,Combo / Notes`.
- `Daily Average-Data Pivot.csv`, `Weekly Average-Data Pivot.csv`,
  `Weekday Average-Data Pivot.csv`, `Data Pivot-Data Pivot.csv` - these are
  Numbers pivot-table exports (accuracy/XP aggregated by day, week, weekday).
  **Ignore them** - the site already computes its own month/day rollups from
  the raw log client-side (`src/habits-app.js`), and these pivots have no
  data the raw log doesn't already have.

## Finding what's new

`Progress-Data.csv` is a full export from the beginning, not just new rows -
it will mostly overlap with what's already logged. Only send the rows *after*
the last entry already logged:

1. `GET ${HABITS_WORKER_URL}/habits/duolingo` and note the last entry's
   `date` + `time` (entries come back date/time-sorted).
2. In the CSV, find the row with a matching "When" timestamp - match on
   parsed date/time and the xp/accuracy/duration values together, since
   there can be several sessions in the same minute.
3. Only the CSV rows *after* that matching row are new. If nothing matches
   (e.g. a fresh device export with different formatting), ask Si before
   guessing at an overlap point.

## Parsing each new row

| Field | Source | Format |
|---|---|---|
| `date` | "When" column | `YYYY-MM-DD` |
| `time` | "When" column | `HH:MM`, 24-hour |
| `xp` | "XP" column | integer |
| `accuracy` | "Accuracy" column | integer 0-100 (strip `%` if present; some rows already have a bare int) |
| `durationSeconds` | "Time taken" column | integer seconds - see duration parsing below |
| `language` | "Language" column | string, forward-filled (see below) |
| `level` | "Level" column | integer, or `null` if blank/non-numeric |
| `combo` | "Combo / Notes" column | integer, or `null` - see combo parsing below |

**"When" formats vary a lot** across the export - `"Sat, 14 Feb 2026 12:16"`,
`22/04/2026 18:38`, `2/6/26 19:30`, `5/6/26 21:12:00`. Parse whatever format
appears; the emoji flag sometimes present in the `Language` column (e.g.
"French 🇫🇷") should be stripped in the stored `language` value (just
"French").

**Duration parsing**: values appear as `M:SS`, `MM:SS`, `H:MM:SS`, or spelled
out like `2m 53s` / `1:45:00`. Convert all to total integer seconds. A small
number of rows have obviously-corrupt durations (e.g. a full date-time string
copied into the duration cell, like `"18/03/2026 03:17:00"` or
`"1/8/26 2:04:00"`) - when the cell isn't a plausible duration, store
`durationSeconds: null` rather than guessing.

**Accuracy corruption**: some rows have accuracy values like `9400%`,
`10000%`, or `82%` mixed with plain `94`/`100` in the same column - this
looks like a spreadsheet formula/formatting glitch (percentage stored as a
raw fraction ×100 then displayed with an extra `%`, e.g. `100%` exported as
text became `10000%`). If accuracy would be over 100, divide by 100 (so
`9400` → `94`, `10000` → `100`) before storing. Never store an accuracy over
100.

**Language forward-fill**: many rows leave "Language" blank once a language
streak is well established (the spreadsheet only fills it in when it
changes). When blank, use the last non-blank language seen in the rows
processed so far (which, given the export is cumulative, is normally
whatever the last entry in the existing JSON already has). Don't forward-fill
`level` the same way - leave it `null` when blank, matching the existing data
(the site's `lastKnownValue()` helper handles finding the last known level
for display).

**Level corruption**: occasionally the Level column has a junk value like
`xx` instead of a number - treat as `null`, same as blank.

**Combo/Notes column**: this column is genuinely mixed-purpose - sometimes a
bare integer (`26`), sometimes a number with trailing text (`"11 combo"`,
`"31 combo "`), sometimes a leading `x`/`X` (`"X26 combo"`, `"Combo x14"`,
`"x18"`), sometimes free-text notes with no digits at all (`"Tricky lessons
plus lots of surrounding noise"`), sometimes empty. Extract the first
integer found anywhere in the cell as `combo`; if there's no digit at all,
store `null`. Never store the text itself.

**Malformed quoted rows**: a handful of rows have the entire row's data
crammed into one quoted CSV field because of an embedded comma (e.g.
`"11/07/2026 07:54, 96, 90%, 2:45",,,,Greek,,`) - the real when/xp/accuracy/
duration are inside that first quoted field as comma-separated text, and the
real columns after it are mostly blank except sometimes `Language`. Parse
the embedded values out of the quoted field the same way as a normal row.

## Where it goes

1. `GET ${HABITS_WORKER_URL}/habits/duolingo` and note the last entry (see
   "Finding what's new" above).
2. For each new, parsed entry, in the order they appear in the CSV:
   ```
   POST ${HABITS_WORKER_URL}/habits/duolingo/entries
   X-Habit-Webhook-Secret: ${HABITS_WEBHOOK_SECRET}
   Content-Type: application/json

   {"date": "...", "time": "...", "xp": ..., "accuracy": ..., "durationSeconds": ..., "language": "...", "level": ..., "combo": ...}
   ```
   Send a short pause between requests (a couple hundred ms) rather than
   firing them all at once - the Google Sheets API this webhook writes
   through has its own rate limits.
3. **De-duplication**: if a "new" row's date/time/xp/accuracy/duration all
   match an entry already returned by the `GET` in step 1, skip it - some
   exports include a couple of overlapping rows at the boundary.
4. Verify by re-fetching `GET ${HABITS_WORKER_URL}/habits/duolingo` and
   checking the new entries are present. No git commit is needed for this -
   entries live in the Duolingo Google Sheet now, not in this repo.

## A different habit, or a different export shape

This skill is specifically for Duolingo's Numbers-export CSV. If Si shares
data for a different habit, don't force it into this flow - follow the
general pattern in the `yudoku-habit-log` skill instead: create
`_data/habits/<slug>.json` with `id`/`name`/`icon`/`source`/`description`/
`primaryMetric`/`sheetId` (copy the shape from an existing habit's
schema-config, and see `worker/README.md` for setting up its Google Sheet
and adding it to `worker/src/habitConfigs.js`), and a matching
`src/pages/habits/<slug>.njk` shell page. Nothing else needs to change -
`/habits/` and the habits-api Worker both work generically off whatever
schema-configs exist in `_data/habits/`.
