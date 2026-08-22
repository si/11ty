# Product on a page: live match-day commentary as a premium podcast feed

Status: **idea only, not started**. Written up to capture the concept before
it's lost - not connected to this site's own build/engineering (unlike the
other docs in this folder), just parked here because this repo is where Si
keeps written-up ideas.

## The problem / opportunity

Right now, paying for live club commentary means paying for a walled garden.
Case in point: £5/month to DCFC.co.uk for live RamsTV audio, accessible only
via the website or the DCFC iOS app. That's a bespoke app and a bespoke
player for every club that wants to sell this, and it locks the fan out of
whatever podcast app they already use for everything else - Castro,
Fountain, Truefans, Apple Podcasts, Overcast.

Podcasting 2.0 has had the plumbing for this for a while:
[`<podcast:liveItem>`](https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#live-item)
for live-to-VOD audio inside a normal RSS feed, and
[`<podcast:value>`](https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#value)
for value-for-value (V4V) payment splits over Lightning. Truefans and
Fountain already ship both. Nobody's pointed this stack at "pay your club a
subscription, get live match commentary in your podcast app of choice."

## The pitch

Football fans pay a subscription (club- or league-branded) and get a
**private podcast feed** that:

- Lists upcoming fixtures as scheduled/placeholder episodes, driven off the
  fixture calendar (this is exactly the data model behind
  [footballcal.com](https://footballcal.com) - fixtures as structured data,
  already solved).
- Flips each fixture episode to **live** at kick-off via
  `<podcast:liveItem status="live">`, streaming commentary audio through a
  normal podcast app - no bespoke player, no bespoke app.
- Automatically becomes an **on-demand replay** episode (`status="ended"`)
  the moment the final whistle blows, so fans who couldn't listen live get
  the same content asynchronously.
- Carries a `<podcast:value>` block splitting Lightning V4V payments between
  club, commentator(s), and platform - streaming sats during a match is a
  tip jar that pays the commentator in real time, on top of the
  subscription.
- Could add video later (HLS) or comments (`<podcast:socialInteract>`)
  without changing the core model - the live-item mechanism doesn't care
  whether the enclosure is audio or video.

## Why this is more than a novelty

- **Distribution beyond the club's own app.** The content reaches whatever
  app the fan already has open, instead of forcing a fifth app onto their
  home screen for one club's commentary.
- **Reuses existing subscriber-feed patterns.** Private/premium podcast
  feeds (per-subscriber tokenised RSS URLs) are a solved problem -
  Patreon, Supercast, and Buzzsprout's premium feeds all do this today.
  Podcasting 2.0 doesn't need to reinvent it, just sit behind the same
  mechanism.
- **V4V gives clubs a second revenue line** on top of subscription, and
  gives fans a way to directly tip the person actually calling the match -
  something no current club app offers.
- **The fixture-schedule-to-episode-list mapping already exists** in
  spirit - it's the same shape of data problem as Football Cal's calendar
  feeds, just emitting podcast episodes instead of ICS events.

## Prior art / competitive landscape

- **Truefans** and **Fountain** - both already support `podcast:liveItem`
  and V4V end-to-end today. Neither is doing club-commentary-as-a-feed as a
  packaged product; they're general-purpose apps that happen to have the
  plumbing. That's the gap.
- **DCFC.co.uk / RamsTV** - proof that fans already pay ~£5/month for this
  content. The product gap is distribution (own app only), not willingness
  to pay.
- **Castopod** - open-source, self-hostable podcast host built natively on
  the Podcasting 2.0 namespace (live items, V4V splits, and private/unlisted
  podcasts via passphrase links are all first-class features, not bolted
  on). This is almost certainly the fastest path to a POC rather than
  building feed/RSS machinery from scratch.

## Architecture question: centralised vs. distributed

| | Centralised (one platform, many clubs) | Distributed (per club/league) |
|---|---|---|
| Who runs it | A single SaaS operator | Each club or league runs its own instance |
| Onboarding | Fast for a club (just add fixtures + a stream key) | Slower - each club needs hosting/ops |
| V4V split logic | Shared, consistent | Reimplemented per deployment |
| Fits existing club tech | Sits alongside, doesn't replace RamsTV-style infra | Could replace it entirely |
| POC fit | **Better for POC** - one deployment, one club, prove the mechanism | Worth revisiting once the mechanism's proven |

Recommendation: start centralised (even if "centralised" just means one
Castopod instance you run) - the point of a POC is proving fans can
subscribe and listen live in Truefans/Fountain, not solving multi-tenant
ops.

## Proposed POC scope

Narrow, single-club, single-fixture:

1. **Stand up Castopod** (self-hosted, e.g. on a small VPS or Docker
   container) - it already speaks `podcast:liveItem`, V4V, and has a
   private-podcast mechanism (passphrase-protected feed URL), so most of
   the plumbing is free.
2. **Create one placeholder episode** for a real or simulated fixture, with
   the right metadata (teams, kick-off time) - manually is fine for a POC;
   automating from a fixture data source (à la Football Cal) is a later
   step, not needed to prove the concept.
3. **Wire up a live audio source.** Simplest POC path: an Icecast/SRT
   stream (even a phone running commentary into a streaming app) mapped to
   the episode's enclosure, flipped to `status="live"` at kick-off via
   Castopod's live-item support.
4. **Set the feed to private/premium** using Castopod's passphrase feed
   mechanism, so the POC also proves the "paid subscribers only" angle, not
   just live audio.
5. **Add a `podcast:value` block** with a Lightning address (Alby wallet is
   the easiest way to receive test sats) and a token split between two
   fake "recipients" (stand-ins for club/commentator) - proves the V4V
   split mechanism works, not that real money moves yet.
6. **Test playback in both Truefans and Fountain**: subscribe via the
   private feed URL, confirm the episode shows as live during the stream,
   confirm it auto-flips to on-demand replay after `status="ended"`,
   confirm V4V streaming sats/boosts land.
7. **Write up what broke.** The likely friction points worth documenting:
   app-specific quirks in how `liveItem` transitions are polled/detected,
   whether premium-feed passphrase URLs behave consistently across apps,
   and Lightning wallet UX for a first-time listener.

## Open questions

- Does the live-to-VOD transition happen cleanly in practice, or do
  listener apps need a manual feed refresh/poll to notice the status
  change? Worth confirming early - it's the crux of the "own leisure or
  live" pitch.
- Real subscription billing (Stripe et al.) issuing/revoking per-subscriber
  feed tokens is a separate, well-understood problem - deliberately out of
  scope for the POC, worth scoping properly once the podcasting mechanism
  is proven.
- Commentary rights/licensing with the actual club is a business question,
  not a technical one - irrelevant to whether the POC works technically,
  but the actual blocker to shipping this for real.
- Video (HLS) and comments are explicitly "later" - don't let them creep
  into POC scope.

## Effort estimate

Small. Castopod absorbs most of the podcasting-2.0-specific complexity
(feed generation, live-item XML, V4V tags, private feed links), so the POC
is mostly deployment + wiring a live audio source + testing app behaviour,
not building podcast infrastructure from scratch. A weekend-scale
experiment, not a project.
