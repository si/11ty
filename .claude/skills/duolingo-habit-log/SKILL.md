---
name: duolingo-habit-log
description: Use when Si shares a new Duolingo data export (a zip or CSV from the "Progress" Numbers spreadsheet - "Progress-Data.csv" plus pivot-table CSVs like "Daily Average", "Weekly Average", "Weekday Average", "Data Pivot") to append the new lesson sessions to the Duolingo habit log at _data/habits/duolingo.json so they show up on /habits/duolingo/ and /habits/.
---

# Duolingo habit log import

Si tracks his Duolingo lesson sessions on his blog at `/habits/duolingo/`, part
of the combined `/habits/` section. He logs sessions in a Numbers spreadsheet
on iCloud and periodically exports it as a zip of CSVs. When he shares a new
export, extract the *new* rows and append them to
`_data/habits/duolingo.json` - do not just describe the numbers back.

## What's in the export

A zip with several CSVs, only one of which matters for the raw log:

- **`Progress-Data.csv`** - the source of truth, one row per lesson session.
  Header: `When,XP,Accuracy,Time taken,Language,Level,Combo / Notes`.
- `Daily Average-Data Pivot.csv`, `Weekly Average-Data Pivot.csv`,
  `Weekday Average-Data Pivot.csv`, `Data Pivot-Data Pivot.csv` - these are
  Numbers pivot-table exports (accuracy/XP aggregated by day, week, weekday).
  **Ignore them** - the site already computes its own month/day rollups from
  the raw log in `_data/duolingoMonths.js`, and these pivots have no data the
  raw log doesn't already have.

## Finding what's new

`Progress-Data.csv` is a full export from the beginning, not just new rows -
it will mostly overlap with what's already in `_data/habits/duolingo.json`.
Only append the rows *after* the last entry already in the JSON file:

1. Read the last entry in `_data/habits/duolingo.json` (its `date` + `time`).
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

1. Read `_data/habits/duolingo.json` and note its last entry.
2. Append the new, parsed entries to the end of its `entries` array, in
   the order they appear in the CSV (append order doesn't need to be
   perfectly sorted - the site sorts by date/time at build time, but keeping
   chronological order makes the diff easy to review).
3. Preserve the file's existing JSON formatting (2-space indent, one key per
   line, `ensure_ascii=false` if scripting the edit - the file has emoji
   elsewhere) - a diff that only adds rows at the end is much easier to spot
   check than one that reformats the whole file.
4. **De-duplication**: if a "new" row's date/time/xp/accuracy/duration all
   match an entry already in the file, skip it - some exports include a
   couple of overlapping rows at the boundary.
5. No other file needs to change - `_data/duolingoMonths.js`,
   `src/pages/habits/duolingo.njk`, and the shared `/habits/` machinery
   (`_11ty/habits.js`, `_11ty/habits-data.js`) all recompute from
   `_data/habits/duolingo.json` at build time.
6. If a dev build is available in the session, `npx eleventy` (or
   `npm run build`) sanity-checks the JSON is valid and the page builds, but
   a full build is slow (see the repo's build-speed notes) - only do this if
   asked to verify, not as a default step.
7. Commit and push the change the same way you would any other content
   update in this repo - a short message like `Log Duolingo sessions through
   2026-08-03` is enough. Don't ask for confirmation on this specific,
   low-risk data-only commit unless something about the extraction is
   ambiguous (an unparseable duration, an overlap point you can't find,
   etc).

## A different habit, or a different export shape

This skill is specifically for Duolingo's Numbers-export CSV going into
`duolingo.json`. If Si shares data for a different habit, don't force it
into this file - follow the general pattern in the `yudoku-habit-log` skill
instead: create `_data/habits/<slug>.json` with `id`/`name`/`icon`/`source`/
`description`/`primaryMetric`/`entries` (copy the shape from an existing
habit file), and a matching `src/pages/habits/<slug>.njk` page. Nothing else
needs to change - `/habits/` works generically off whatever's in
`_data/habits/`.
