---
name: weeknotes-draft
description: Use on Sunday mornings, or whenever Si asks for a new weeknotes draft, to assemble a fresh WeekNotes post covering the past 7 days - side projects, actual habit data (not just status), fitness, and any personal news Si's mentioned - and open it as a PR for Si to review and edit line by line. Do not merge it or mark it ready; it's a first draft for him to work over.
---

# WeekNotes draft

Builds a new `posts/weeknotes/<year>-<isoweek>.md` post for the past 7 days
and opens it as a PR, following the shape established in WeekNotes 2026-39
(`posts/weeknotes/2026-39.md`) - read that post first as the reference for
tone, structure and the reusable components before writing anything.

## Scope: the past 7 days only

Everything in the post should be timeboxed to the 7 days ending today. Don't
reach further back unless a section explicitly needs a comparison window
(habit "last week" deltas need the 7 days before that).

## 1. File and PR

- Work out the ISO week number for today (`date.isocalendar()` in Python, or
  equivalent) and name the file `posts/weeknotes/<year>-<week>.md`, e.g.
  `2026-40.md`. Title: `"WeekNotes <year>-<week>"`.
- Branch: `claude/weeknotes-<year>-<week>`.
- Open a PR against `main` titled `WeekNotes <year>-<week> draft`. Say
  plainly in the PR description that it's a first-pass draft assembled
  automatically and needs a line-by-line human edit before publishing -
  do not mark it ready for review or ask for it to be merged.

## 2. Side projects

Si works across several repos day to day. Check each for anything that
actually shipped or moved meaningfully in the last 7 days (merged PRs,
commits, new posts/episodes) - don't write a section for a repo with no
real activity that week:

- `si/okr-habits` - his OKR Daily Card side project (`PLAN.md` tracks
  stories). Check recent commits/PRs.
- `si/hf` - House Finesse podcast (`src/posts/<year>/`). Check for a new
  episode post dated in the window.
- `PETALS-team/marketingsite` - the PETALS blog (`src/content/blog/`).
  Match publish date to the *merge* commit timestamp, not just the
  frontmatter `date` (they can lag, as documented in 2026-39).
- Any other repo Si mentions in his prompt that isn't already in this list.

Add repos with `add_repo` as needed (they won't be in scope by default).
If a repo needs private/personal content judgement (anything under
`si/journal`), don't read it directly - PII handling in this environment
will likely block it anyway. Ask Si for the specific detail instead, the
way the new-job section in 2026-39 was handled.

## 3. Habits - actual data, not status

Read `_data/habits/*.json`. For each habit still being tracked, report what
actually happened this week compared to last week - not "up to date."
Follow the shape from 2026-39's Habits section:

- **MapTap** (`_data/habits/maptap.json`): average `finalScore` this week
  vs. the previous 7 days, and the win/loss/draw record against Gary
  (`result` field) for the week, compared to the previous week's record.
- **Sudoku** (`_data/habits/sudoku.json`): fastest and slowest
  `durationSeconds` this week vs last week's fastest, and the range of
  `mistakes` this week vs last week's worst.
- **Duolingo** (`_data/habits/duolingo.json`): as of late September 2026 Si
  is deliberately pausing/reducing effort while he reviews the Super
  subscription - check with him whether that's still the state before
  writing anything here, it may have changed.
- **Solitaire**: dropped from these posts (see 2026-39) - don't mention it
  unless Si brings it back up himself.

Use `{% statCard %}` / `{% statCards %}` for the numbers (see
`_11ty/stat-cards.js` for the signature) - don't write raw HTML.

## 4. Fitness

Si's Strava log lives in a Google Sheet titled "Strava log" (search Drive
for it, not the "Strava Template" or "Strava sample" ones). Download it as
CSV (`download_file_content` with `exportMimeType: text/csv`) rather than
relying on `read_file_content`'s preview, which truncates. Compute this
week vs last week by activity type (walking/running/swimming are the
regulars) plus total time and total distance, same shape as 2026-39's
"Building up to 50km" section. Check with Si whether there's a specific
event or challenge still worth tying the numbers to (there was a 50km
Ultra Challenge on 10 Oct 2026 - update or drop that framing once it's
passed).

## 5. Screenshots and CTAs

If a side project has shipped something visual worth showing (a new app
screen, a podcast cover), ask Si for screenshots rather than guessing - the
session generally has no working browser tool and network access to most
external sites is blocked, so screenshots have to come from Si. Use
`{% deviceFrame %}` / `{% deviceFrameScroll %}` / `{% deviceFrames %}` for
app screenshots (`_11ty/device-frame.js`) and `{% ctaButton %}` /
`{% ctaButtons %}` for subscribe/follow links (`_11ty/cta-buttons.js`).
Never write literal `{% %}` shortcode syntax inside prose text (it'll be
parsed as a real Liquid tag since these posts render through Liquid) - name
components by their bare name in prose instead.

## 6. Personal touches

Leave room for Si to add the personal stuff himself - that's the point of
"review the draft adding other personal touches." Don't invent life updates
or guess at feelings/context you don't have. A short placeholder note or
just leaving a gap is better than fabricating something personal.

## 7. Closing section

Keep a closing "How this post gets made" note (see 2026-39) naming any new
reusable components added that week and confirming this post itself is a
Claude-assembled first draft. Don't overclaim - only list components that
were actually added or meaningfully changed.

## Validate before pushing

- Parse the frontmatter with `yaml.safe_load` to catch YAML errors.
- `grep -n '{%'` the finished file and read every match - confirm each one
  is an intentional shortcode call with matching open/close tags, not a
  stray literal in prose.
