/**
 * Copyright (c) 2024 Google Inc
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

function youtubeEmbed(md) {
  md.core.ruler.after("linkify", "youtube-unfurl", function (state) {
    const tokens = state.tokens;
    for (let idx = 0; idx < tokens.length; idx++) {
      const token = tokens[idx];
      if (token.type !== "inline" || !token.children) {
        continue;
      }

      const paragraphOpen = tokens[idx - 1];
      const paragraphClose = tokens[idx + 1];
      if (
        !paragraphOpen ||
        !paragraphClose ||
        paragraphOpen.type !== "paragraph_open" ||
        paragraphClose.type !== "paragraph_close"
      ) {
        continue;
      }

      // Try to get YouTube URL from links first, then from plain text
      const linkHref = getYoutubeHref(token.children);
      const textHref = getYoutubeUrlFromText(token.children);
      const href = linkHref || textHref;
      if (!href) {
        continue;
      }

      // Only convert if the paragraph contains only the YouTube URL (or whitespace)
      // If it's a link, we allow it even if the link text is different from the URL
      const isLink = linkHref !== null;
      if (!isLink && !isOnlyYoutubeUrl(token.children, href)) {
        continue;
      }
      // For links, check if paragraph only contains the link (possibly with whitespace)
      if (isLink && !isOnlyLinkInParagraph(token.children)) {
        continue;
      }

      const embedHtml = createEmbedHtml(href);
      if (!embedHtml) {
        continue;
      }

      const htmlToken = new state.Token("html_block", "", 0);
      htmlToken.content = `${embedHtml}\n`;
      tokens.splice(idx - 1, 3, htmlToken);
    }
  });
};

function getYoutubeHref(children) {
  const linkOpenTokens = children.filter((child) => child.type === "link_open");
  if (linkOpenTokens.length !== 1) {
    return null;
  }

  const hrefAttr = linkOpenTokens[0].attrs.find((attr) => attr[0] === "href");
  if (!hrefAttr) {
    return null;
  }

  let href = hrefAttr[1];
  // Normalize escaped characters in the URL (markdown might escape underscores, etc.)
  href = href.replace(/\\([_\*\[\]()])/g, "$1");
  
  // Verify it's a YouTube URL
  if (!isYoutubeUrl(href)) {
    return null;
  }

  return href;
}

function getYoutubeUrlFromText(children) {
  // Check if there's a plain text YouTube URL (for cases where linkify didn't work or URL is escaped)
  const allText = children
    .filter((child) => child.type === "text" || child.type === "code_inline")
    .map((child) => child.content)
    .join("")
    .trim();

  if (!allText) {
    return null;
  }

  // Normalize escaped characters (markdown might escape underscores, etc.)
  // Remove backslashes before common URL characters
  const normalizedText = allText.replace(/\\([_\*\[\]()])/g, "$1");

  // Try to match YouTube URLs in the text
  // Match full URLs with protocol - updated to handle escaped characters
  const fullUrlMatch = normalizedText.match(
    /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/)|youtu\.be\/)[^\s<>"']*/i
  );
  if (fullUrlMatch) {
    // Normalize the matched URL to remove any escape sequences
    return fullUrlMatch[0].replace(/\\([_\*\[\]()])/g, "$1");
  }

  // Try to match URLs without protocol (shouldn't happen with linkify, but just in case)
  const urlMatch = normalizedText.match(
    /(?:www\.)?(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/)|youtu\.be\/)[^\s<>"']*/i
  );
  if (urlMatch) {
    // Normalize the matched URL to remove any escape sequences
    return "https://" + urlMatch[0].replace(/\\([_\*\[\]()])/g, "$1");
  }

  return null;
}

function isYoutubeUrl(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace(/^www\./, "").toLowerCase();
    return (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be" ||
      host === "www.youtube.com"
    );
  } catch (e) {
    return false;
  }
}

