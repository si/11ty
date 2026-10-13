/**
 * View model for /countdown/. The raw episodes live in `countdownVideos.json`
 * (kept up to date by `scripts/countdown-sync.js`); this sorts them by
 * `daysToGo` (never by YouTube publish date, which got scrambled when the
 * videos were bulk-switched from unlisted to public) and works out each
 * episode's recording date by counting back from the last day.
 */

const episodes = require("./countdownVideos.json");

const LAST_DAY = "2026-12-18";
const DAY_MS = 24 * 60 * 60 * 1000;

function recordedOn(daysToGo) {
  const date = new Date(Date.parse(`${LAST_DAY}T00:00:00Z`) - daysToGo * DAY_MS);
  return date.toISOString().slice(0, 10);
}

module.exports = () => {
  // Highest first: 81 was recorded first, so this is recording order.
  const list = [...episodes]
    .sort((a, b) => b.daysToGo - a.daysToGo)
    .map((episode) => ({
      ...episode,
      recorded: recordedOn(episode.daysToGo),
      thumbnail: `https://i.ytimg.com/vi/${episode.youtubeId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${episode.youtubeId}`,
    }));

  return {
    lastDay: LAST_DAY,
    list,
    // The most recently recorded episode has the fewest days to go.
    latest: list[list.length - 1],
  };
};
