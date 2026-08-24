---
name: solitaire-habit-log
description: Use when Si shares a screenshot of a Solitaire app "Results" screen (e.g. Crown Solitaire's daily deal) showing Deal date, Draw mode, and a You/Best comparison table of Score, Time and Moves. Extracts the day's session data and logs it to the solitaire habit's Google Sheet via the habits-api webhook, so it shows up on /habits/solitaire/ and /habits/.
---

# Solitaire habit log import

Si tracks a daily solitaire challenge deal on his blog at
`/habits/solitaire/`, part of the combined `/habits/` section. When he shares
a screenshot of the Solitaire app's post-game "Results" screen, extract the
day's data and POST it to the habits-api webhook (see "Where it goes" below)
- do not just describe the numbers back.

Entries live in a Google Sheet now, not in git (`_data/habits/solitaire.json`
only holds schema metadata - see `worker/README.md` for the architecture).
This skill needs `HABITS_WORKER_URL` and `HABITS_WEBHOOK_SECRET` available as
environment variables in the session. If either is missing, ask Si for them
rather than guessing or falling back to editing the JSON file directly.

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

1. `GET ${HABITS_WORKER_URL}/habits/solitaire` and check whether an entry
   for this screenshot's `date` already exists.
2. **De-duplication**: this is a once-a-day challenge deal. If an entry for
   the same `date` already exists, ask Si whether to log it anyway (it
   currently appends rather than overwrites, so re-sending would create a
   second row for that day) rather than silently double-logging.
3. `POST ${HABITS_WORKER_URL}/habits/solitaire/entries` with header
   `X-Habit-Webhook-Secret: ${HABITS_WEBHOOK_SECRET}` and a JSON body with
   the five fields above (no `time` field on these entries):
   ```json
   {"date": "2026-08-04", "drawMode": "Draw 3", "score": 3939, "durationSeconds": 212, "moves": 111}
   ```
4. **Personal best**: the screenshot's **Best** column is the game's
   in-app all-time record, independent of what's logged here. Update the
   `personalBest` object in `_data/habits/solitaire.json`
   (`score`/`durationSeconds`/`moves`/`notedOn`) only if the screenshot's
   Best values differ from what's currently stored (i.e. the record has
   moved on since it was last noted) - set `notedOn` to the date this
   screenshot was sent, and commit/push that file change (this is the one
   piece of solitaire data that's still schema metadata in git, not a Sheet
   row). If the Best values match what's already stored, leave it alone.
5. Verify by re-fetching `GET ${HABITS_WORKER_URL}/habits/solitaire` and
   checking the new entry is present.

## A different habit, or a different screen

This skill is specifically for the Solitaire app's Results screen. If Si
shares a screenshot for a habit that isn't this, don't force the data into
this flow. Instead follow the same general pattern (see also the
`yudoku-habit-log` skill):

1. Create `_data/habits/<slug>.json` with `id`, `name`, `icon`, `source`,
   `description`, `primaryMetric` (`key`/`label`/`unit`/`goal`), optionally
   `secondaryMetric`, `extraStats`, and a `sheetId` - copy the structure
   from an existing habit's schema-config such as `solitaire.json` or
   `sudoku.json`. See `worker/README.md` for creating the Google Sheet and
   adding the habit to `worker/src/habitConfigs.js`.
2. Copy `src/pages/habits/solitaire.njk` to `src/pages/habits/<slug>.njk`,
   swapping the `"solitaire" | getHabit` slug and the page title/description.

Nothing else needs to change - `/habits/` and the habits-api Worker both
work generically off whatever schema-configs exist in `_data/habits/`.
