---
name: solitaire-habit-log
description: Use when Si shares a screenshot of a Solitaire app "Results" screen (e.g. Crown Solitaire's daily deal) showing Deal date, Draw mode, and a You/Best comparison table of Score, Time and Moves. Extracts the day's session data and appends it to the solitaire habit log at _data/habits/solitaire.json so it shows up on /habits/solitaire/ and /habits/.
---

# Solitaire habit log import

Si tracks a daily solitaire challenge deal on his blog at
`/habits/solitaire/`, part of the combined `/habits/` section. When he shares
a screenshot of the Solitaire app's post-game "Results" screen, extract the
day's data and append it to `_data/habits/solitaire.json` - do not just
describe the numbers back.

## What the screenshot looks like

A "Results" screen with a crown trophy graphic, a heading like
`Deal DD/MM/YYYY - Draw N`, and a two-column stats table:

```
          You      Best
Score:    3,939    27,619
Time:     3:32     0:26
Moves:    111      83
```

Below the results card is a row of game-mode icons (Crown Solitaire, Castle,
FreeCell, Pyramid Solitaire, Hearts, Spider Solitaire, ...) - whichever one
is highlighted/bordered is the game mode that was played. This skill is
scoped to daily-challenge deals from this results screen regardless of which
game mode is highlighted; note the mode in the commit message if it isn't
Crown Solitaire.

There's no phone status-bar clock visible in this screen (unlike the Yudoku
results screen), so there's no reliable session time to extract - don't
guess one.

## What to extract

| Field | Source | Format |
|---|---|---|
| `date` | The `Deal DD/MM/YYYY` heading (this is the deal's date, day/month/year) | `YYYY-MM-DD` |
| `drawMode` | The `- Draw N` part of the same heading | e.g. `"Draw 3"` |
| `score` | "Score" row, **You** column | integer (strip commas) |
| `durationSeconds` | "Time" row, **You** column | integer seconds, `M:SS` → total seconds (e.g. `3:32` → `212`) |
| `moves` | "Moves" row, **You** column | integer |

The **Best** column is the game's own all-time personal best, not a new data
point for today - see below for how it's handled.

## Where it goes

1. Read `_data/habits/solitaire.json`.
2. Append a new object to the end of its `entries` array with the five
   fields above (entry order doesn't matter - the site sorts by date at
   build time; there's no `time` field on these entries).
3. **De-duplication**: this is a once-a-day challenge deal. If an entry for
   the same `date` already exists, ask Si whether to overwrite it rather
   than silently adding a second entry for the same day.
4. **Personal best**: the screenshot's **Best** column is the game's
   in-app all-time record, independent of what's logged here. Update the
   top-level `personalBest` object (`score`/`durationSeconds`/`moves`/
   `notedOn`) only if the screenshot's Best values differ from what's
   currently stored (i.e. the record has moved on since it was last noted) -
   set `notedOn` to the date this screenshot was sent. If the Best values
   match what's already stored, leave `personalBest` alone.
5. Save the file. No other file needs to change for a new solitaire session.
6. If a dev build is available in the session, you can run `npx eleventy`
   (or `npm run build`) to sanity-check the JSON is valid and the page
   builds, but a full build is slow - it's not required, the site rebuilds
   on deploy.
7. Commit and push the change the same way you would any other content
   update in this repo (see the repo's branch/commit conventions) - a short
   message like `Log solitaire deal for 2026-08-04` is enough. Don't ask
   for confirmation on this specific, low-risk data-only commit unless
   something about the extraction is ambiguous (an unreadable digit, a
   missing stat, or an existing entry for that date).

## A different habit, or a different screen

This skill is specifically for the Solitaire app's Results screen going
into `solitaire.json`. If Si shares a screenshot for a habit that isn't
this, don't force the data into `solitaire.json`. Instead follow the same
general pattern (see also the `yudoku-habit-log` skill):

1. Create `_data/habits/<slug>.json` with `id`, `name`, `icon`, `source`,
   `description`, `primaryMetric` (`key`/`label`/`unit`/`goal`), optionally
   `secondaryMetric` and `extraStats`, and an `entries` array - copy the
   structure from an existing habit file such as `solitaire.json` or
   `sudoku.json`.
2. Copy `src/pages/habits/solitaire.njk` to `src/pages/habits/<slug>.njk`,
   swapping the `"solitaire" | getHabit` slug and the page title/description.

Nothing else needs to change - `/habits/` and its shared table/chart
rendering (`_11ty/habits.js`, `_11ty/habits-data.js`) already work
generically off whatever habit JSON files exist in `_data/habits/`.
