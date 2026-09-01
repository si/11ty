/**
 * Copyright (c) 2020 Google Inc
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

/**
 * Copyright (c) 2018 Zach Leatherman
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

const { DateTime } = require("luxon");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const hasha = require("hasha");
const touch = require("touch");
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const execFile = promisify(require("child_process").execFile);
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const localImages = require("./third_party/eleventy-plugin-local-images/.eleventy.js");
const CleanCSS = require("clean-css");
const GA_ID = require("./_data/metadata.json").googleAnalyticsId;
const youtubeEmbed = require("./_11ty/youtube-embed.js");

// /tags/* pages (one per tag, ~900 of them) are only needed on the deployed
// site. Building them locally is most of what pushes a small content-only
// build past 2 minutes, so we skip generating them outside of CI. Netlify and
// GitHub Actions both set CI=true automatically, so production builds are
// unaffected. Force them locally with `ELEVENTY_BUILD_TAGS=true` if you need
// to check a tag page before pushing.
const BUILD_TAG_PAGES =
  Boolean(process.env.CI) || process.env.ELEVENTY_BUILD_TAGS === "true";

module.exports = async function (eleventyConfig) {
  // eleventy-plugin-rss is ESM-only as of 3.x. On Node 18/20, require()-ing
  // an ES module throws ERR_REQUIRE_ESM - only Node 22+'s newer require(esm)
  // support papers over this, which this repo can't rely on since it's
  // pinned to Node 18.x (.nvmrc, engines.node). A dynamic import() works on
  // every supported Node version, so use that instead of require().
  const pluginRss = (await import("@11ty/eleventy-plugin-rss")).default;
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);

  eleventyConfig.addPlugin(localImages.configFunction, {
    distPath: "_site",
    assetPath: "/img/remote",
    selector:
      "img,amp-img,amp-video,meta[property='og:image'],meta[name='twitter:image'],amp-story",
    verbose: false,
  });

  eleventyConfig.addPlugin(require("./_11ty/img-dim.js"));
  eleventyConfig.addPlugin(require("./_11ty/json-ld.js"));
  eleventyConfig.addPlugin(require("./_11ty/youtube-html-transform.js"));
  eleventyConfig.addPlugin(require("./_11ty/optimize-html.js"));
  eleventyConfig.addPlugin(require("./_11ty/apply-csp.js"));
  eleventyConfig.addPlugin(require("./_11ty/habits.js"));
  eleventyConfig.setDataDeepMerge(true);
  eleventyConfig.addLayoutAlias("post", "layouts/post.njk");
  eleventyConfig.addNunjucksAsyncFilter(
    "addHash",
    function (absolutePath, callback) {
      const resolvedPath = path.join(".", absolutePath);
      if (!fs.existsSync(resolvedPath)) {
        // Avoid hard failure for missing assets; keep the original URL.
        callback(null, absolutePath);
        return;
      }
      readFile(resolvedPath, {
        encoding: "utf-8",
      })
        .then((content) => {
          return hasha.async(content);
        })
        .then((hash) => {
          callback(null, `${absolutePath}?hash=${hash.substr(0, 10)}`);
        })
        .catch((error) => {
          callback(
            new Error(`Failed to addHash to '${absolutePath}': ${error}`)
          );
        });
    }
  );

  async function lastModifiedDate(filename) {
    try {
      const { stdout } = await execFile("git", [
        "log",
        "-1",
        "--format=%cd",
        filename,
      ]);
      return new Date(stdout);
    } catch (e) {
      console.error(e.message);
      // Fallback to stat if git isn't working.
      const stats = await stat(filename);
      return stats.mtime; // Date
    }
  }
  // Cache the lastModifiedDate call because shelling out to git is expensive.
  // This means the lastModifiedDate will never change per single eleventy invocation.
  const lastModifiedDateCache = new Map();
  eleventyConfig.addNunjucksAsyncFilter(
    "lastModifiedDate",
    function (filename, callback) {
      const call = (result) => {
        result.then((date) => callback(null, date));
        result.catch((error) => callback(error));
      };
      const cached = lastModifiedDateCache.get(filename);
      if (cached) {
        return call(cached);
      }
      const promise = lastModifiedDate(filename);
      lastModifiedDateCache.set(filename, promise);
      call(promise);
    }
  );

  eleventyConfig.addFilter("encodeURIComponent", function (str) {
    return encodeURIComponent(str);
  });

  eleventyConfig.addFilter("cssmin", function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addFilter("initials", function (name) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0].toUpperCase())
      .join("");
  });

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  eleventyConfig.addFilter("longPublishedDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLLL yyyy"
    );
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("datePath", (dateObj) => {
    const dt = DateTime.fromJSDate(dateObj, { zone: "utc" });
    return dt.toFormat("yyyy/MM");
  });

  eleventyConfig.addFilter("sitemapDateTimeString", (dateObj) => {
    const dt = DateTime.fromJSDate(dateObj, { zone: "utc" });
    if (!dt.isValid) {
      return "";
    }
    return dt.toISO();
  });

  eleventyConfig.addFilter("toRoman", (num) => {
    const numerals = [
      [1000, "M"],
      [900, "CM"],
      [500, "D"],
      [400, "CD"],
      [100, "C"],
      [90, "XC"],
      [50, "L"],
      [40, "XL"],
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"],
    ];
    let result = "";
    for (const [value, numeral] of numerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByTag("posts");
  });
  eleventyConfig.addCollection("podcast", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("posts")
      .filter((post) => post.data?.enclosure?.url);
  });
  eleventyConfig.addCollection("postDirectories", function (collectionApi) {
    const posts = collectionApi.getFilteredByTag("posts");
    const counts = posts.reduce((acc, post) => {
      const inputPath = post.inputPath || "";
      const normalized = inputPath.replace(/^[.\\/]*posts[\\/]/, "");
      const directory = normalized.split(/[/\\]/)[0];
      if (directory) {
        acc[directory] = (acc[directory] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  eleventyConfig.addCollection("homeRecentPosts", function (collectionApi) {
    const allowedDirectories = new Set(["aside", "blog", "micro", "weeknotes", "portfolio"]);
    const posts = collectionApi.getFilteredByTag("posts");

    return posts
      .filter((post) => {
        const inputPath = post.inputPath || "";
        const normalized = inputPath.replace(/^[.\\/]*posts[\\/]/, "");
        const directory = normalized.split(/[/\\]/)[0];
        return allowedDirectories.has(directory);
      })
      .sort((a, b) => a.date - b.date)
      .slice(-5);
  });
  eleventyConfig.addCollection("blogPosts", function (collectionApi) {
    return collectionApi.getFilteredByTag("posts").filter((post) => {
      const inputPath = post.inputPath || "";
      const normalized = inputPath.replace(/^[.\\/]*posts[\\/]/, "");
      const directory = normalized.split(/[/\\]/)[0];
      return directory === "blog";
    });
  });
  eleventyConfig.addCollection("asidePosts", function (collectionApi) {
    return collectionApi.getFilteredByTag("posts").filter((post) => {
      const inputPath = post.inputPath || "";
      const normalized = inputPath.replace(/^[.\\/]*posts[\\/]/, "");
      const directory = normalized.split(/[/\\]/)[0];
      return directory === "aside";
    });
  });
  eleventyConfig.addCollection("portfolioPosts", function (collectionApi) {
    return collectionApi.getFilteredByTag("posts").filter((post) => {
      const inputPath = post.inputPath || "";
      const normalized = inputPath.replace(/^[.\\/]*posts[\\/]/, "");
      const directory = normalized.split(/[/\\]/)[0];
      return directory === "portfolio";
    });
  });
  eleventyConfig.addCollection("microPosts", function (collectionApi) {
    return collectionApi.getFilteredByTag("posts").filter((post) => {
      const inputPath = post.inputPath || "";
      const normalized = inputPath.replace(/^[.\\/]*posts[\\/]/, "");
      const directory = normalized.split(/[/\\]/)[0];
      return directory === "micro";
    });
  });
  eleventyConfig.addCollection("tagList", function (collectionApi) {
    if (!BUILD_TAG_PAGES) {
      return [];
    }
    return require("./_11ty/getTagList")(collectionApi);
  });
  eleventyConfig.addGlobalData("buildTagPages", BUILD_TAG_PAGES);
  eleventyConfig.addGlobalData("buildYear", () => new Date().getFullYear());
  // Copy migrated assets from src/assets to /assets in the built site.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("css");
  // We need to copy cached.js only if GA is used
  eleventyConfig.addPassthroughCopy(GA_ID ? "js" : "js/*[!cached].*");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("_headers");
  eleventyConfig.addPassthroughCopy("_redirects");

  // We need to rebuild upon JS change to update the CSP.
  eleventyConfig.addWatchTarget("./js/");
  // We need to rebuild on CSS change to inline it.
  eleventyConfig.addWatchTarget("./css/");
  // Unfortunately this means .eleventyignore needs to be maintained redundantly.
  // But without this the JS build artefacts doesn't trigger a build.
  eleventyConfig.setUseGitIgnore(false);

  /* Markdown Overrides */
  // Configure markdown library with plugins
  // This applies globally to ALL markdown files (blog, portfolio, aside, weeknotes, etc.)
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  }).use(markdownItAnchor, {
    permalink: true,
    permalinkClass: "direct-link",
    permalinkSymbol: "#",
  })
    .use(youtubeEmbed); // Automatically converts YouTube URLs to accessible embeds in all posts
  eleventyConfig.setLibrary("md", markdownLibrary);

  // Dev server: eleventy-dev-server (replaces Browser Sync as of Eleventy 2.0)
  // already serves _site/404.html without a redirect for any unmatched path
  // by default (see its eleventyProjectMiddleware), so no custom
  // setServerOptions/middleware is needed here to reproduce the old
  // Browser Sync setBrowserSyncConfig behavior.

  // After the build touch any file in the test directory to do a test run.
  eleventyConfig.on("afterBuild", async () => {
    const files = await readdir("test");
    for (const file of files) {
      touch(`test/${file}`);
      break;
    }
  });

  return {
    templateFormats: ["md", "njk", "html", "liquid"],

    // If your site lives in a different subdirectory, change this.
    // Leading or trailing slashes are all normalized away, so don’t worry about those.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.io/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`
    // pathPrefix: "/",

    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    // These are all optional, defaults are shown:
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      // Warning hardcoded throughout repo. Find and replace is your friend :)
      output: "_site",
    },
  };
};
