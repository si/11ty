# Idea: client-side runtime render for /habits/

Status: **not started, idea only - but now confirmed necessary, not just an
alternative**. The Eleventy 3.x upgrade in
[`eleventy-3-upgrade-plan.md`](./eleventy-3-upgrade-plan.md) is done as of
this note. Its own "re-evaluate before starting this" checkpoint has been
answered: measured directly (append one entry to
`_data/habits/duolingo.json`, run `eleventy --watch --incremental`), 3.x's
incremental build still rewrites the full 574-page site, not a scoped
subset - global JSON data-file changes aren't tracked at the granularity
incremental builds need. So this doc's approach (or some other way of
decoupling habit-page output from a full site rebuild) is still the open
problem; the Eleventy upgrade fixed a lot of other things but not this one.
Still not implemented - this was out of scope for the session that did the
upgrade and ran that measurement (upgrade-and-verify was the explicitly
approved scope; this rewrite is real, separate work to pick up next).

## The pain this would address

Every `/habits/*` page is fully rendered at build time: Nunjucks pulls
`_data/habits/<slug>.json` through `_11ty/habits-data.js` (`loadHabits`,
`buildTimeline`, stat aggregation) and bakes stat tiles, an inline SVG trend
chart (`_11ty/habits.js`'s `habitTrendChart`), and monthly/daily tables
straight into HTML. Appending one day's Duolingo sessions to
`_data/habits/duolingo.json` and rebuilding forces the *entire* site through
Eleventy's full page-write path - confirmed at 562 pages / ~153s locally for
this repo's current state (2026-08-03), because every one of those pages
(not just the habit pages) runs the same expensive per-page transform chain:
JSDOM parse ×4 (`apply-csp.js`, `img-dim.js`, `json-ld.js`, the vendored
`localimages` transform) plus PurgeCSS and `html-minifier` (both in
`_11ty/optimize-html.js`). None of that is specific to habit data changing -
it's just what a full `eleventy` run does.

Two independent levers exist for this:

1. **Eleventy 1.x → 3.x upgrade** (`eleventy-3-upgrade-plan.md`) - 3.x has a
   real incremental-build dependency graph that 1.x lacks, so a data-only
   change could in principle rebuild far fewer pages. Si has confirmed this
   is worth doing regardless of the incremental-build angle, for general
   maintenance and performance - it shouldn't need this doc's idea to
   justify starting it, and the two pieces of work should stay sequenced
   separately (upgrade first is probably easier to reason about, since it
   changes the tool underneath everything else).
2. **This idea** - stop baking habit data into HTML at all. Ship a static
   page shell once, fetch pre-computed JSON at page load, and render
   client-side. This works whether or not the Eleventy upgrade happens, and
   is the only one of the two that also opens the door to interactivity
   (filtering, live search across habits) that static HTML can't do cheaply.

They're not mutually exclusive - the upgrade makes *every* page's rebuild
faster; this idea makes *habit* pages stop needing an HTML rebuild for a data
change at all. Worth deciding whether to do one, the other, or both, but do
the upgrade first and re-assess whether this is still worth the complexity
once it's done.

## Verified facts relevant to feasibility

- **CSP is low-risk for this idea.** `_data/csp.js` sets `default-src 'self'`
  and `script-src 'self' <hashes>`. `default-src 'self'` covers `fetch()` to
  same-origin URLs with no explicit `connect-src` needed. `script-src 'self'`
  already permits loading an external same-origin `<script src="...">` with
  no hash - hashes (`csp-hash` attribute, generated in `_11ty/apply-csp.js`)
  are only required for *inline* `<script>` tags. So a runtime-render script
  loaded as a normal file needs **no CSP change**. This is a meaningfully
  smaller risk than the Browser Sync CSP hash rewrite the Eleventy upgrade
  plan has to deal with.
- **The expensive transforms already gate on `.html`.** `purifyCss`,
  `minifyHtml`, and `optimizeAmp` in `_11ty/optimize-html.js` all check
  `outputPath.endsWith(".html")` before running; `apply-csp.js`'s CSP-hash
  transform does the same. Any output that isn't an `.html` file (e.g. a
  `.json` file) already skips all four - no new gating logic needed.
- **There's an existing precedent for Eleventy emitting JSON as a build
  artifact**: `feed/json.njk` has front matter setting
  `permalink: "{{ metadata.jsonfeed.path | url }}"` and a JSON body, producing
  `_site/feed/feed.json`. The same technique (a `.njk` template with a JSON
  body and a computed `permalink`) is the natural way to emit a per-habit
  data file - no new Eleventy feature needed, just more templates like this
  one.
- **`_data/habits/*.json` isn't currently copied to `_site` at all** - it's
  read via `_11ty/habits-data.js`'s `loadHabits()` (`fs.readFileSync` +
  `JSON.parse` on every call - not memoized, called once each from the
  `getHabit` filter, `_data/habitsIndex.js`, and `_data/duolingoMonths.js`)
  purely as Eleventy global/computed data, never passed through
  `addPassthroughCopy`. So there's no existing URL a client fetch could hit
  yet - one has to be created (see design below), and it should carry the
  *aggregated* shape (`loadHabits()`'s output, with `stats`/`sessionCount`/
  etc.), not the raw entries array, or the client script ends up
  re-implementing `computeExtraStats`/`pickBest`/`average`/`formatMetricValue`
  in a second language.
