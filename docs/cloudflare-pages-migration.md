# Netlify → Cloudflare Pages migration

Status: **repo-side prep done, dashboard cutover not started**. This
session got the repo into a state Cloudflare Pages can build cleanly and
wrote up the remaining steps, but the actual dashboard connection, DNS
cutover, and Netlify decommissioning are manual account-level actions that
need doing from the Cloudflare/DNS dashboards directly - not something an
agent session without those credentials can do.

## What's already in place

- **`wrangler.toml`** was already committed (`name = "sijobling"`,
  `pages_build_output_dir = "_site"`) from an earlier, separate piece of
  work - not touched further here, it already matches what Pages needs.
- **`_headers`** uses only plain glob paths and standard header
  directives (`cache-control`, `X-Frame-Options`, `Content-Type` override
  for `/blog/feed`) - no Netlify-specific extensions, works unmodified on
  Cloudflare Pages.
- **`_redirects`** had two Netlify-specific dependencies, fixed in this
  session:
  - One entry (`/airbnb`) had no explicit status code, relying on
    Netlify's default of 301. **Cloudflare Pages defaults to 302
    instead** - added the explicit `301` so it matches every other entry
    and behaves the same on both platforms.
  - One entry (`/index`) used Netlify's `!` force-redirect suffix, which
    Cloudflare Pages doesn't support (treats it as leftover Netlify
    syntax). Confirmed there's no actual static file at `/index` for it
    to have been overriding (the homepage's permalink is `/`, not
    `/index`), so removing the suffix changes nothing behaviorally on
    either host.
  - Every other entry already had an explicit status code and no
    force-redirect suffix, so no further changes were needed. (Checked:
    157 of 159 real redirect lines already had explicit `301`.)
- **Node version**: `.nvmrc` (`18`) is already present. Cloudflare Pages'
  build image checks `.nvmrc`/`.node-version` first, before falling back
  to a `NODE_VERSION` dashboard env var, then its own default - so this
  should be picked up with no dashboard configuration needed. Worth
  confirming on the first real Pages build regardless, since this
  wasn't verified against a live Pages build in this session (no
  Cloudflare credentials available here - see below).

## Dashboard build settings (manual step)

When connecting the repo in the Cloudflare Pages dashboard, use:

- **Build command**: `npm run build-ci` (matches what GitHub Actions CI
  already runs - `js-build && eleventy && test`. Not `npm run build`,
  since that command's extra `clean` step (`rm -Rf _site/posts/*`) is
  redundant on Pages' fresh-checkout builds and only exists for local
  dev where `_site` may already have stale content.)
- **Build output directory**: `_site`
- **Root directory**: repo root (default)
- If `.nvmrc` isn't picked up automatically, set `NODE_VERSION=18` as a
  dashboard environment variable as a fallback.

## Remaining manual steps (in order)

1. In the Cloudflare dashboard, connect this GitHub repo as a new Pages
   project, using the build settings above.
2. Verify the resulting `*.pages.dev` preview build: check it actually
   built (watch for the same kind of fatal errors this session hit and
   fixed during the Eleventy upgrade - a clean build here isn't
   guaranteed just because it works locally, since Pages builds start
   from a fully fresh checkout with no caches at all, see the note on
   the local-images plugin below), then spot-check a handful of pages,
   the RSS/Atom/JSON/podcast feeds, and a few `_redirects` entries
   against the preview URL.
3. Add `sijobling.com` (and `www` if used) as a custom domain on the
   Pages project once the preview looks right.
4. Update DNS (wherever the domain is currently managed) to point at
   Cloudflare Pages instead of Netlify. This is the actual cutover -
   do it once step 2's preview is trusted, not before.
5. After DNS has propagated and the live site is confirmed serving from
   Cloudflare, remove the Netlify wiring: `netlify.toml`, the
   `netlify-plugin-cache` devDependency, and the Netlify badge/section in
   `README.md`. Also decommission the Netlify site itself in its
   dashboard once nothing points at it any more.

Steps 1 and 3-5 all need Cloudflare/DNS dashboard access this session
doesn't have - flagging them rather than guessing at completion.

## A pre-existing issue this session ran into (unrelated to the migration, but relevant to it)

While testing full from-scratch builds in this session (no prior
`node_modules` or `_site`, matching what a fresh Cloudflare Pages build
looks like), `third_party/eleventy-plugin-local-images` threw repeated
`TypeError: fileType is not a function` / `Cannot read properties of null
(reading 'buffer')` errors while trying to cache external image URLs.
Root cause: `file-type@16.5.4`'s module export changed to an object of
named functions (`fileType.fromBuffer(...)`) rather than a directly
callable function, but the vendored plugin still calls `fileType(buffer)`
directly. The build **still completes successfully** (Eleventy catches
transform errors per-page and continues), so this didn't block anything
in this session - but it likely also doesn't block a Cloudflare Pages
build for the same reason.

This wasn't introduced by the Eleventy upgrade or by anything in this
session - it's latent in the plugin code and normally invisible because
GitHub Actions CI restores a `_site/**/*.blurred` etc. image cache via
`actions/cache` before running, so `fs.existsSync(outputFilePath)` in the
plugin usually finds the file already there and skips re-downloading.
Cloudflare Pages builds (like this session's from-scratch builds) don't
have that persisted cache by default, so this will likely surface there
too. It doesn't fail the build, but it does mean some external images may
not get correctly proxied/cached into `/img/remote/` on a Cloudflare
Pages build the way they do on Netlify's cache-warmed CI. Flagging this
as a separate, pre-existing bug worth a dedicated fix - out of scope for
this migration work, and not something to fix as a drive-by here.

## Rollback

Nothing here is destructive - `_redirects`' two fixed entries behave
identically on Netlify (both changes are either explicit-and-equivalent
or a removal of a no-op flag), and Netlify itself hasn't been touched at
all. The dashboard/DNS steps above are the only ones with real
one-way-door risk (DNS propagation, decommissioning Netlify), which is
exactly why they're listed as manual steps for Si to run once he's
checked the Cloudflare preview himself, not automated here.
