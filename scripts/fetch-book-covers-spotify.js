#!/usr/bin/env node
/**
 * Fetches cover art for audiobook posts from Spotify, using the public oEmbed
 * endpoint (no API key, and not rate limited like Open Library search). Saves
 * each cover to img/reading/<slug>.jpg and sets `book.cover` in the post.
 *
 * The slug -> Spotify show map is below; add a line for any other audiobook.
 * Resumable: posts that already have a cover are skipped unless you pass --force.
 *
 * Usage:
 *   node scripts/fetch-book-covers-spotify.js            # all audiobooks with no cover
 *   node scripts/fetch-book-covers-spotify.js --dry-run  # list what it would do
 *   node scripts/fetch-book-covers-spotify.js --force    # re-download existing
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts", "reading");
const IMG_DIR = path.join(ROOT, "img", "reading");
const OEMBED = process.env.SPOTIFY_OEMBED_BASE || "https://open.spotify.com/oembed";
const USER_AGENT = "sijobling.com cover fetcher (one-off, throttled; simon.jobling@gmail.com)";
const PAUSE_MS = 1500;

const SHOWS = {
  "fairy-tale": "5c0RIuODEeeu2phNY1o26Z",
  "fck-failure": "4mHDKtoVlSXMDAtJW9PW7r",
  "how-to-win-friends-and-influence-people": "3UfAQ6yAJQqHjifKaQ2Nm5",
  "i-love-you-byeee": "0NQZSgfTSeKHzgdO26gCsR",
  "the-coming-wave": "6WVhYRn4BlFKKxIhz0QNCL",
  "the-satsuma-complex": "3MHSr87XBgeFZ153MtcaWA",
  "the-time-machine-audiobook": "1WPjX8JhQVpO47MdNJgolz",
  "this-is-for-everyone": "7L7uUeSohpu5yPus3HGVxy",
  "wankernomics": "0URCsBe6bm3rm9e0uECcE2",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function listPosts(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listPosts(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

const field = (text, key) => ((text.match(new RegExp(`^\\s+${key}:\\s*"?([^"\\n]*)"?\\s*$`, "m")) || [])[1] || "").trim();

async function fetchOk(url, accept) {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT, accept }, redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res;
}

async function processPost(file, slug, showId, force) {
  const text = fs.readFileSync(file, "utf8");
  const cover = field(text, "cover");
  if (!force && cover && fs.existsSync(path.join(IMG_DIR, cover))) return "already has a cover, skipped";

  const showUrl = `https://open.spotify.com/show/${showId}`;
  const meta = await (await fetchOk(`${OEMBED}?url=${encodeURIComponent(showUrl)}`, "application/json")).json();
  if (!meta.thumbnail_url) throw new Error("oEmbed returned no thumbnail_url");

  const image = Buffer.from(await (await fetchOk(meta.thumbnail_url, "image/*")).arrayBuffer());
  if (image.length < 2000) throw new Error("image too small to be a cover");

  const filename = `${slug}.jpg`;
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.writeFileSync(path.join(IMG_DIR, filename), image);
  const updated = cover
    ? text.replace(/^(\s+cover:\s*).*$/m, `$1"${filename}"`)
    : text.replace(/^(book:\n(?:  .*\n)*?)(?=\S)/m, (block) => `${block}  cover: "${filename}"\n`);
  fs.writeFileSync(file, updated);
  return `saved ${filename} (${Math.round(image.length / 1024)} KB)`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  const files = listPosts(POSTS_DIR).filter((f) => SHOWS[path.basename(f, ".md")]);
  console.log(`${files.length} audiobook posts mapped to Spotify shows.`);

  const failures = [];
  for (let i = 0; i < files.length; i++) {
    const slug = path.basename(files[i], ".md");
    console.log(`[${i + 1}/${files.length}] ${slug}`);
    if (dryRun) continue;
    try {
      console.log(`  ${await processPost(files[i], slug, SHOWS[slug], force)}`);
    } catch (err) {
      console.log(`  failed: ${err.message}`);
      failures.push(slug);
    }
    await sleep(PAUSE_MS);
  }
  if (failures.length) console.log(`\n${failures.length} failed:\n  ${failures.join("\n  ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
