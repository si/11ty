---
title: "POP: Matchday Podcast Feed"
date: 2026-08-22
categories:
  - "blog"
tags:
  - "product-on-a-page"
  - "podcasting"
  - "football"
  - "dcfc"
coverImage: "matchday-feed-poc.png"
---

**This month's Product On A Page: what if match commentary showed up in your usual podcast app instead of your club's?**

I pay [DCFC](https://www.dcfc.co.uk/) £5 a month for live RamsTV commentary, but I can only get it through their website or the iOS app. Podcasting 2.0 already has most of what's needed to fix that: live episodes, chapter markers, value-for-value tipping. Nobody's pointed it at football yet.

I mocked this one up properly rather than scribbling it on paper, a screenshot for now, proper pen-and-paper version to follow. The bit I kept coming back to is the listener experience: same episode, same feed, completely different depending on when you open it. Mid-match it's streaming, sats ticking up as people tip the commentator. By full-time it's quietly become an on-demand replay, no separate archive, no re-upload, the feed item just changes state under you.

<figure>

![](/img/assets/2026/08/matchday-feed-poc.png)

<figcaption>

Matchday Podcast Feed Product On a Page: listener experience, chapter artwork, and the subscription/value-for-value proposal

</figcaption>

</figure>

Chapter artwork is the part I like most. Episode artwork stays spoiler-free, crests, kick-off time, venue, never a score. But `podcast:chapters` can carry a second image for every goal, booking or substitution, only swapped in once the playhead actually reaches it. Skip ahead and you've spoiled it for yourself. Nobody spoils it for you.

Subscription and value-for-value is more of a proposal at this point than a finished thought: pay for the private feed, then tip the commentator directly in sats while they're calling the match, split automatically between club, commentator and platform. Feels right, but needs someone who actually understands club finance to poke holes in it before it's anything more than that.

None of this needs inventing, either. [Truefans](https://truefans.fm/) and [Fountain](https://fountain.fm/) already do live items and value-for-value today, properly, in a shipped app. The hard part was never the technology, it's getting a club to actually buy into the idea, and that gets harder the further up the pyramid you go, where broadcasting rights are locked down tight. Realistic proof of concept is grassroots or lower EFL: less rights mess to navigate, and fans loyal enough to give something new a go.
