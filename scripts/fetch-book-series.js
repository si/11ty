#!/usr/bin/env node
/**
 * Fills in `book.series` and `book.seriesNumber` for reading posts that have no
 * series yet, using Open Library. Run it on a normal machine (Open Library is
 * blocked in cloud sessions).
 *
 * For each post it tries, in order, until a series is found:
 *   1. The edition record by ISBN          (book.isbn)
 *   2. The edition record by ID            (book.openLibraryKey)
 *   3. Open Library title + author search, then the `series` field of up to
 *      three of the matching editions
 *   4. The work's `series:` subject, if the search found one (name only, no number)
 *
 * It only ever adds missing fields: existing series and seriesNumber values are
 * left alone unless you pass --force. Series names are tidied (e.g. "The Long
 * Winter ; 1" becomes name "The Long Winter", number 1). Books that are not in
 * a series are listed at the end; most of those are standalones, so check the
 * list rather than assuming something went wrong. Slow, polite and re-runnable.
 *
 * Usage:
 *   node scripts/fetch-book-series.js              # all posts with no series
 *   node scripts/fetch-book-series.js --dry-run    # show what it would write
 *   node scripts/fetch-book-series.js --limit 5    # just the next 5
 *   node scripts/fetch-book-series.js --delay 5    # slower: ~5s apart
 *   node scripts/fetch-book-series.js --force      # re-check posts that have a series
 *
 * Then run `npm run build` and look at /reading/series/.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts", "reading");
const OPENLIBRARY = process.env.OPENLIBRARY_BASE || "https://openlibrary.org";
const USER_AGENT = "sijobling.com series fetcher (one-off, throttled; simon.jobling@gmail.com)";
const MAX_RETRIES = 3;

function parseArgs(argv) {
  const args = { delay: 2, limit: Infinity, dryRun: false, force: false };
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
    series: field(text, "series"),
    seriesNumber: field(text, "seriesNumber"),
  };
}

// Retries on 429/5xx and network errors, honouring Retry-After when sent.
async function politeFetch(url, delaySeconds) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "application/json" }, redirect: "follow" });
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
  await politePause(delaySeconds);
  if (!res || !res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Open Library series strings come in many shapes:
 *   "The Long Winter ; 1"   "Magic 2.0, #2"   "Warmer (Book 3)"   "Discworld"
 * Returns { name, number } with number as a string (or "") or null if empty.
 */
function parseSeries(raw) {
  let s = String(raw || "").trim();
  if (!s) return null;
  let number = "";
  const patterns = [
    /\s*[;,]\s*(?:#|book|no\.?|vol\.?|volume)?\s*(\d+(?:\.\d+)?)\s*$/i,
    /\s*\(\s*(?:#|book|no\.?|vol\.?|volume)?\s*(\d+(?:\.\d+)?)\s*\)\s*$/i,
    /\s+(?:#|book\s+|no\.\s*|vol\.\s*|volume\s+)(\d+(?:\.\d+)?)\s*$/i,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      number = m[1];
      s = s.slice(0, m.index).trim();
      break;
    }
  }
  s = s.replace(/[;,]\s*$/, "").trim();
  return s ? { name: s, number } : null;
}

// `series:the_long_winter` subjects carry a name but no number.
function seriesFromSubjects(subjects) {
  for (const subject of subjects || []) {
    const m = String(subject).match(/^series:\s*(.+)$/i);
    if (m) {
      const name = m[1].replace(/_/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
      if (name) return { name, number: "" };
    }
  }
  return null;
}

async function editionSeries(url, args) {
  const data = await getJson(url, args.delay);
  if (!data || !Array.isArray(data.series)) return null;
  for (const raw of data.series) {
    const parsed = parseSeries(raw);
    if (parsed) return parsed;
  }
  return null;
}

async function findSeries(book, args) {
  if (book.isbn) {
    const found = await editionSeries(`${OPENLIBRARY}/isbn/${book.isbn}.json`, args);
    if (found) return { ...found, source: `Open Library ISBN ${book.isbn}` };
  }
  if (book.olKey) {
    const found = await editionSeries(`${OPENLIBRARY}/books/${book.olKey}.json`, args);
    if (found) return { ...found, source: `Open Library ${book.olKey}` };
  }

  const q = new URLSearchParams({ title: book.title, author: book.author, limit: "3", fields: "key,title,edition_key,subject" });
  const data = await getJson(`${OPENLIBRARY}/search.json?${q}`, args.delay);
  const docs = (data && data.docs) || [];
  for (const doc of docs) {
    for (const olid of (doc.edition_key || []).slice(0, 3)) {
      const found = await editionSeries(`${OPENLIBRARY}/books/${olid}.json`, args);
      if (found) return { ...found, source: `Open Library search (${olid})` };
    }
  }
  for (const doc of docs) {
    const found = seriesFromSubjects(doc.subject);
    if (found) return { ...found, source: "Open Library subject" };
  }
  return null;
}

const yamlString = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

// Inserts or replaces a field inside the `book:` block, keeping series next to seriesNumber.
function setBookField(text, key, value) {
  const line = `  ${key}: ${value}`;
  const existing = new RegExp(`^(\\s+)${key}:.*$`, "m");
  if (existing.test(text)) return text.replace(existing, line);
  return text.replace(/^(book:\n(?:  .*\n)*?)(?=\S)/m, (block) => `${block}${line}\n`);
}

function applySeries(book, found, force) {
  let text = book.text;
  const notes = [];
  if (!book.series || force) {
    text = setBookField(text, "series", yamlString(found.name));
    notes.push(`series "${found.name}"`);
  }
  // Only trust a number that belongs to the series we are keeping.
  const sameSeries = !book.series || force || book.series.toLowerCase() === found.name.toLowerCase();
  if (found.number && sameSeries && (!book.seriesNumber || force)) {
    text = setBookField(text, "seriesNumber", found.number);
    notes.push(`number ${found.number}`);
  }
  return { text, notes };
}

async function main() {
  const args = parseArgs(process.argv);
  const books = listPosts(POSTS_DIR).map(readBook);
  const todo = books.filter((b) => args.force || !b.series || !b.seriesNumber);
  const batch = todo.slice(0, args.limit);

  console.log(`${books.length} books, ${todo.length} missing a series or number, doing ${batch.length}.`);
  if (args.dryRun) {
    batch.forEach((b) => console.log(`  would check ${b.slug}  (${b.isbn || b.olKey || "title search"})`));
    return;
  }

  const none = [];
  let changed = 0;
  for (let i = 0; i < batch.length; i++) {
    const book = batch[i];
    console.log(`[${i + 1}/${batch.length}] ${book.slug}`);
    const found = await findSeries(book, args);
    if (!found) {
      console.log("  no series found");
      none.push(book);
      continue;
    }
    const { text, notes } = applySeries(book, found, args.force);
    if (!notes.length) {
      console.log(`  ${found.name}${found.number ? ` #${found.number}` : ""} already recorded`);
      continue;
    }
    fs.writeFileSync(book.file, text);
    changed++;
    console.log(`  set ${notes.join(", ")} from ${found.source}`);
  }

  console.log(`\nDone. ${changed} updated, ${none.length} with no series found (likely standalones).`);
  none.forEach((b) => console.log(`  ${b.slug}  (${b.author})`));
  console.log("Add `series` and `seriesNumber` under `book:` by hand for any that should be in a series.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { parseSeries, seriesFromSubjects, setBookField };
