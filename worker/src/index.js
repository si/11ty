/**
 * habits-api: read + ingest API backing /habits/* on sijobling.com.
 *
 * Routes:
 *   GET  /habits                  - index: per-habit meta + latest + count
 *   GET  /habits/:slug             - one habit's full entries + computed stats
 *   GET  /habits/:slug/:date       - one habit's entries for a single date
 *   POST /habits/:slug/entries     - webhook ingest (shared-secret auth)
 *
 * Entries live in a Google Sheet per habit (see sheets.js) - this Worker
 * never touches git. Reads are cached briefly (Cache API) since the Sheets
 * API is comparatively slow/rate-limited; a successful POST invalidates the
 * cache for that habit so the new entry shows up immediately.
 *
 * See worker/README.md for deployment/setup (service account, secrets,
 * routing).
 */

import { HABIT_CONFIGS, getHabitConfig } from "./habitConfigs.js";
import { readSheetEntries, appendSheetEntry } from "./sheets.js";
import { computeHabitStats, buildTimeline } from "../../_11ty/habits-shared.js";

function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function notFound(message = "Not found") {
  return jsonResponse({ error: message }, { status: 404 });
}

function cacheKeyFor(sheetId) {
  return new Request(`https://habits-api.internal/cache/sheet/${sheetId}`);
}

async function getCachedEntries(env, ctx, sheetId) {
  const cache = caches.default;
  const key = cacheKeyFor(sheetId);
  const cached = await cache.match(key);
  if (cached) return cached.json();

  const entries = await readSheetEntries(env, sheetId);
  const ttl = Number(env.CACHE_TTL_SECONDS) || 60;
  const response = jsonResponse(entries, {
    headers: { "Cache-Control": `max-age=${ttl}` },
  });
  ctx.waitUntil(cache.put(key, response.clone()));
  return entries;
}

async function invalidateCache(sheetId) {
  await caches.default.delete(cacheKeyFor(sheetId));
}

async function handleIndex(env, ctx) {
  const habits = await Promise.all(
    HABIT_CONFIGS.map(async (config) => {
      const entries = await getCachedEntries(env, ctx, config.sheetId);
      const { sessionCount, latest } = computeHabitStats(config, entries);
      return {
        id: config.id,
        name: config.name,
        icon: config.icon,
        url: `/habits/${config.id}/`,
        primaryMetric: config.primaryMetric,
        secondaryMetric: config.secondaryMetric,
        sessionCount,
        latest,
        entries,
      };
    })
  );

  const list = habits.map(({ entries, ...meta }) => meta);
  const timeline = buildTimeline(habits, 20);
  return jsonResponse({ list, timeline });
}

async function handleHabit(env, ctx, slug) {
  const config = getHabitConfig(slug);
  if (!config) return notFound(`Unknown habit "${slug}"`);

  const rawEntries = await getCachedEntries(env, ctx, config.sheetId);
  const { entries, sessionCount, latest, stats } = computeHabitStats(config, rawEntries);
  return jsonResponse({ config, entries, sessionCount, latest, stats });
}

async function handleHabitDate(env, ctx, slug, date) {
  const config = getHabitConfig(slug);
  if (!config) return notFound(`Unknown habit "${slug}"`);

  const rawEntries = await getCachedEntries(env, ctx, config.sheetId);
  const entries = rawEntries.filter((e) => e.date === date);
  return jsonResponse({ config, date, entries });
}

async function handleIngest(request, env, slug) {
  const config = getHabitConfig(slug);
  if (!config) return notFound(`Unknown habit "${slug}"`);

  const secret = request.headers.get("X-Habit-Webhook-Secret") || "";
  if (!env.WEBHOOK_SECRET || secret !== env.WEBHOOK_SECRET) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  let entry;
  try {
    entry = await request.json();
  } catch (err) {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!entry || typeof entry !== "object" || !entry.date) {
    return jsonResponse({ error: "Entry must be an object with at least a `date` field" }, { status: 400 });
  }

  try {
    await appendSheetEntry(env, config.sheetId, entry);
  } catch (err) {
    return jsonResponse({ error: String(err.message || err) }, { status: 502 });
  }

  await invalidateCache(config.sheetId);
  return jsonResponse({ ok: true }, { status: 201 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Strip a leading /api prefix if this Worker is routed at sijobling.com/api/*
    // (Option A in wrangler.toml) rather than its own subdomain (Option B).
    const path = url.pathname.replace(/^\/api/, "");
    const segments = path.split("/").filter(Boolean);

    try {
      if (request.method === "GET" && segments.length === 1 && segments[0] === "habits") {
        return await handleIndex(env, ctx);
      }
      if (request.method === "GET" && segments.length === 2 && segments[0] === "habits") {
        return await handleHabit(env, ctx, segments[1]);
      }
      if (request.method === "GET" && segments.length === 3 && segments[0] === "habits") {
        return await handleHabitDate(env, ctx, segments[1], segments[2]);
      }
      if (
        request.method === "POST" &&
        segments.length === 3 &&
        segments[0] === "habits" &&
        segments[2] === "entries"
      ) {
        return await handleIngest(request, env, segments[1]);
      }
    } catch (err) {
      return jsonResponse({ error: String(err.message || err) }, { status: 500 });
    }

    return notFound();
  },
};
