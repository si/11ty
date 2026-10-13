#!/usr/bin/env node
/**
 * Keeps _data/countdownVideos.json up to date from the channel's public RSS
 * feed (no API key needed).
 *
 *   - Only videos titled like "66 days to go..." are kept.
 *   - Merged by youtubeId: new episodes are added, and titles (plus the
 *     daysToGo parsed from them) are refreshed if renamed on YouTube.
 *   - Existing entries are never deleted; the file stays sorted by daysToGo,
 *     highest first. YouTube publish dates are ignored on purpose.
 *
 * Usage:
 *   node scripts/countdown-sync.js [--dry-run] [--feed <url-or-file>]
 *
 * Exits 0 whether or not anything changed; prints "changed=true|false" so the
 * workflow can decide whether to open a PR.
 */

const fs = require("fs");
const path = require("path");

const CHANNEL_ID = "UCFZ-J-ZNLPODQoNig6wJ_UA";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const DATA_FILE = path.join(__dirname, "..", "_data", "countdownVideos.json");

// "1 day to go" is singular on the last day, so allow day/days.
const TITLE_PATTERN = /(\d+)\s+days?\s+to\s+go/i;

function parseDaysToGo(title) {
  const match = TITLE_PATTERN.exec(title || "");
  return match ? Number(match[1]) : null;
}

function decodeXml(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

// Minimal Atom parsing: the YouTube feed is flat and regular, so a tiny
// extractor avoids pulling in an XML dependency.
function parseFeed(xml) {
  const entries = [];
  const entryPattern = /<entry>([\s\S]*?)<\/entry>/g;
  let entry;
  while ((entry = entryPattern.exec(xml))) {
    const id = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(entry[1]);
    const title = /<title>([\s\S]*?)<\/title>/.exec(entry[1]);
    if (id && title) entries.push({ youtubeId: id[1].trim(), title: decodeXml(title[1]).trim() });
  }
  return entries;
}

function toEpisode({ youtubeId, title }) {
  const daysToGo = parseDaysToGo(title);
  if (daysToGo === null) return null;
  return { daysToGo, title, youtubeId, url: `https://www.youtube.com/watch?v=${youtubeId}` };
}

// Returns a new, sorted array; never mutates or drops `existing`.
function mergeEpisodes(existing, feedEntries) {
  const byId = new Map(existing.map((episode) => [episode.youtubeId, { ...episode }]));

  for (const feedEntry of feedEntries) {
    const incoming = toEpisode(feedEntry);
    if (!incoming) continue;
    const current = byId.get(incoming.youtubeId);
    if (current) {
      current.title = incoming.title;
      current.daysToGo = incoming.daysToGo;
    } else {
      byId.set(incoming.youtubeId, incoming);
    }
  }

  // Array.prototype.sort is stable, so ties keep their existing order.
  return [...byId.values()].sort((a, b) => b.daysToGo - a.daysToGo);
}

// One episode per line, matching the hand-written seed file so diffs stay small.
function serialize(episodes) {
  const lines = episodes.map(
    (e) =>
      `  { "daysToGo": ${e.daysToGo}, "title": ${JSON.stringify(e.title)}, "youtubeId": ${JSON.stringify(e.youtubeId)}, "url": ${JSON.stringify(e.url)} }`
  );
  return `[\n${lines.join(",\n")}\n]\n`;
}

async function loadFeed(source) {
  if (!/^https?:\/\//.test(source)) return fs.readFileSync(source, "utf8");
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Feed request failed: ${res.status} ${res.statusText}`);
  return res.text();
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const feedIndex = args.indexOf("--feed");
  const source = feedIndex > -1 ? args[feedIndex + 1] : FEED_URL;

  const existing = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const feedEntries = parseFeed(await loadFeed(source));
  const next = serialize(mergeEpisodes(existing, feedEntries));
  const changed = next !== fs.readFileSync(DATA_FILE, "utf8");

  if (changed && !dryRun) fs.writeFileSync(DATA_FILE, next);
  console.log(`Feed entries: ${feedEntries.length}, episodes: ${existing.length}`);
  console.log(changed ? (dryRun ? "Would update countdownVideos.json" : "Updated countdownVideos.json") : "No changes");
  console.log(`changed=${changed}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { parseDaysToGo, parseFeed, toEpisode, mergeEpisodes, serialize };
