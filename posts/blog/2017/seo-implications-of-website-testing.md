---
title: "SEO Implications of Split Testing"
date: 2017-02-20
categories: 
  - "blog"
tags: 
  - "cro"
  - "google"
  - "seo"
  - "split-test"
  - "ux"
---

Following a discussion around A/B testing the simplification of a UI by hiding or removing some links, it got us thinking about the implications of SEO when running website tests.

What is the best practice for not affecting your search engine ranking with a short-term test which, in theory, could completely change your page and navigation structure?

It led me to Google Webmaster's [Website Testing and Google Search](https://webmasters.googleblog.com/2012/08/website-testing-google-search.html) from 2012.

In a nut-shell, Google suggest you don't exclude the Googlebot user-agent header from your test (known as cloaking). In theory, a short-term change to your webpage shouldn't affect your ranking too much. If the content continues to look different after a few indexes, then your ranking may change but you should only run the test for as long as necessary.

Where possible (and only really suitable for redirection tests), set canonical link attributes on your alternative pages or use 302 (temporary) redirects rather than 301 (permanent) redirects.

Unfortunately, depending on known traffic and specific scenarios, some tests need to run for many months so this doesn't bode well for anyone who doesn't want to upset any SEO juice gained over time. However, we also know Google likes to reward sites based on improved user habits so, in hindsight, any UX improvements should in fact improve your SEO ranking.

This is not a new problem; even Google's expert Matt Cutts was championing the idea of A/B testing back in 2012, back-referencing a blog post from 2009…

<blockquote class="twitter-tweet" data-lang="en-gb"><p dir="ltr" lang="en">A/B testing can be really helpful. A classic blog post from 2009: <a href="http://t.co/da89eEiR">http://t.co/da89eEiR</a> Lesson: buttons get clicked more.</p>— Matt Cutts (@mattcutts) <a href="https://twitter.com/mattcutts/status/191658511149711360">15 April 2012</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

By the by, it's something you should definitely consider when you start stripping out content for a leaner user experience in any website testing, be it A/B or MVT.
