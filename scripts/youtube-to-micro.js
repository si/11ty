#!/usr/bin/env node
/**
 * Syncs videos from a YouTube playlist to Eleventy micro posts.
 *
 * Required environment variables:
 *   YOUTUBE_API_KEY      - YouTube Data API v3 key
 *   YOUTUBE_PLAYLIST_ID  - ID of the playlist to sync
 *
 * Optional environment variables:
 *   POSTS_DIR            - Override the output directory (default: posts/micro)
 *
 * Flags:
 *   --dry-run            - Print what would be created without writing files
 */

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;
const DRY_RUN = process.argv.includes("--dry-run");
const POSTS_DIR = process.env.POSTS_DIR
  ? path.resolve(process.env.POSTS_DIR)
  : path.join(__dirname, "..", "posts", "micro");

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error?.message || res.statusText;
    throw new Error(`YouTube API error (${res.status}): ${msg}`);
  }
  return data;
}

async function fetchPlaylistVideos(playlistId, apiKey) {
  const videos = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      part: "snippet",
      maxResults: "50",
      playlistId,
      key: apiKey,
      ...(pageToken && { pageToken }),
    });

    const data = await fetchJson(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
    );

    for (const item of data.items ?? []) {
      const { snippet } = item;
      if (snippet.resourceId?.kind !== "youtube#video") continue;

      const videoId = snippet.resourceId.videoId;
      // Prefer the video's own publish date; fall back to when it was added to the playlist.
      const publishedAt = snippet.videoPublishedAt || snippet.publishedAt;

      videos.push({
        id: videoId,
        title: snippet.title,
        description: snippet.description ?? "",
        publishedAt,
      });
    }

    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  return videos;
}

function findExistingVideoIds() {
  const ids = new Set();
  if (!fs.existsSync(POSTS_DIR)) return ids;

  for (const entry of fs.readdirSync(POSTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const yearDir = path.join(POSTS_DIR, entry.name);
    for (const file of fs.readdirSync(yearDir)) {
      if (!file.endsWith(".md")) continue;
      const content = fs.readFileSync(path.join(yearDir, file), "utf8");
      const match = content.match(/^youtubeId:\s*"?([A-Za-z0-9_-]{11})"?/m);
      if (match) ids.add(match[1]);
    }
  }

  return ids;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function firstSentence(text) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const end = trimmed.search(/[.!?]\s/);
  return end !== -1 ? trimmed.slice(0, end + 1) : trimmed.split("\n")[0].trim();
}

function buildPost(video) {
  const date = new Date(video.publishedAt);
  const dateStr = date.toISOString().split("T")[0];
  const title = video.title.replace(/"/g, '\\"');
  const excerpt = firstSentence(video.description);

  const lines = [
    "---",
    `title: "${title}"`,
    `date: ${dateStr}`,
    "categories:",
    '  - "micro"',
    "tags:",
    '  - "youtube"',
    `youtubeId: "${video.id}"`,
    "---",
    "",
    `https://www.youtube.com/watch?v=${video.id}`,
    "",
  ];

  if (excerpt) {
    lines.push(excerpt, "");
  }

  return { dateStr, content: lines.join("\n") };
}

function writePost(video) {
  const { dateStr, content } = buildPost(video);
  const year = dateStr.slice(0, 4);
  const slug = slugify(video.title);
  const yearDir = path.join(POSTS_DIR, year);

  if (!fs.existsSync(yearDir)) {
    fs.mkdirSync(yearDir, { recursive: true });
  }

  const filepath = path.join(yearDir, `${dateStr}-${slug}.md`);
  fs.writeFileSync(filepath, content, "utf8");
  return filepath;
}

async function main() {
  if (!API_KEY) {
    console.error("Error: YOUTUBE_API_KEY environment variable is required");
    process.exit(1);
  }
  if (!PLAYLIST_ID) {
    console.error("Error: YOUTUBE_PLAYLIST_ID environment variable is required");
    process.exit(1);
  }

  if (DRY_RUN) console.log("Dry run mode — no files will be written.\n");

  console.log(`Fetching videos from playlist: ${PLAYLIST_ID}`);
  const videos = await fetchPlaylistVideos(PLAYLIST_ID, API_KEY);
  console.log(`Found ${videos.length} video(s)\n`);

  const existing = findExistingVideoIds();
  let created = 0;
  let skipped = 0;

  for (const video of videos) {
    if (existing.has(video.id)) {
      console.log(`  skip  ${video.id}  ${video.title}`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      const { dateStr } = buildPost(video);
      const year = dateStr.slice(0, 4);
      const slug = slugify(video.title);
      console.log(`  + ${path.join("posts", "micro", year, `${dateStr}-${slug}.md`)}`);
    } else {
      const filepath = writePost(video);
      console.log(`  +     ${path.relative(process.cwd(), filepath)}`);
    }
    created++;
  }

  console.log(`\nCreated: ${created}  Skipped: ${skipped}`);

  if (created > 0 && !DRY_RUN) {
    console.log("\nDon't forget to commit the new files.");
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
