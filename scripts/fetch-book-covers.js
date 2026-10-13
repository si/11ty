#!/usr/bin/env node
/**
 * Replaces the low-res (75px) Goodreads thumbnails on the reading posts with
 * full-size covers, saved locally to img/reading/<goodreadsId>.jpg.
 *
 * For each post in posts/reading/ it:
 *   1. opens https://www.goodreads.com/book/show/<goodreadsId>
 *   2. reads the page's og:image and drops the "._SY475_" style size token(s) to
 *      get the full-size image (falling back to the og:image as-is)
 *   3. saves it to img/reading/<goodreadsId>.jpg and points the post's
 *      `book.cover` at it, then removes the old thumbnail
 *
 * It is deliberately slow and polite: one request at a time, a pause (with
 * jitter) between every request, and back-off if Goodreads pushes back. It is
 * resumable, so posts that already have <id>.jpg are skipped; stop it any time
 * (Ctrl+C) and run it again later.
 *
 * Usage:
 *   node scripts/fetch-book-covers.js                 # all books, ~6s apart
 *   node scripts/fetch-book-covers.js --limit 10      # just the next 10
 *   node scripts/fetch-book-covers.js --delay 15      # slower: ~15s apart
 *   node scripts/fetch-book-covers.js --dry-run       # show what would happen
 *   node scripts/fetch-book-covers.js --force         # re-download existing
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts", "reading");
const IMG_DIR = path.join(ROOT, "img", "reading");
const USER_AGENT =
  "Mozilla/5.0 (compatible; sijobling.com cover fetcher; one-off, throttled)";
const MAX_RETRIES = 3;

function parseArgs(argv) {
  const args = { delay: 6, limit: Infinity, dryRun: false, force: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--force") args.force = true;
    else if (a === "--delay") args.delay = Number(argv[++i]);
    else if (a === "--limit") args.limit = Number(argv[++i]);
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(1);
    }
  }
  if (!(args.delay >= 1)) {
    console.error("--delay must be at least 1 (seconds)");
    process.exit(1);
  }
  return args;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Base delay plus up to 50% jitter so requests don't land on a fixed beat.
const politePause = (delaySeconds) =>
  sleep(delaySeconds * 1000 * (1 + Math.random() * 0.5));

function listPosts(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listPosts(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

function readBook(file) {
  const text = fs.readFileSync(file, "utf8");
  const id = (text.match(/^\s+goodreadsId:\s*"?(\d+)"?/m) || [])[1];
  const cover = (text.match(/^\s+cover:\s*"?([^"\n]+)"?/m) || [])[1];
  return { file, text, id, cover };
}

// Retries on 429/5xx and network errors, honouring Retry-After when sent.
async function politeFetch(url, delaySeconds) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": USER_AGENT, accept: "text/html,image/*" },
        redirect: "follow",
      });
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const wait = retryAfter > 0 ? retryAfter : delaySeconds * 4 * attempt;
        console.warn(`  ${res.status} from server, waiting ${wait}s (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(wait * 1000);
        continue;
      }
      return res;
    } catch (err) {
      const wait = delaySeconds * 4 * attempt;
      console.warn(`  network error (${err.cause ? err.cause.code : err.message}), waiting ${wait}s (attempt ${attempt}/${MAX_RETRIES})`);
      await sleep(wait * 1000);
    }
  }
  return null;
}

function extractCoverUrl(html) {
  const tag = html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i);
  if (!tag) return null;
  const content = tag[0].match(/content=["']([^"']+)["']/i);
  return content ? content[1].replace(/&amp;/g, "&") : null;
}

// ".../50812451._SY475_.jpg" -> ".../50812451.jpg" (the original, full size)
const fullSizeUrl = (url) => url.replace(/\._(?:[A-Z]{2}\d+_)+(?=\.\w+$)/, "");

async function downloadImage(url, delaySeconds) {
  const res = await politeFetch(url, delaySeconds);
  if (!res || !res.ok) return null;
  if (!(res.headers.get("content-type") || "").startsWith("image/")) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  // Goodreads serves a tiny placeholder for books with no cover.
  return buffer.length > 5000 ? buffer : null;
}

async function processBook(book, args) {
  const pageUrl = `${process.env.GOODREADS_BASE || "https://www.goodreads.com"}/book/show/${book.id}`;
  const page = await politeFetch(pageUrl, args.delay);
  if (!page || !page.ok) {
    return `page failed (${page ? page.status : "no response"})`;
  }
  const ogImage = extractCoverUrl(await page.text());
  if (!ogImage) return "no og:image found on page";

  await politePause(args.delay);
  const candidates = [...new Set([fullSizeUrl(ogImage), ogImage])];
  let image = null;
  for (const url of candidates) {
    image = await downloadImage(url, args.delay);
    if (image) break;
    await politePause(args.delay);
  }
  if (!image) return "image download failed";

  const filename = `${book.id}.jpg`;
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.writeFileSync(path.join(IMG_DIR, filename), image);

  const updated = book.cover
    ? book.text.replace(/^(\s+cover:\s*).*$/m, `$1"${filename}"`)
    : book.text.replace(/^(\s+averageRating:.*)$/m, `$1\n  cover: "${filename}"`);
  fs.writeFileSync(book.file, updated);

  if (book.cover && book.cover !== filename) {
    const old = path.join(IMG_DIR, book.cover);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  }
  return `saved ${filename} (${Math.round(image.length / 1024)} KB)`;
}

async function main() {
  const args = parseArgs(process.argv);
  const books = listPosts(POSTS_DIR).map(readBook);

  const todo = books.filter(
    (b) => b.id && (args.force || b.cover !== `${b.id}.jpg` || !fs.existsSync(path.join(IMG_DIR, b.cover)))
  );
  const noId = books.filter((b) => !b.id).map((b) => path.relative(ROOT, b.file));
  const batch = todo.slice(0, args.limit);

  console.log(`${books.length} books, ${todo.length} need a full-size cover, doing ${batch.length}.`);
  if (noId.length) console.log(`No Goodreads ID (skipped, add one to the frontmatter): ${noId.join(", ")}`);
  if (args.dryRun) {
    batch.forEach((b) => console.log(`  would fetch ${b.id}  ${path.relative(ROOT, b.file)}`));
    return;
  }

  const failures = [];
  for (let i = 0; i < batch.length; i++) {
    const book = batch[i];
    console.log(`[${i + 1}/${batch.length}] ${path.basename(book.file)} (${book.id})`);
    const result = await processBook(book, args);
    console.log(`  ${result}`);
    if (!result.startsWith("saved")) failures.push(`${path.basename(book.file)}: ${result}`);
    if (i < batch.length - 1) await politePause(args.delay);
  }

  console.log(`\nDone. ${batch.length - failures.length} saved, ${failures.length} failed.`);
  failures.forEach((f) => console.log(`  ${f}`));
  if (failures.length) console.log("Run it again to retry the failures.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
