#!/usr/bin/env node
/**
 * Syncs the reading log with a BookWyrm CSV export (Rambling Readers:
 * Settings > Export, then download the CSV).
 *
 * For each row in the export it either:
 *   - updates the matching post in posts/reading/ (matched by the stored
 *     book.bookwyrmUrl, else by author plus a fuzzy title match), or
 *   - creates a new post in posts/reading/<year started>/.
 *
 * Merge rules for existing posts, so it is safe to re-run:
 *   - started / finished: the earliest of the post's date and the export's
 *   - rating: the export's, when it has one
 *   - date: set to the started date (moving the file to that year's folder)
 *   - review: added as the post body only if the post has no body yet
 *   - cover, series and everything else are never touched
 *
 * New posts get no cover. Run scripts/fetch-book-covers-openlibrary.js after.
 *
 * Usage:
 *   node scripts/import-bookwyrm-export.js path/to/export.csv
 *   node scripts/import-bookwyrm-export.js path/to/export.csv --dry-run
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts", "reading");

// --- CSV -------------------------------------------------------------------

// Minimal RFC 4180 parser: quoted fields, doubled quotes, newlines in quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.some((v) => v.trim()));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] || "").trim()])));
}

// --- Helpers ---------------------------------------------------------------

const clean = (s) => s.replace(/\s*\(duplicate\)/gi, "").trim();
const norm = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const quote = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function similarity(a, b) {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

// "Mobius: The Timeless Artifact" -> title + subtitle, as the Goodreads posts do.
function splitTitle(full) {
  const m = full.match(/^(.+?)(?::\s+|\s+[-–—]\s+|\s*\[|\s*\()(.+)$/);
  if (!m) return { title: full, subtitle: "" };
  return { title: m[1].trim(), subtitle: m[2].replace(/[\])]\s*$/, "").trim() };
}

const earliest = (a, b) => (a && b ? (a < b ? a : b) : a || b || "");
const fm = (text, key) => ((text.match(new RegExp(`^\\s*${key}:\\s*"?(.*?)"?\\s*$`, "m")) || [])[1] || "");

function listPosts(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listPosts(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

function readPost(file) {
  const text = fs.readFileSync(file, "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return {
    file,
    head: m[1],
    body: m[2],
    title: fm(m[1], "title"),
    subtitle: fm(m[1], "subtitle"),
    author: fm(m[1], "author"),
    bookwyrmUrl: fm(m[1], "bookwyrmUrl"),
    started: fm(m[1], "started"),
    finished: fm(m[1], "finished"),
    rating: fm(m[1], "rating"),
    status: fm(m[1], "status"),
  };
}

function findPost(posts, row) {
  const byUrl = posts.find((p) => p.bookwyrmUrl && p.bookwyrmUrl === row.remote_id);
  if (byUrl) return byUrl;
  const author = norm(clean(row.author_text));
  const full = norm(clean(row.title));
  const short = norm(splitTitle(clean(row.title)).title);
  let best = null;
  let bestScore = 0;
  for (const p of posts) {
    if (p.bookwyrmUrl || norm(p.author) !== author) continue;
    const score = Math.max(
      similarity(short, norm(p.title)),
      similarity(full, norm(p.title)),
      similarity(full, norm(p.title + p.subtitle))
    );
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return bestScore >= 0.8 ? best : null;
}

const reviewBody = (row) => {
  const paragraphs = [];
  if (row.review_name) paragraphs.push(`**${row.review_name}**`);
  if (row.review_content) paragraphs.push(...row.review_content.split(/\n+/).map((s) => s.trim()).filter(Boolean));
  return paragraphs.join("\n\n");
};

// --- Merge -----------------------------------------------------------------

function merged(post, row) {
  const started = earliest(post && post.started, row.start_date);
  const finished = earliest(post && post.finished, row.finish_date);
  const rating = row.rating ? String(Math.round(Number(row.rating))) : (post && post.rating) || "";
  const status = row.shelf === "to-read" ? "to-read" : row.shelf === "reading" ? "reading" : "read";
  return { started, finished, rating, status };
}

function readingBlock(m) {
  const lines = ["reading:", `  status: ${m.status}`];
  if (m.started) lines.push(`  started: ${m.started}`);
  if (m.finished) lines.push(`  finished: ${m.finished}`);
  if (m.rating) lines.push(`  rating: ${m.rating}`);
  return lines.join("\n");
}

function validIsbn(row) {
  if (/^\d{13}$/.test(row.isbn_13)) return row.isbn_13;
  if (/^\d{9}[\dX]$/i.test(row.isbn_10)) return row.isbn_10;
  return "";
}

function newPost(row) {
  const { title, subtitle } = splitTitle(clean(row.title));
  const m = merged(null, row);
  const date = m.started || m.finished || row.shelf_date;
  const isbn = validIsbn(row);
  const olKey = /^OL\d+M$/.test(row.openlibrary_key) ? row.openlibrary_key : "";
  const head = [
    `title: ${quote(title)}`,
    `date: ${date}`,
    "categories:",
    '  - "reading"',
    "book:",
    subtitle && `  subtitle: ${quote(subtitle)}`,
    `  author: ${quote(clean(row.author_text))}`,
    isbn && `  isbn: ${quote(isbn)}`,
    olKey && `  openLibraryKey: ${quote(olKey)}`,
    `  bookwyrmUrl: ${quote(row.remote_id)}`,
    readingBlock(m),
  ].filter(Boolean);
  const body = reviewBody(row);
  const slug = slugify(subtitle ? `${title} ${subtitle}` : title);
  return {
    file: path.join(POSTS_DIR, date.slice(0, 4), `${slug}.md`),
    text: `---\n${head.join("\n")}\n---\n${body ? `\n${body}\n` : ""}`,
  };
}

function updatePost(post, row) {
  const m = merged(post, row);
  const date = m.started || m.finished || fm(post.head, "date");
  let head = post.head.replace(/^date:.*$/m, `date: ${date}`);
  if (!post.bookwyrmUrl) {
    head = head.replace(/^(book:\n(?:  .*\n)*?)(?=\S|$)/m, (block) => `${block}  bookwyrmUrl: ${quote(row.remote_id)}\n`);
  }
  head = head.replace(/^reading:\n(?:  .*(?:\n|$))*/m, `${readingBlock(m)}\n`);
  let body = post.body;
  if (!body.trim() && reviewBody(row)) body = `\n${reviewBody(row)}\n`;
  const dest = path.join(POSTS_DIR, date.slice(0, 4), path.basename(post.file));
  return { file: dest, text: `---\n${head.replace(/\n+$/, "")}\n---\n${body}` };
}

