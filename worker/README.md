# habits-api

Cloudflare Worker backing `/habits/*`: reads habit entries from a Google
Sheet per habit and serves them to the static site's client-side habit app
(`../src/habits-app.js`), and accepts webhook-ingested entries (from the iOS
Shortcut, or the habit-log Claude skills) without ever touching git or
triggering an Eleventy rebuild. See `../docs/habit-runtime-render-idea.md`
and the habits-refactor plan for the full design rationale.

## One-time setup

1. **Create a Google Cloud service account** (Google Cloud Console -> IAM &
   Admin -> Service Accounts -> Create). No specific API/role needs granting
   at the project level - access is per-Sheet (step 3). Create a JSON key
   for it and keep the file safe; you need two values out of it:
   `client_email` and `private_key`.
2. **Enable the Google Sheets API** on that Cloud project (APIs & Services ->
   Library -> Google Sheets API -> Enable).
3. **Create one Google Sheet per habit** (duolingo, solitaire, sudoku, and
   later maptap/etc). Each sheet's first tab needs a header row matching
   that habit's entry fields - e.g. solitaire: `date,drawMode,score,
   durationSeconds,moves`. Share each sheet with the service account's
   `client_email` as **Editor**.
4. **Copy each Sheet's ID** (the long id in its URL,
   `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`) into the
   matching `_data/habits/<slug>.json`'s `sheetId` field, replacing the
   `REPLACE_WITH_..._SHEET_ID` placeholder.
5. **Set Worker secrets** (from `worker/`):
   ```
   npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
   npx wrangler secret put GOOGLE_PRIVATE_KEY   # paste the PEM, keep \n's
   npx wrangler secret put WEBHOOK_SECRET       # any long random string -
                                                 # this is what the iOS
                                                 # Shortcut and the habit-log
                                                 # skills send as
                                                 # X-Habit-Webhook-Secret
   ```
6. **Decide routing** - see the two commented-out options in
   `wrangler.toml`. Option A (a Workers Route on the live domain's `/api/*`
   path) needs Cloudflare to actually be the DNS/proxy in front of the
   domain; confirm this given hosting is currently split between Netlify and
   Cloudflare Pages. If it isn't, use Option B (the Worker's own subdomain)
   and add a `connect-src` entry for it to `../_data/csp.js`.
7. **Deploy**: `npx wrangler deploy` (from `worker/`).

## Local development

`npx wrangler dev` runs the Worker locally. It still talks to the real
Google Sheets API (there's no local Sheets emulator), so local secrets need
to be set too - `wrangler dev` reads the same secrets store unless you pass
`--var` overrides or a `.dev.vars` file (gitignored) for a separate
test-only service account/sheet.

## Testing the ingest endpoint

```
curl -X POST https://<worker-host>/habits/solitaire/entries \
  -H "X-Habit-Webhook-Secret: <the WEBHOOK_SECRET value>" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-08-24","drawMode":"Draw 3","score":4200,"durationSeconds":198,"moves":102}'
```

Then `GET /habits/solitaire` should show the new entry (immediately - the
POST invalidates that habit's read cache).

## Adding a new habit

1. New Google Sheet, shared with the service account, header row matching
   the habit's fields.
2. New `_data/habits/<slug>.json` schema-config (copy an existing one),
   with the new Sheet's ID.
3. Add one import + array entry to `src/habitConfigs.js`.
4. Redeploy (`npx wrangler deploy`) - this is the only case that needs a
   Worker redeploy; new *entries* for existing habits never do.
