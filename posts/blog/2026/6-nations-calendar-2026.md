---
title: "6 Nations Calendar 2026 refresh"
date: 2026-01-09
categories:
  - "blog"
tags:
  - "6-nations"
  - "calendar"
  - "github"
  - "ui"
---

I’ve updated my [6 Nations Calendar](https://6nationscalendar.com/) for 2026, and the biggest change this year is where it lives. I’ve moved hosting from Netlify to GitHub so the CI pipeline is closer to the codebase, easier to test locally, and simpler to maintain. Nothing wrong with Netlify at all, it’s just another service to keep tabs on and I want to keep the moving parts small.

As part of the migration, I’ve been leaning on tools like [Google Jules](https://jules.google/) to prepare content, optimise the framework implementation, and refine parts of the UI. I’ve not pushed it too hard, but the recommendations have been genuinely useful for spotting code smells and bad practices early.

On the visual side, I’ve made a few refinements too:

- A new heading typeface from [Google Fonts](https://fonts.google.com/) to add a bit more personality
- A different background gradient to give the site a fresher feel
- Club logos on the homepage for a stronger sense of identity
- A slightly bolder footer message celebrating that it’s made in the home town of rugby football

I’ll keep tweaking things as I notice them through personal use and any feedback that comes in. I also want to keep a better record of changes going forward, possibly by using GitHub commit automation to help.
