---
name: weeknotes-draft
description: Use when asked to assemble or draft a new WeekNotes post for sijobling.com (e.g. the weekly scheduled task). Gathers the week's data from Strava, habit logs, Spotify, Letterboxd and Si's repos, then opens a draft PR against main for Si to edit.
---

# WeekNotes draft

Assemble a first-pass `posts/weeknotes/<year>-<week>.md` covering the 7 days up to and including today. Open it as a **draft** pull request against `main`. Never merge it, mark it ready, or post it anywhere else - Si edits it line by line.

Use the most recent weeknotes post (e.g. `posts/weeknotes/2026-41.md`) as the template for tone, front matter and section order: intro line, the main topic of the week first, HF, PETALS, Habits, Entertainment, "How this is made".

## Sources

- **Strava** - the "Strava log" Google Sheet, sheet `Data from IFTTT` (columns: created, type, name, distance m, elapsed time, seconds). Compare this week with the previous 7 days. Show walking, running, swimming, total time and total distance as stat cards. If Google Drive isn't connected, skip the section and say so in the PR description.
- **Habits** - `_data/habits/*.json`. Always give week-on-week change, not just the current figure. Check the last entry date for each habit; if the log is behind, say so and flag it for Si rather than guessing.
- **Spotify** - Google Drive sheets named `Spotify - Week <ISO week> <year>` (columns: time, track, artist, id, url, isrc, duration, tempo). A week can span two sheets. Note any gaps in the log rather than treating them as quiet listening.
- **Movies** - Si's Letterboxd feed: https://letterboxd.com/si/rss. Use it as the reference point for films watched in the week (title, watched date, rating, review text). If it can't be fetched from the session, say so in the PR and leave a `TODO(Si)`.
- **TV** - Netflix and BBC iPlayer exports when Si provides them, otherwise ask.
- **Side projects** - recent commits and merged PRs in `petals-team/app`, `petals-team/marketingsite`, `si/hf` and any other repo attached to the session (for example `si/okr-habits`). For PETALS, link the published blog posts and content updates on https://usepetals.com, and say when app changes went to production.
- **House Finesse** - this week's episode post in `si/hf` (`src/posts/<year>/`) and any site changes. Don't call out contrasts with other residents in the copy.

## Components

Use the reusable shortcodes, not hand-written HTML:

- `{% statCards %}` / `{% statCard emoji, label, value, direction, deltaText %}` for habits and fitness (direction is `up`, `down` or `flat`).
- `{% ctaButtons %}` / `{% ctaButton label, href %}` for sponsor, listen and join links.
- `{% deviceFrame %}` / `{% deviceFrameScroll %}` for app screenshots, when there are screenshots to show.

## Preserve the history: images and links (standard for every update)

Si wants a lasting record of his work, so every update mentioned in a post needs a link and a visual, not just prose.

- **Link** the live page, post or PR for each update (site pages, blog posts, banners, releases).
- **Find an associated image first**: a blog post's `featuredImage`, a screenshot in the PR or repo, newsletter images. Reuse it rather than recreating it.
- **Otherwise take screenshots.** Build or serve the site locally and capture it with Playwright (Chromium is at `/opt/pw-browsers/chromium`; use `executablePath`, don't run `playwright install`). Take desktop (about 1280px) and mobile (about 390px) shots of the changed element or page, at 2x scale, and look at them before using them.
- Save under `img/assets/<year>/<month>/` with a descriptive name (for example `hf-patreon-banner-desktop.png`) and embed with meaningful alt text.
- **Be honest about gaps.** The sandbox blocks some hosts (the live HF site, Google Calendar, CDN fonts), so a local build can render a fallback state or fallback fonts. Don't fake data to fill a screenshot. Leave a `TODO(Si)` and say in the PR what's missing and why.

## Draft rules

- Write in Si's voice (first person, plain, warm). Use `TODO(Si)` for anything that needs his input rather than inventing it.
- Don't fabricate. If a value was read from a screenshot, flag it.
- Keep the "How this is made" section at the bottom up to date with any change to this process.
- PR description: list sources used, what was skipped and why, and any data gaps.
