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

_Football Cal's World Cup edition - 48 teams, three countries, and Claude doing the heavy lifting on the data._

## Kick Off

[Football Cal](https://footballcal.com) has been running since Euro 2020, originally built on the Gatsby template I'd used across a few other competitions. For this edition I've migrated the whole thing to 11ty, the same stack as this site, which makes it much easier to maintain. The [code is open source on GitHub](https://github.com/sportstimes/footballcal-11ty) and the fixture data is just Markdown files, so it's easy to contribute or fork for another competition.

World Cup 2026 was always going to get the Football Cal treatment. First 48-team tournament, 104 games spread across the USA, Canada and Mexico. Biggest edition by some distance.

## The Data Problem

Getting the fixtures together was messier than any previous edition.

FIFA published the schedule as a PDF rather than anything structured or easy to work with. Kick-off times, venues and match details were spread across it inconsistently, and when I cross-referenced against other sources I found discrepancies straight away - different sites reporting different times for the same game, time zone conversions that were clearly wrong, early matches still showing placeholder team names after the draw had been made.

The late qualifiers added to it. A few intercontinental playoff spots weren't confirmed until recently, so any data gathered early needed another pass once those teams were known.

## Using Claude

I used [Claude](https://claude.ai) a lot more on this one than previous editions.

For Euro 2025, ChatGPT and Cursor handled the data and I had the whole thing done in a couple of hours. This time I used Claude throughout - pulling fixture data from FIFA's PDF, Wikipedia and a handful of other sources, sorting out the discrepancies between them, and generating the individual Markdown files with the right frontmatter for all 104 games. Getting the time zone data right across three countries took a few rounds of checking.

Once the final qualifier spots were confirmed I went back through and updated the relevant files.

## What Got Built

Core features are the same as previous editions - subscribable ICS feed, individual game pages, timeline view, filtering by group and stage. A few things were added or improved for this one:

- **Timeline view**: past events are now faded out so it's easier to scan to where you are in the tournament, with the next upcoming fixture highlighted
- **Redirects**: as placeholder team names were replaced with confirmed ones, old URLs now redirect cleanly to the updated pages rather than 404ing
- **Mobile typography**: tidied up the type on smaller screens where venue names and kick-off times were getting cramped
- **Buy Me a Coffee**: added a small widget for anyone who finds it useful and wants to chip in

## What's Next

There'll be small fixes as real traffic hits during the group stage. I'll keep an eye on the analytics through the competition and chip away at anything that needs attention.

The main thing I've taken from this edition is how much easier the data side gets with AI helping out. 104 games across three countries still came together pretty quickly, which makes it easier to justify doing more of these.

🔗 [footballcal.com/world-cup-2026](https://footballcal.com/world-cup-2026/) · [github.com/sportstimes/footballcal-11ty](https://github.com/sportstimes/footballcal-11ty)