// --- Main ------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = args.find((a) => !a.startsWith("--"));
  if (!csvPath) {
    console.error("Usage: node scripts/import-bookwyrm-export.js export.csv [--dry-run]");
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(csvPath, "utf8")).sort((a, b) => a.start_date.localeCompare(b.start_date));
  const posts = listPosts(POSTS_DIR).map(readPost);
  const claimed = new Set();
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const post = findPost(posts.filter((p) => !claimed.has(p)), row);
    const result = post ? updatePost(post, row) : newPost(row);
    const rel = path.relative(ROOT, result.file);
    if (post) {
      claimed.add(post);
      const moved = result.file !== post.file ? `  (moved from ${path.relative(ROOT, post.file)})` : "";
      console.log(`update  ${rel}${moved}`);
      updated++;
    } else {
      if (fs.existsSync(result.file)) {
        console.warn(`skip    ${rel} already exists but did not match "${row.title}"; add bookwyrmUrl to it`);
        continue;
      }
      console.log(`create  ${rel}`);
      created++;
    }
    if (dryRun) continue;
    fs.mkdirSync(path.dirname(result.file), { recursive: true });
    if (post && result.file !== post.file) fs.renameSync(post.file, result.file);
    fs.writeFileSync(result.file, result.text);
  }
  console.log(`\n${dryRun ? "Would update" : "Updated"} ${updated}, ${dryRun ? "would create" : "created"} ${created}.`);
}

main();
