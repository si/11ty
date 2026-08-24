/**
 * Node-only half of the /habits/ machinery: reads the per-habit
 * schema-config JSON files off disk (`_data/habits/<slug>.json`). These
 * files hold only metadata now - `id`, `name`, `icon`, `source`,
 * `description`, `primaryMetric`, `secondaryMetric`, `extraStats`, and any
 * habit-specific extras (e.g. solitaire's `personalBest`) - plus a
 * `sheetId` pointing at the Google Sheet that holds this habit's actual
 * entries. Entries themselves no longer live in git (see
 * docs/habit-runtime-render-idea.md's successor design): they're fetched at
 * runtime from the Cloudflare Worker (`worker/`), which reads the same
 * schema shape from the Sheet's header row and computes stats using the
 * shared math in `habits-shared.js`.
 *
 * Used both from `_data/habitsIndex.js` (plain Eleventy global data, no
 * `eleventyConfig` available) and from `_11ty/habits.js` (the Eleventy
 * plugin that exposes filters built on the same data). Both only need
 * metadata for the static shell - stats/entries/charts are rendered
 * client-side now.
 *
 * New habits (e.g. fitness, MapTap) just add another JSON file with
 * whatever metric keys/units make sense - nothing else here changes.
 */

const fs = require("fs");
const path = require("path");

const HABITS_DIR = path.join(__dirname, "..", "_data", "habits");

function loadHabitConfigs() {
  if (!fs.existsSync(HABITS_DIR)) return [];

  return fs
    .readdirSync(HABITS_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const config = JSON.parse(
        fs.readFileSync(path.join(HABITS_DIR, file), "utf-8")
      );
      return { ...config, url: `/habits/${config.id}/` };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = {
  loadHabitConfigs,
};
