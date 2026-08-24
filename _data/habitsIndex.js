// Metadata-only list of habits for the static /habits/ shell's fallback
// content (card grid with name/icon/description, no counts or "recent
// activity" - those need live entries, which `src/habits-app.js` fetches
// client-side from the Worker API and renders into the page's mount point).
const { loadHabitConfigs } = require("../_11ty/habits-data.js");

module.exports = function () {
  return { list: loadHabitConfigs() };
};
