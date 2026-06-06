---
title: "Podnality"
date: 2026-06-06
categories: 
  - "portfolio"
tags: 
  - "podcasts"
  - "agentic-coding"
  - "ai"
  - "side-project"
coverImage: "podnality-homepage.png"
---

One of the things that frustrates me about podcasts is discoverability. The big platforms have their own algorithms and editorial picks, but they don't know you — they know what's popular. Your taste is yours, built up over time through your own subscriptions, and there's no real way to share that signal with people who might actually care about it.

That frustration turned into [Podnality](https://podroll.unstyled.com/) — a little prototype that lets you upload your podcast subscriptions file (OPML format, which most podcast apps can export) and in return get a shareable link that surfaces the patterns in what you listen to.

![Podnality homepage — upload your OPML file to get started](/img/assets/2026/podnality-homepage.png)

## The idea

The core premise is simple: fight the algorithm with your own data. Rather than letting a platform guess what you might like based on trending shows, Podnality analyses your actual subscription list to find meaningful patterns — genres, themes, listening habits — and wraps it up into a profile you can share.

We also integrated an LLM to take that analysis a step further. Beyond just categorising your shows, it gives you a personality read based on what you listen to. It's a bit of fun, but it's surprisingly accurate — the kinds of shows you subscribe to do say something about how you think.

The shareable link is the key bit. Send it to a friend, post it somewhere, and let people discover new shows through someone else's taste rather than an editorial algorithm.

![Podnality profile page showing podcast categories, personality summary and show list](/img/assets/2026/podnality-example.png)

## Building it with agentic coding

This was as much an experiment in how I build things as it was in the idea itself. The whole thing was put together using agentic coding — leaning heavily on AI-assisted development — deployed on [Railway](https://railway.com/) for hosting.

What I enjoyed most about this project was being able to dip in and out of the build through the native iOS app. Commuting, waiting around, half an hour here and there — agentic coding made it possible to keep momentum going without needing to be sat at a desk with a proper setup. That kind of flexibility is genuinely new and I found it changed how I think about what's worth starting on a whim.

It's the sort of project that would previously have stayed as a note in a list somewhere. Too small to justify setting up a proper dev environment for, too niche to feel worth the effort. Agentic coding collapsed that overhead enough that it actually got built.

## What's there

- Upload your OPML file from any podcast app
- Get a breakdown of your listening patterns and categories
- An LLM-generated personality summary based on your shows
- A shareable link you can send to anyone

Give it a try at [podroll.unstyled.com](https://podroll.unstyled.com/) — export your subscriptions from your podcast app of choice and see what comes back.
