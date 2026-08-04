# Eleventy 1.x → 3.x upgrade plan

Status: **not started**. This document is a pre-work assessment only — nothing
in this repo has been changed to prepare for the upgrade. It exists so the
upgrade can be picked up as a self-contained piece of work in a separate
session.

## Why this isn't urgent

The local-build slowness that prompted this investigation (`/tags/*` pages
pushing content-only rebuilds past 2 minutes) was fixed separately without
touching the Eleventy version — see the `tagList` collection gating in
`.eleventy.js` and `tags.njk`. This upgrade is a distinct piece of work with
its own risk profile; don't bundle it with build-speed fixes.

That said, Si has confirmed (2026-08-04) this is worth doing anyway for
general maintenance and performance, not only for the incremental-build
angle — it doesn't need to wait on a build-speed justification. See
[`habit-runtime-render-idea.md`](./habit-runtime-render-idea.md) for a
related but independent idea (client-side rendering for `/habits/`) that
targets the same underlying pain from a different angle; do this upgrade
first and re-assess that idea afterwards rather than doing both at once.

## Current state (verified)

- Installed: `@11ty/eleventy@^1.0.0` (package-lock resolves `1.0.2`), engines
  requirement `node >= 12`.
- Repo pins `engines.node: "18.x"` and `.nvmrc` = `18` — already satisfies
  every version up to and including the latest 3.x release.
- Latest stable release on npm: `3.1.6` (checked via `npm view
  @11ty/eleventy versions`). `4.0.0` exists only as alpha builds
  (`4.0.0-alpha.1` … `4.0.0-alpha.10`) — **do not target 4.x**, it isn't
  stable yet.

## Target

Upgrade to **`@11ty/eleventy@3.1.6`** (or whatever the latest `3.x` patch is
at the time this work starts — re-check `npm view @11ty/eleventy versions`
first, a lot may have shipped since this was written).

## Recommended path: 1.x → 2.x → 3.x, not a direct jump

This repo has a lot of custom configuration (`.eleventy.js` is ~350 lines,
plus 10 files under `_11ty/` implementing custom transforms and a vendored
plugin under `third_party/`). Stepping through each major version's own
migration guide and re-testing at each stop will make it much easier to
isolate which change caused which regression, versus debugging a 1→3 jump in
one go. Treat `2.x` as a checkpoint to get a green build and passing tests
before continuing to `3.x`, not as a version to ship.

## Breaking changes that matter for this repo

### 1. Browser Sync → `@11ty/eleventy-dev-server` (lands in 2.0, not 3.0)

This is the change most likely to bite. Verified by diffing the `dependencies`
block of each package version on npm:

- `@11ty/eleventy@1.0.2` depends on `browser-sync@^2.27.10`.
- `@11ty/eleventy@2.0.0` has **no** `browser-sync` dependency at all — it's
  fully replaced by `@11ty/eleventy-dev-server@^1.0.3`.
- `@11ty/eleventy@3.1.6` uses `@11ty/eleventy-dev-server@^2.0.8`.

So the swap happens the moment you move off `1.x`, not when you get to `3.x`.
Two places in this repo talk to Browser Sync directly and will silently stop
working (no crash — the config calls just become no-ops or throw depending on
version) unless rewritten against the new dev server's config surface:

- **`.eleventy.js`** — `eleventyConfig.setBrowserSyncConfig({...})` (around
  line 297) adds middleware to serve `_site/404.html` without a redirect.
  This needs to become whatever the current `eleventyConfig.setServerOptions()`
  (or equivalent) API is for `@11ty/eleventy-dev-server` at the time of
  upgrade — check the current Eleventy docs for the dev server config page
  rather than trusting any specific method name written here, since the dev
  server's config surface has changed across `1.0.3 → 2.0.8`.
- **`_11ty/apply-csp.js`** — does `require("browser-sync/package.json")` to
  read Browser Sync's version and build a CSP hash for its injected
  live-reload `<script>` tag (`AUTO_RELOAD_SCRIPTS`, lines ~34-42). Once
  Browser Sync is gone, `browser-sync/package.json` won't resolve (it'll only
  exist if something else in `node_modules` happens to depend on it) and this
  will throw at config-load time. The fix is to find what inline script (if
  any) the new dev server injects for live reload, and generate the CSP hash
  allowlist entry for *that* script instead. If the new dev server doesn't
  inject an inline script the same way, this whole allowlist entry may become
  unnecessary — verify empirically by running `npm run serve` and inspecting
  the CSP violations in the browser console.

Symptom if this is missed: local `npm run serve` either fails outright at
startup, or CSP violations appear in the browser console for the dev-only
live-reload script (this would not affect production, since
`isDevelopmentMode()` gates it — but it makes local dev noisy/broken).

### 2. Official plugin major-version bumps

Checked via `npm view <pkg> version` (latest) against what's currently pinned
in `package.json`:

| Plugin | Pinned | Latest | Jump |
|---|---|---|---|
| `@11ty/eleventy-plugin-rss` | `^1.0.7` | `3.0.0` | 2 majors |
| `@11ty/eleventy-plugin-syntaxhighlight` | `^3.0.1` | `5.0.2` | 2 majors |
| `@11ty/eleventy-navigation` | `^0.1.3` | `1.0.5` | 1 major (0.x→1.x) |