- **`habitTrendChart` in `_11ty/habits.js` is already framework-free** - pure
  math plus string templating, no Node-only APIs (just `Math`, template
  strings, and its own `escapeXml`). It's a plausible, fairly mechanical port
  to browser JS rather than a rewrite from scratch.

## Design sketch

Keep `_11ty/habits-data.js` as the single source of truth for aggregation -
don't duplicate `loadHabits`/`buildTimeline`/stat math in client JS. Instead:

1. **Emit computed JSON at build time**, one new template per shape needed,
   following the `feed/json.njk` pattern:
   - `src/pages/habits/index.data.11ty.js` (or `.njk`) → `/habits/data.json`,
     dumping `habitsIndex` (`list` + `timeline`).
   - A per-habit JSON output - either one `.11ty.js` template with
     `eleventyComputed.permalink` paginating over `loadHabits()` (mirroring
     how `duolingo/duolingo.11tydata.js` already computes a permalink per
     month), producing `/habits/<slug>/data.json` for every habit
     automatically as new `_data/habits/*.json` files are added.
   - These are tiny, cheap outputs - no JSDOM, no PurgeCSS, no minify (per
     the `.html`-gated transforms above) - so regenerating them is fast even
     without any Eleventy incremental-build support.
2. **Turn each habit page into a static shell**: keep the static prose
   (description, source, the Duolingo QR code, the "only some rows have a
   level" caveat, etc. - all content that doesn't change per-entry) and
   replace the stat tiles / chart / tables with a mount point, e.g.
   `<div id="habit-app" data-habit-url="/habits/duolingo/data.json"></div>`.
3. **One small client script** (bundled through the existing Rollup pipeline
   - `rollup.config.js` / `src/main.js` already produces `js/min.js`; this
     could be a second entry or folded into the existing bundle) that, on
     load: fetches the habit's `data.json`, and renders the stat tiles, a
     ported version of `habitTrendChart` (SVG string → `innerHTML`, or built
     via DOM calls), and the monthly/daily tables into the mount point.
4. **`/habits/` index** could similarly fetch `/habits/data.json` and render
   the habit-card grid + recent-activity timeline client-side, if it's worth
   doing there too - lower priority than the individual habit pages, since
   it changes less often per-entry (it's cross-habit).

## Open decisions for whoever picks this up

- **Progressive enhancement vs. full replace.** Recommend keeping a minimal
  static fallback in the shell (at least the monthly totals table, since
  that's cheap to keep server-rendered and gives no-JS users and crawlers
  something) and letting the client script *replace* or *augment* it, rather
  than shipping an empty `<div>` that only works with JS. Decide how far this
  goes - full replace is simpler to build and reason about, progressive
  enhancement is kinder to no-JS/SEO but doubles the rendering logic in two
  places (Nunjucks fallback + JS) unless the fallback is deliberately kept
  minimal (just the table, not the chart).
- **Loss of SEO text.** Habit pages are personal tracking pages, not
  content marketing - low stakes either way, but worth a conscious decision
  rather than an accident.
- **Bundle shape**: one shared `habit-app.js` for all habit pages (simpler,
  slightly more JS shipped per page) vs. per-habit bundles (more build
  complexity for a marginal size win). Start with one shared bundle.
- **Whether this is worth doing at all once the Eleventy 3.x upgrade lands.**
  If 3.x's incremental builds make a data-only change cheap enough on their
  own, the interactivity angle (filtering, live search) may be the only
  remaining justification for this - re-evaluate before starting, don't
  assume both are needed.

## Suggested phased approach

1. Prototype narrowly on `/habits/duolingo/` only (highest entry-frequency
   habit, so it's the best test of whether this actually removes rebuild
   pain) before touching `/habits/sudoku/` or the `/habits/` index.
2. Add the `/habits/duolingo/data.json` output template; verify its output
   byte-for-byte matches what `getHabit("duolingo")` currently produces for
   the equivalent fields.
3. Port `habitTrendChart` to a small, dependency-free browser module; unit
   test it against a few fixture habits (reuse `test/` conventions already
   in this repo) rather than only eyeballing it in a browser.
4. Build the shell + mount script for `/habits/duolingo/`, decide the
   progressive-enhancement question above, and manually verify: page loads
   with JS disabled (fallback content, if any, is sane), CSP has zero
   console violations, and Lighthouse/CLS doesn't regress badly from content
   popping in after fetch.
5. Only then decide whether to extend to `/habits/sudoku/` and the
   `/habits/` index, or stop at the one-habit prototype if the trade-offs
   don't feel worth it.

## Effort estimate

Small-to-medium. The JSON-emission templates are a few lines each (precedent
already exists in `feed/json.njk`); most of the effort is the
`habitTrendChart` port and getting the progressive-enhancement fallback
right without regressing CLS/perceived load. Meaningfully smaller than the
Eleventy 3.x upgrade, but do that first and revisit whether this is still
wanted.
