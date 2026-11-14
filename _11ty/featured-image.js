/**
 * Featured image for a post or page, used by the feeds, the Open Graph tags
 * and the JSON-LD.
 *
 * Order of preference: `image` front matter, a book's `book.cover`, then the
 * images in the rendered body. The first usable one wins (see `check`).
 * Returns null where there is none.
 *
 * Returns { url, type, alt, width, height }. `url` is site-relative unless the
 * image is remote. `width` and `height` are only set for local files.
 */
const fs = require("fs");
const path = require("path");
const { imageSize } = require("image-size");

const TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

const decode = (value) =>
  String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const attribute = (tag, name) => {
  const match = new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, "i").exec(tag);
  return match ? decode(match[1] !== undefined ? match[1] : match[2]) : "";
};

const extension = (url) =>
  ((/\.([a-z0-9]+)(?:[?#]|$)/i.exec(url) || [])[1] || "").toLowerCase();

// Smaller than this (either side) is a thumbnail or badge, not a card image.
const MIN_SIZE = 200;

const isRemote = (url) => /^(https?:)?\/\//i.test(url);

const sizeCache = new Map();
// Size of a local image, or null if the file is missing or unreadable.
function localSize(url) {
  if (!sizeCache.has(url)) {
    let size = null;
    try {
      const file = path.join(process.cwd(), decodeURI(url.split(/[?#]/)[0]));
      const { width, height } = imageSize(fs.readFileSync(file));
      if (width && height) size = { width, height };
    } catch (e) {
      // Leave as null.
    }
    sizeCache.set(url, size);
  }
  return sizeCache.get(url);
}

// Social cards and feed readers need a real raster image. This drops SVGs,
// inline data URIs, known placeholders, relative paths (old imports whose
// files no longer exist), missing files and anything too small to be useful.
// Returns the image's size ({} for remote images) or null if it is unusable.
function check(url) {
  if (!url || url.startsWith("data:") || extension(url) === "svg") return null;
  if (isRemote(url)) return /no_image_card/i.test(url) ? null : {};
  if (!url.startsWith("/")) return null;
  const size = localSize(url);
  if (!size || size.width < MIN_SIZE || size.height < MIN_SIZE) return null;
  return size;
}

function bodyImages(html) {
  return (String(html || "").match(/<img\b[^>]*>/gi) || []).map((tag) => ({
    url: attribute(tag, "src"),
    alt: attribute(tag, "alt"),
  }));
}

function featuredImage(post) {
  if (!post) return null;
  const data = post.data || {};
  const candidates = [];
  if (data.image) candidates.push({ url: data.image, alt: data.imageAlt });
  if (data.book && data.book.cover) {
    const cover = String(data.book.cover);
    candidates.push({
      url: /^(\/|https?:)/i.test(cover) ? cover : `/img/reading/${cover}`,
      alt: `Cover of ${data.title || "the book"}`,
    });
  }
  candidates.push(...bodyImages(post.templateContent));

  for (const candidate of candidates) {
    const size = check(candidate.url);
    if (!size) continue;
    return {
      url: candidate.url,
      type: TYPES[extension(candidate.url)] || "image/jpeg",
      alt: candidate.alt || data.title || "",
      ...size,
    };
  }
  return null;
}

module.exports = { featuredImage };
