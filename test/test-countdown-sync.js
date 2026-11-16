const assert = require("assert").strict;
const fs = require("fs");
const path = require("path");
const {
  parseDaysToGo,
  parseFeed,
  mergeEpisodes,
  serialize,
} = require("../scripts/countdown-sync.js");

const episode = (daysToGo, title, youtubeId) => ({
  daysToGo,
  title,
  youtubeId,
  url: `https://www.youtube.com/watch?v=${youtubeId}`,
});

const feed = (...entries) =>
  `<feed>${entries
    .map(([id, title]) => `<entry><id>yt:video:${id}</id><yt:videoId>${id}</yt:videoId><title>${title}</title><published>2026-01-01T00:00:00+00:00</published></entry>`)
    .join("")}</feed>`;

describe("countdown sync", () => {
  describe("parseDaysToGo", () => {
    it("reads the number from countdown titles", () => {
      assert.equal(parseDaysToGo("66 days to go… to use the right delivery model"), 66);
      assert.equal(parseDaysToGo("DAY 9 - 9 Days To Go"), 9);
    });

    it("handles the singular on the final day", () => {
      assert.equal(parseDaysToGo("1 day to go… nearly there"), 1);
    });

    it("returns null for other videos", () => {
      assert.equal(parseDaysToGo("House Finesse 100 mix"), null);
      assert.equal(parseDaysToGo(""), null);
    });
  });

  describe("parseFeed", () => {
    it("extracts ids and decodes entities in titles", () => {
      const parsed = parseFeed(feed(["abc", "65 days to go… R&amp;D &#39;quoted&#39;"]));
      assert.deepEqual(parsed, [{ youtubeId: "abc", title: "65 days to go… R&D 'quoted'" }]);
    });
  });

  describe("mergeEpisodes", () => {
    const existing = [episode(67, "67 days to go… b", "b"), episode(66, "66 days to go… old", "a")];

    it("adds new episodes, ignores other videos, and sorts highest first", () => {
      const merged = mergeEpisodes(existing, [
        { youtubeId: "c", title: "65 days to go… new" },
        { youtubeId: "x", title: "Unrelated upload" },
      ]);
      assert.deepEqual(merged.map((e) => e.youtubeId), ["b", "a", "c"]);
      assert.equal(merged[2].url, "https://www.youtube.com/watch?v=c");
    });

    it("refreshes a renamed title but never deletes entries missing from the feed", () => {
      const merged = mergeEpisodes(existing, [{ youtubeId: "a", title: "66 days to go… renamed" }]);
      assert.equal(merged.length, 2);
      assert.equal(merged.find((e) => e.youtubeId === "a").title, "66 days to go… renamed");
      assert.ok(merged.find((e) => e.youtubeId === "b"));
    });

    it("is a no-op when the feed matches, and does not mutate its input", () => {
      const before = JSON.stringify(existing);
      const merged = mergeEpisodes(existing, parseFeed(feed(["a", "66 days to go… old"])));
      assert.equal(serialize(merged), serialize(existing));
      assert.equal(JSON.stringify(existing), before);
    });
  });

  describe("data file", () => {
    it("round-trips byte for byte and is sorted by daysToGo descending", () => {
      const file = path.join(__dirname, "..", "_data", "countdownVideos.json");
      const raw = fs.readFileSync(file, "utf8");
      const data = JSON.parse(raw);
      assert.equal(serialize(data), raw);
      assert.deepEqual(data.map((e) => e.daysToGo), data.map((e) => e.daysToGo).sort((a, b) => b - a));
    });
  });
});
