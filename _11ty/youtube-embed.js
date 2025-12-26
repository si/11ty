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

module.exports = function youtubeEmbed(md) {
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

      const href = getYoutubeHref(token.children);
      if (!href) {
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

  if (
    children.length !== 3 ||
    children[0].type !== "link_open" ||
    children[1].type !== "text" ||
    children[2].type !== "link_close"
  ) {
    return null;
  }

  const hrefAttr = linkOpenTokens[0].attrs.find((attr) => attr[0] === "href");
  if (!hrefAttr) {
    return null;
  }

  return hrefAttr[1];
}

function createEmbedHtml(href) {
  const embedUrl = buildEmbedUrl(href);
  if (!embedUrl) {
    return null;
  }

  return `<div class="youtube-embed"><iframe src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
}

function buildEmbedUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
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
    } else if (pathParts[0] === "embed" || pathParts[0] === "live" || pathParts[0] === "shorts") {
      id = pathParts[1];
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