None of the three declare a `peerDependencies` entry pinning a specific
Eleventy version (checked via `npm view <pkg> peerDependencies` — all empty),
which is a good sign they're loosely coupled via the plugin API rather than
version-locked. Still, each is a multi-major jump with its own changelog to
read — don't assume `addPlugin(pluginRss)` etc. keep working unchanged.
Budget time to re-check each plugin's own breaking-change notes and smoke-test
the feed/syntax-highlighting/nav output after bumping.

### 3. Vendored plugin: `third_party/eleventy-plugin-local-images`

Not on npm — it's committed source, so it won't auto-update, but it also
won't get any upstream fixes. It uses `node-fetch@^2.6.7` (CJS-style,
pre-native-fetch) and `JSDOM` directly via `eleventyConfig.addTransform`,
neither of which is coupled to the Eleventy version. Should keep working
as-is through the upgrade, but:

- Give it an explicit smoke test after upgrading (a page with a known remote
  `<img>` should still get downloaded/rewritten into `/img/remote/`).
- Optional (unrelated to the upgrade, don't block on it): Node 18+ has a
  native `fetch`, so `node-fetch` could eventually be dropped from this
  plugin — flagged for later, not part of this upgrade.

### 4. `markdown-it` version — not actually a concern

`.eleventy.js` calls `eleventyConfig.setLibrary("md", markdownLibrary)`
(line 310) with its own `markdown-it` instance, built from the project's own
`markdown-it@^12.3.2` devDependency — not whatever version Eleventy core
bundles internally. So Eleventy 2.x/3.x bumping their internal `markdown-it`
(13.x, then 14.x) has **no effect** on this repo's markdown rendering. No
action needed here; noted only so it isn't mistaken for a risk during the
upgrade.

### 5. Custom transform chain — needs full regression testing regardless of cause

Not a specific "breaking change" documented anywhere, but worth calling out:
this repo runs **7 custom transforms** on every HTML page
(`_11ty/apply-csp.js`, `_11ty/img-dim.js`, `_11ty/json-ld.js`,
`_11ty/optimize-html.js` (which itself registers 3: `purifyCss`,
`minifyHtml`, `optimizeAmp`), `_11ty/youtube-html-transform.js`, and the
vendored `localimages` transform), several of which independently parse the
page with `JSDOM`. None of this is Eleventy-version-specific code, but the
transform pipeline execution order and the `outputPath` argument each
transform receives are both things that could theoretically shift across
major versions. After upgrading, diff a representative sample of output HTML
(a normal post, an AMP post if any exist, the home page, one tag page) byte-
for-byte against the pre-upgrade `_site` output, not just "does it build
without errors."

## Suggested phased plan

1. **Branch + baseline.** New branch off `main`. Run `npm run build` on the
   current `1.0.2` setup and keep the resulting `_site/` (or a hash of it)
   as the comparison baseline before touching anything.
2. **Step to `2.x`.**
   - `npm install @11ty/eleventy@^2.0.0`.
   - Rewrite the Browser Sync → dev-server bits in `.eleventy.js` and
     `_11ty/apply-csp.js` (see breaking change #1).
   - Run `npm run build-ci` (build + existing `test/` suite) and fix whatever
     breaks.
   - Run `npm run serve` locally and manually check: live reload works, no
     CSP console errors, the custom 404 page still serves without a redirect.
   - Commit this as a checkpoint before continuing.
3. **Step to `3.x`.**
   - `npm install @11ty/eleventy@^3.1.6`.
   - Re-run the same build + serve checks. Expect this hop to be smaller than
     step 2 since the dev-server migration is already done.
4. **Bump the three official plugins** (`eleventy-plugin-rss`,
   `eleventy-plugin-syntaxhighlight`, `eleventy-navigation`) to their latest
   majors, one at a time, re-running `npm run build-ci` after each so a
   regression is easy to attribute to a single package.
5. **Full regression pass:**
   - `npm run build-ci` green (build + `test/test*.js`).
   - Byte-diff a sample of output pages against the step-1 baseline; manually
     review any diffs (expected: minor whitespace/attribute-ordering changes
     from `html-minifier`/`purgecss` versions if those get bumped
     transitively; unexpected: missing CSP hashes, broken image URLs, broken
     RSS/JSON feed output, broken syntax highlighting).
   - Manually load the site locally: home page, a blog post, a tag page (with
     `ELEVENTY_BUILD_TAGS=true` since tag pages are skipped locally by
     default — see the build-speed fix), the `/feed/` outputs, and check
     browser console for CSP violations.
   - Confirm the `pre-push` hook (`npm run build`) still completes
     successfully — it's what runs on every local `git push`.
6. **Deploy to a preview** (Netlify branch deploy, or equivalent) before
   merging to `main`, since CI (`CI=true`) is where the full `/tags/*` set
   and all 906+ copied assets get exercised for the first time in this
   process.

## Rollback

Each step above is a separate commit, so rolling back is `git revert` to the
last-known-good commit (or dropping the branch entirely pre-merge). Nothing
in this plan touches production data or requires irreversible steps —
Eleventy version bumps are `package.json`/`package-lock.json` changes plus
config edits, fully reversible with git.

## Effort estimate

Medium-large — mostly concentrated in the dev-server rewrite (step 2) and the
regression-testing discipline in step 5, not in the version bumps themselves.
Rough order of magnitude: a focused day for steps 1-4, plus however long the
manual regression pass in step 5 takes to feel confident about (this is the
part most likely to reveal something this document didn't anticipate).
