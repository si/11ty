---
title: "Crate: Product on a Page"
date: 2026-09-27
categories:
  - "blog"
tags:
  - "product-on-a-page"
  - "ios"
  - "house-finesse"
draft: true
---

<!-- OUTLINE / DRAFT NOTES: replace each note with prose before publishing. Screenshots to add: simulator view, running order view on iPhone. -->

**This month's Product On A Page: Crate, my first shipped iOS app, built to stop me faffing about in the Files app before a House Finesse mix.**

- Years of side projects; this is the first iOS one that actually exists and works.
- Called it Crate, after crate digging, the DJ habit of flicking through records to find the right one.
- Work in progress; another little side project to play with.

## Every month I buy music I can't easily listen to

- Buying tracks from Traxsource and Beatport for the monthly House Finesse mix.
- Each month's downloads go into a dated folder in iCloud Drive.
- Apple Music isn't synced, so the files just sit there; the Files app is not a music player.
- The real job: working out a running order for the mix.

## Building for one user is liberating

- No accounts, no onboarding, no settings screen, no support inbox.
- Can be as opinionated as I like because I'm the only user.

## Where I actually listen

- Most listening happens in the car, so CarPlay and Apple Watch are the ambition.
- Upfront: CarPlay isn't done yet. Version one is iPhone only, to get the core user journey right first.

## From voice mode to PRD to build in an hour

- Talked the idea through in Claude's voice mode, away from the keyboard.
- Back on the laptop, turned that conversation into a PRD.
- Built within an hour.
- The thinking happened in the conversation; the keyboard was just where it got written down.

## Turning the spec into a build prompt

- Handed the PRD over as the basis for the build prompt.
- Iterated rather than one-shotting it; roughly how many rounds.
- The tight loop: build in Claude, see it in the simulator, then on the phone almost straight away.
- Made sure the prompts remembered the testing situations, so fixes stuck.

<!-- SCREENSHOT: simulator view -->

## Getting it on my phone without the App Store

- Less dramatic than people expect: Xcode, a couple of approvals, then wireless sync between Mac and phone over Wi-Fi.
- The perceived barrier is much higher than the real one.

## Real files changed the spec

- The original spec scanned the whole Music folder and treated every subfolder as a monthly playlist.
- Once real data went in, cut the scope back to a single folder to reduce complexity.
- The simplification came from using it, not from planning it.

## Living with it

- Quick wins after the first real use.
- First mix prepped with it; did the running order workflow hold up in practice?
- iPhone only so far.

<!-- SCREENSHOT: running order view on iPhone -->

## What's next

- A backlog of feature ideas.
- CarPlay and Apple Watch still to come.
- Work in progress, and that's fine.

## Closing

- Years of side projects; the first iOS app I've actually shipped to my own phone, and it works.
- The barrier that stopped me for years was lower than I thought.
- The real payoff: the freedom to just enjoy the music without jumping between files in the Files app.
