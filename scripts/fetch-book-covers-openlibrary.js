#!/usr/bin/env node
/**
 * Fetches covers for reading posts that have none yet (the ones imported from
 * BookWyrm, which have no Goodreads ID). Saves them to img/reading/<slug>.jpg
 * and sets `book.cover` in the post.
 *
 * For each post it tries, in order, until one returns a real image:
 *   1. Open Library by ISBN        (book.isbn)
 *   2. Open Library by edition ID  (book.openLibraryKey)
 *   3. Open Library title + author search
 *   4. Google Books title + author search
 *
 * Posts with a Goodreads ID are left to scripts/fetch-book-covers.js, unless
 * you pass --all. It is slow and polite (one request at a time, with a pause)
 * and resumable: posts that already have a cover are skipped.
 *
 * Usage:
 *   node scripts/fetch-book-covers-openlibrary.js              # all posts with no cover
 *   node scripts/fetch-book-covers-openlibrary.js --dry-run    # list what it would do
 *   node scripts/fetch-book-covers-openlibrary.js --limit 5    # just the next 5
 *   node scripts/fetch-book-covers-openlibrary.js --delay 5    # slower: ~5s apart
 *   node scripts/fetch-book-covers-openlibrary.js --all        # include Goodreads-ID posts
 *   node scripts/fetch-book-covers-openlibrary.js --force      # re-download existing
 *
 * Any it can't find are listed at the end; save the image as
 * img/reading/<slug>.jpg by hand and add `cover: "<slug>.jpg"` under `book:`.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts", "reading");
const IMG_DIR = path.join(ROOT, "img", "reading");
const OPENLIBRARY = process.env.OPENLIBRARY_BASE || "https://openlibrary.org";
const COVERS = process.env.COVERS_BASE || "https://covers.openlibrary.org";
const GOOGLE_BOOKS = process.env.GOOGLE_BOOKS_BASE || "https://www.googleapis.com/books/v1";
const USER_AGENT = "sijobling.com cover fetcher (one-off, throttled; simon.jobling@gmail.com)";
const MAX_RETRIES = 3;

function parseArgs(argv) {
  const args = { delay: 2, limit: Infinity, dryRun: false, force: false, all: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--force") args.force = true;
    else if (a === "--all") args.all = true;
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
const politePause = (delaySeconds) => sleep(delaySeconds * 1000 * (1 + Math.random() * 0.5));

function listPosts(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listPosts(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

const field = (text, key) => ((text.match(new RegExp(`^\\s+${key}:\\s*"?([^"\\n]*)"?\\s*$`, "m")) || [])[1] || "").trim();
const unquote = (s) => s.replace(/\\"/g, '"').replace(/\\\\/g, "\\");

function readBook(file) {
  const text = fs.readFileSync(file, "utf8");
  return {
    file,
    text,
    slug: path.basename(file, ".md"),
    title: unquote((text.match(/^title:\s*"(.*)"\s*$/m) || [])[1] || ""),
    author: unquote(field(text, "author")),
    isbn: field(text, "isbn"),
    olKey: field(text, "openLibraryKey"),
    goodreadsId: field(text, "goodreadsId"),
    cover: field(text, "cover"),
  };
}

// Retries on 429/5xx and network errors, honouring Retry-After when sent.
async function politeFetch(url, delaySeconds) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": USER_AGENT, accept: "application/json,image/*" },
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

async function getJson(url, delaySeconds) {
  const res = await politeFetch(url, delaySeconds);
  if (!res || !res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Tiny placeholders and 1x1 gifs are not covers.
async function downloadImage(url, delaySeconds) {
  const res = await politeFetch(url, delaySeconds);
  if (!res || !res.ok) return null;
  if (!(res.headers.get("content-type") || "").startsWith("image/")) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.length > 5000 ? buffer : null;
}

// Each source yields candidate image URLs lazily, so we stop at the first hit.
function* sources(book, args) {
  // `default=false` makes Open Library 404 instead of serving a blank image.
  if (book.isbn) yield { name: `Open Library ISBN ${book.isbn}`, urls: async () => [`${COVERS}/b/isbn/${book.isbn}-L.jpg?default=false`] };
  if (book.olKey) yield { name: `Open Library ${book.olKey}`, urls: async () => [`${COVERS}/b/olid/${book.olKey}-L.jpg?default=false`] };
  yield {
    name: "Open Library search",
    urls: async () => {
      const q = new URLSearchParams({ title: book.title, author: book.author, limit: "5", fields: "title,cover_i" });
      const data = await getJson(`${OPENLIBRARY}/search.json?${q}`, args.delay);
      return ((data && data.docs) || []).filter((d) => d.cover_i).map((d) => `${COVERS}/b/id/${d.cover_i}-L.jpg?default=false`);
    },
  };
  yield {
    name: "Google Books search",
    urls: async () => {
      const q = new URLSearchParams({ q: `intitle:${book.title} inauthor:${book.author}`, maxResults: "3" });
      const data = await getJson(`${GOOGLE_BOOKS}/volumes?${q}`, args.delay);
      return ((data && data.items) || [])
        .map((i) => i.volumeInfo && i.volumeInfo.imageLinks && (i.volumeInfo.imageLinks.thumbnail || i.volumeInfo.imageLinks.smallThumbnail))
        .filter(Boolean)
        .map((u) => u.replace(/^http:/, "https:").replace("&edge=curl", "").replace(/zoom=\d/, "zoom=2"));
    },
  };
}

async function processBook(book, args) {
  for (const source of sources(book, args)) {
    const urls = await source.urls();
    for (const url of urls) {
      const image = await downloadImage(url, args.delay);
      await politePause(args.delay);
      if (!image) continue;
      const filename = `${book.slug}.jpg`;
      fs.mkdirSync(IMG_DIR, { recursive: true });
      fs.writeFileSync(path.join(IMG_DIR, filename), image);
      const updated = book.cover
        ? book.text.replace(/^(\s+cover:\s*).*$/m, `$1"${filename}"`)
        : book.text.replace(/^(book:\n(?:  .*\n)*?)(?=\S)/m, (block) => `${block}  cover: "${filename}"\n`);
      fs.writeFileSync(book.file, updated);
      return `saved ${filename} from ${source.name} (${Math.round(image.length / 1024)} KB)`;
    }
  }
  return "no cover found";
}

async function main() {
  const args = parseArgs(process.argv);
  const books = listPosts(POSTS_DIR).map(readBook);
  const todo = books.filter((b) => {
    if (!args.all && b.goodreadsId) return false;
    if (args.force) return true;
    return !b.cover || !fs.existsSync(path.join(IMG_DIR, b.cover));
  });
  const batch = todo.slice(0, args.limit);

  console.log(`${books.length} books, ${todo.length} need a cover, doing ${batch.length}.`);
  if (args.dryRun) {
    batch.forEach((b) => console.log(`  would fetch ${b.slug}  (${b.isbn || b.olKey || "title search"})`));
    return;
  }

  const failures = [];
  for (let i = 0; i < batch.length; i++) {
    const book = batch[i];
    console.log(`[${i + 1}/${batch.length}] ${book.slug}`);
    const result = await processBook(book, args);
    console.log(`  ${result}`);
    if (!result.startsWith("saved")) failures.push(book.slug);
  }

  console.log(`\nDone. ${batch.length - failures.length} saved, ${failures.length} not found.`);
  failures.forEach((f) => console.log(`  ${f}`));
  if (failures.length) console.log("Save these by hand as img/reading/<slug>.jpg and add `cover: \"<slug>.jpg\"` under `book:`.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
