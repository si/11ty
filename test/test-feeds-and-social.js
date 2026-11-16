const assert = require("assert").strict;
const { JSDOM } = require("jsdom");
const { readFileSync, existsSync } = require("fs");
const metadata = require("../_data/metadata.json");
const { featuredImage } = require("../_11ty/featured-image.js");

describe("featured image", () => {
  const LOCAL = "/img/assets/2026/11/beatles-night-out-tower-ballroom-poster.jpg";

  it("prefers image front matter", () => {
    const image = featuredImage({
      data: { image: metadata.defaultImage.url, title: "A post" },
      templateContent: `<img src="${LOCAL}" alt="B">`,
    });
    assert.equal(image.url, metadata.defaultImage.url);
    assert.equal(image.type, "image/png");
    assert.equal(image.alt, "A post");
  });

  it("falls back to the first usable image in the body", () => {
    const image = featuredImage({
      data: { title: "A post" },
      templateContent:
        '<img src="/img/si-disc.svg"><img src="images/gone.jpg">' +
        '<img src="/img/favicon/favicon-32x32.png">' +
        '<img src="https://ifttt.com/images/no_image_card.png">' +
        `<img alt="Say &quot;hi&quot;" src="${LOCAL}">`,
    });
    assert.equal(image.url, LOCAL);
    assert.equal(image.alt, 'Say "hi"');
  });

  it("reads the size of local images", () => {
    const image = featuredImage({ data: { image: metadata.defaultImage.url } });
    assert.equal(image.width, metadata.defaultImage.width);
    assert.equal(image.height, metadata.defaultImage.height);
  });

  it("returns null where there is no image", () => {
    assert.equal(featuredImage({ data: {}, templateContent: "<p>Hi</p>" }), null);
  });
});

describe("check build output for feeds and social tags", () => {
  const ATOM = "_site/feed/feed.xml";
  const MICRO = "_site/micro/feed/feed.xml";
  const JSON_FEED = "_site/feed/feed.json";
  const POST = "_site/blog/asos/index.html";

  if (![ATOM, MICRO, JSON_FEED, POST].every((file) => existsSync(file))) {
    it("WARNING skipping tests because the build output does not exist", () => {});
    return;
  }

  const parseXml = (file) =>
    new JSDOM(readFileSync(file, "utf8"), { contentType: "text/xml" }).window
      .document;

  for (const file of [ATOM, MICRO]) {
    it(`${file} is well formed, capped and complete`, () => {
      const doc = parseXml(file);
      assert.equal(doc.querySelector("parsererror"), null);
      const entries = [...doc.querySelectorAll("entry")];
      assert(entries.length > 0);
      assert(entries.length <= metadata.feed.limit);
      assert.equal(doc.querySelector("author > email"), null);
      for (const entry of entries) {
        for (const name of ["title", "id", "published", "updated", "summary"]) {
          assert(entry.querySelector(name), `entry is missing <${name}>`);
        }
      }
    });
  }

  it("micro feed entries with an image have an absolute enclosure", () => {
    const hrefs = [
      ...parseXml(MICRO).querySelectorAll("entry > link[rel='enclosure']"),
    ].map((link) => link.getAttribute("href"));
    assert(hrefs.length > 0);
    for (const href of hrefs) assert(href.startsWith(metadata.url + "/"));
  });

  it("JSON feed is valid JSON Feed 1.1", () => {
    const feed = JSON.parse(readFileSync(JSON_FEED, "utf8"));
    assert.equal(feed.version, "https://jsonfeed.org/version/1.1");
    assert.equal(feed.authors[0].name, metadata.author.name);
    assert(feed.items.length > 0 && feed.items.length <= metadata.feed.limit);
    for (const item of feed.items) {
      assert(item.id && item.url && item.date_published);
      assert(Array.isArray(item.tags));
      assert(!/&(quot|amp|#39);/.test(item.title), `escaped title: ${item.title}`);
    }
  });

  it("a post has Open Graph and feed discovery tags", () => {
    const doc = new JSDOM(readFileSync(POST, "utf8")).window.document;
    const meta = (property) => {
      const element = doc.querySelector(`meta[property='${property}']`);
      assert(element, `Expected to find ${property}`);
      return element.getAttribute("content");
    };
    assert.equal(meta("og:url"), metadata.url + "/blog/asos/");
    assert.equal(meta("og:type"), "article");
    assert.equal(meta("og:site_name"), metadata.title);
    assert.equal(meta("og:locale"), metadata.locale);
    assert(meta("og:image").startsWith(metadata.url + "/"));
    assert(meta("article:published_time"));
    assert.equal(
      doc.querySelector("meta[name='twitter:site']").getAttribute("content"),
      "@" + metadata.author.twitterHandle
    );
    assert.equal(doc.querySelectorAll("link[rel='alternate']").length, 3);
  });
});
