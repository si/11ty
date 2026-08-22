---
title: "Product on a page: match-day commentary as a premium podcast feed"
date: 2026-08-22
description: "I pay DCFC £5 a month for live RamsTV commentary, but I can only hear it through their app or website. Podcasting 2.0 already has the plumbing to fix that. Here's the problem, the solution, and why it could work."
categories:
  - "blog"
tags:
  - "podcasting"
  - "football"
  - "product"
  - "value4value"
  - "dcfc"
---

I pay [DCFC.co.uk](https://www.dcfc.co.uk/) £5 a month for live RamsTV audio commentary of Derby County matches. It's good, I want it, and I'm happy to pay for it. But I can only listen to it through the DCFC website or their iOS app. That's it. Two doors, both owned by the club.

Meanwhile, Podcasting 2.0 already has everything needed to sell that exact same product through every podcast app a fan already has open. Nobody's built it yet. Here's the product on a page.

---

## The problem

Live club commentary is stuck behind bespoke apps.

Every club that wants to sell audio commentary as a subscription ends up building, or buying, its own player and its own app. RamsTV is DCFC's version of a pattern repeated across the football pyramid: a walled garden, one per club, each reinventing the same live-audio-behind-a-paywall wheel.

That's expensive for the club and restrictive for the fan. I already have a podcast app I use every day - Castro, in my case. I don't want a sixth app on my home screen just to hear commentary of a match I can't get to. And if I miss kick-off, there's no guarantee I get an on-demand version afterwards without going back into the same walled app.

The content is the same shape as a podcast episode: audio, tied to a timestamp, meant to be listened to live or later. It's just never been distributed like one.

## The solution

Ship match commentary as a normal podcast feed, using the Podcasting 2.0 namespace features that already solve this:

- **Fixtures become episodes.** Each upcoming match is a placeholder episode in the feed, driven off the fixture schedule - exactly the same data shape I already solve for [Football Cal](https://footballcal.com).
- **Kick-off flips it live.** The [`<podcast:liveItem>`](https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#live-item) tag marks an episode as `status="live"` at kick-off, streaming commentary into whatever podcast app the fan already uses.
- **Full-time flips it to replay.** The same tag moves to `status="ended"` when the match finishes, and the episode becomes a normal on-demand replay - no separate step, no separate archive.
- **It's a private, paid feed.** Subscribers get a tokenised feed URL, the same pattern Patreon and Supercast already use for premium podcasts - pay the subscription, get the link, lose access if you cancel.
- **Fans can tip the commentator directly.** A [`<podcast:value>`](https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#value) block splits Lightning payments between club, commentator, and platform - streaming sats live during the match, on top of the subscription, straight to the person calling the game.
- **Video and comments are additive, not a rewrite.** HLS video or [`<podcast:socialInteract>`](https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#social-interact) comment threads slot into the same episode model later, if it's worth it.

**Truefans** and **Fountain** already support live items and value-for-value end to end. Nobody's pointed that at "subscribe to your club, get live commentary in your podcast app."

## Why this works

**The willingness to pay is already proven.** I'm the evidence - £5/month, no complaints, been paying it for ages. This isn't a product that needs to convince fans commentary is worth money. It needs to stop making them install an app to get it.

**Distribution beats another walled app.** A podcast feed reaches every app a fan already has, not one bespoke player the club has to build and maintain forever. That's less engineering for the club, more reach for the same content.

**The fixture-to-episode mapping isn't new work.** Turning a fixture schedule into structured content is a problem I've already solved for calendar feeds. Mapping the same schedule onto podcast episodes instead of ICS events is the same shape of problem, not a new one.

**V4V opens a second revenue line no club app currently offers.** Subscription pays for access; Lightning tips pay the person actually on commentary, live, while they're doing it. That's a direct fan-to-commentator connection that doesn't exist in any club's current setup.

**The hard part is already built.** [Castopod](https://castopod.org/), an open-source, self-hostable podcast host, speaks live items, V4V splits, and private/passphrase-protected feeds natively. This isn't "invent podcast infrastructure" - it's "wire an existing open-source host up to a live audio source and a fixture list."

---

## What's next

Next step is making this tangible rather than just written down: a rough architecture diagram of how a fixture becomes a live episode becomes a replay, and a mocked-up prototype of what the private feed and V4V split would actually look like end to end. More on that once it exists.