function isOnlyYoutubeUrl(children, youtubeUrl) {
  // Check if the paragraph contains only the YouTube URL as plain text (possibly with whitespace)
  const textParts = [];

  for (const child of children) {
    if (child.type === "text") {
      const text = child.content.trim();
      if (text) {
        textParts.push(text);
      }
    } else if (child.type !== "softbreak" && child.type !== "hardbreak") {
      // Any other token type (except line breaks) means there's other content
      return false;
    }
  }

  // For plain text URLs, check if the text matches the YouTube URL
  // Normalize both the text and the URL to handle escaped characters
  const allText = textParts.join(" ").trim().replace(/\\([_\*\[\]()])/g, "$1");
  const normalizedUrl = youtubeUrl.replace(/\\([_\*\[\]()])/g, "$1");
  
  return allText === normalizedUrl || normalizedUrl.includes(allText) || allText.includes(normalizedUrl);
}

function isOnlyLinkInParagraph(children) {
  // Check if the paragraph contains only a single link (possibly with whitespace)
  let linkCount = 0;
  let hasOtherContent = false;

  for (const child of children) {
    if (child.type === "link_open") {
      linkCount++;
    } else if (child.type === "link_close") {
      // Link close is fine
    } else if (child.type === "text") {
      const text = child.content.trim();
      // Whitespace is fine, but other text means there's content outside the link
      if (text) {
        hasOtherContent = true;
      }
    } else if (child.type !== "softbreak" && child.type !== "hardbreak") {
      // Any other token type means there's other content
      hasOtherContent = true;
    }
  }

  // Only convert if there's exactly one link and no other content
  return linkCount === 1 && !hasOtherContent;
}

function createEmbedHtml(href) {
  const embedUrl = buildEmbedUrl(href);
  if (!embedUrl) {
    return null;
  }

  // Extract video ID for better accessibility
  const videoIdMatch = embedUrl.match(/\/embed\/([^?&#]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  const title = videoId 
    ? `YouTube video player (Video ID: ${videoId})` 
    : "YouTube video player";

  return `<div class="youtube-embed"><iframe src="${embedUrl}" title="${title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" aria-label="Embedded YouTube video"></iframe></div>`;
}

function buildEmbedUrl(rawUrl) {
  // Normalize escaped characters in the URL before parsing
  const normalizedUrl = rawUrl.replace(/\\([_\*\[\]()])/g, "$1");
  
  let url;
  try {
    url = new URL(normalizedUrl);
  } catch (e) {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const pathParts = url.pathname.split("/").filter(Boolean);
  let id = null;

  if (host === "youtu.be") {
    [id] = pathParts;
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.searchParams.has("v")) {
      id = url.searchParams.get("v");
    } else if (pathParts[0] === "embed") {
      id = pathParts[1];
    } else if (pathParts[0] === "live") {
      // For live URLs, extract the stream ID
      id = pathParts[1];
    } else if (pathParts[0] === "shorts") {
      id = pathParts[1];
    } else if (pathParts[0] === "watch" && url.searchParams.has("v")) {
      id = url.searchParams.get("v");
    }
  }

  if (!id) {
    return null;
  }

  const start = parseStartTime(url.searchParams);
  const playlist = url.searchParams.get("list");

  const embedUrl = new URL(`https://www.youtube.com/embed/${id}`);
  if (start) {
    embedUrl.searchParams.set("start", start);
  }
  if (playlist) {
    embedUrl.searchParams.set("list", playlist);
  }

  return embedUrl.toString();
}

function parseStartTime(searchParams) {
  if (searchParams.has("start")) {
    const start = Number.parseInt(searchParams.get("start"), 10);
    if (!Number.isNaN(start) && start >= 0) {
      return start;
    }
  }

  if (searchParams.has("t")) {
    const rawTime = searchParams.get("t");
    const numeric = Number.parseInt(rawTime, 10);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }

    const timeMatch = rawTime.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
    if (timeMatch) {
      const [, hours, minutes, seconds] = timeMatch;
      const totalSeconds =
        (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0);
      if (totalSeconds > 0) {
        return totalSeconds;
      }
    }
  }

  return null;
}

// Export helper functions for use in HTML transforms
module.exports.buildEmbedUrl = buildEmbedUrl;
module.exports.createEmbedHtml = createEmbedHtml;
module.exports.isYoutubeUrl = isYoutubeUrl;
