const { loadHabits, buildTimeline } = require("../_11ty/habits-data.js");

module.exports = function () {
  const list = loadHabits();
  return {
    list,
    timeline: buildTimeline(list),
  };
};
