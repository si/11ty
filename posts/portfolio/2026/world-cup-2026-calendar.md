---
title: "World Cup 2026 Calendar"
date: 2026-05-27
categories:
  - "portfolio"
tags:
  - "calendars"
  - "football"
  - "world-cup"
  - "ai"
  - "claude"
  - "sports"
  - "11ty"
  - "open-source"
coverImage: "footballcal-world-cup-2026.png"
---

_The biggest football tournament in history, with the biggest data challenge I've faced on any of these calendar projects - and the first time I've used AI as a genuine collaborator to get it done._

## Kick Off

[Football Cal](https://footballcal.com) has been my go-to sports calendar project since I launched it for Euro 2020, building on the framework I first created for the Rugby World Cup back in 2019. The idea is simple: structured fixture data in Markdown files, deployed as a static site, generates a subscribable ICS calendar you can add directly to your phone, desktop or Google Calendar. The [codebase is open source on GitHub](https://github.com/sportstimes/footballcal-11ty) and this edition marked a full migration from the old Gatsby template to 11ty - the same stack powering this site.

For Euro 2025, I got a taste of what AI-assisted data wrangling could look like. Using ChatGPT and Cursor, I had the full fixture calendar live in under two hours. It was a revelation. So when World Cup 2026 started to loom large - the first 48-team tournament, co-hosted across three countries, with 104 games scheduled across the USA, Canada and Mexico - I knew this was both the most obvious and the most demanding edition yet.

## The Opposition

Previous calendar projects have had their data challenges, but nothing quite like this.

FIFA published their fixture schedule in a PDF - not a structured, machine-readable format but an awkwardly laid out document that resisted any clean extraction. Venue names, kick-off times and matchups were spread across the pages with inconsistent formatting and no reliable column structure to parse from. Cross-referencing that against secondary sources revealed discrepancies almost immediately: different sites reporting different kick-off times for the same game, time zone conversions done wrong, early qualifiers listed with placeholder matchup names that hadn't been updated when the draw was made.

The late qualifiers compounded this. A handful of intercontinental playoff spots weren't confirmed until relatively recently, meaning any data gathered early was necessarily incomplete. Running on placeholder names ("Qualifier A vs Qualifier B") is manageable for the group stage but becomes genuinely confusing when you're trying to deliver something useful before the tournament starts.

## Bringing Claude Off the Bench

This is the first edition where I've used [Claude](https://claude.ai) as the primary AI collaborator throughout the project rather than as an occasional coding assistant.

The main job was data: taking fixture information gathered from a range of sources - FIFA's PDF, [Wikipedia's structured tables](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup), dedicated football data sites and early media coverage - and transforming it into the Markdown files with frontmatter that the Sports Times template expects. Each fixture is its own `.md` file with fields for the date, time, venue, home team, away team, group, stage and any tags. For 104 games across multiple time zones and three host countries, doing that by hand would have been deeply tedious.

Claude handled the extraction, normalisation and file generation. Where sources disagreed, I'd surface the conflict and we'd cross-reference to establish the most reliable answer. Where FIFA's PDF had formatting oddities, Claude helped parse the intent rather than the literal characters. It wasn't a single-pass process - it took several rounds of verification to get to a dataset I was confident in - but the collaboration made it significantly faster and more systematic than any previous edition.

Once the late qualifiers were confirmed, I updated the relevant files with the verified team names and rechecked the surrounding fixtures to ensure nothing else had shifted.

## The Match Day Features

The core calendar functionality carries over from previous editions: subscribable ICS feed, individual game pages, timeline view and filtering by group or stage. A few notable improvements shipped for this edition:

**Timeline view** — past events now fade out so the page naturally draws your eye to what's coming up rather than what's already been played. The next upcoming fixture is highlighted to give an at-a-glance anchor when the group stage is in full swing and there are multiple games per day.

**Redirects for updated fixtures** — as qualifier team names were confirmed and fixtures updated, old indexed URLs needed to forward cleanly to the revised pages. A set of redirects handles this so any bookmarked or search-indexed links from early in the build don't land on a 404.

**Mobile typography** — some of the type was getting cramped on smaller screens, particularly around venue names and kick-off times. A tidy-up pass brought the hierarchy into better shape without changing the overall visual language.

**Buy Me a Coffee** — added a small widget for anyone who finds the calendar useful and wants to say thanks. These projects cover their own hosting costs but a small contribution always encourages the next one.

## Full Time

Compared to any previous edition of these calendar projects, this one has felt the most like a genuine collaboration between me and a tool rather than just me with a faster autocomplete. The data work especially — the extraction, normalisation, verification and file generation — would have been the kind of grind that either slows you down badly or introduces the sort of errors you only discover when a subscriber emails to say their calendar shows the wrong kick-off time.

Using Claude didn't make the data problem disappear. FIFA's PDF was still awkward, sources were still inconsistent, and the late qualifiers still meant a late update pass. But having a capable collaborator to work through those problems systematically made the process faster, more thorough and honestly more enjoyable.

## Extra Time

There are always improvements in the backlog by the time something goes live. Beyond what's already shipped, I'm keeping an eye on user feedback through the competition and there's a Plausible analytics dashboard running to track what people are actually using.

The bigger question for me is what this edition proves about the model. If AI collaboration can take the data side of these calendar projects from "a week of careful grinding" to "an evening of focused work", then the range of competitions worth covering expands considerably. There are a lot of sports calendars that don't exist yet.

🔗 [footballcal.com/world-cup-2026](https://footballcal.com/world-cup-2026/) · [github.com/sportstimes/footballcal-11ty](https://github.com/sportstimes/footballcal-11ty)
