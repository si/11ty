/**
 * Eleventy plugin for the /habits/ section: filters for formatting habit
 * metrics, plus a `getHabit` filter for pulling one habit's schema-config
 * (metadata only - no entries, see `habits-data.js`) into the static shell
 * templates. Stats, the trend chart, and entry tables are rendered
 * client-side now (`src/habits-app.js`), fetching live data from the
 * Cloudflare Worker read API - see `docs/habit-runtime-render-idea.md`'s
 * successor design for why.
 */

const { loadHabitConfigs } = require("./habits-data.js");
const {
  formatDuration,
  formatMetricValue,
  formatIsoDate,
  pluralizeLabel,
} = require("./habits-shared.js");

module.exports = {
  initArguments: {},
  configFunction: (eleventyConfig) => {
    eleventyConfig.addFilter("formatDuration", formatDuration);
    eleventyConfig.addFilter("formatMetric", formatMetricValue);
    eleventyConfig.addFilter("readableIsoDate", (dateStr) => formatIsoDate(dateStr));
    eleventyConfig.addFilter("pluralizeLabel", pluralizeLabel);
    eleventyConfig.addFilter("getHabit", (id) =>
      loadHabitConfigs().find((habit) => habit.id === id) || null
    );
  },
};
