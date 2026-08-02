/**
 * Month-by-month, day-merged view of the Duolingo habit data - the raw
 * per-lesson log (_data/habits/duolingo.json) is too large to list
 * directly, so this rolls it up into one row per day (total duration,
 * accuracy range/average, best combo) grouped by month, for the
 * /habits/duolingo/<year>/<month>/ pagination and the month-on-month
 * totals table on /habits/duolingo/.
 */

const { loadHabits } = require("../_11ty/habits-data.js");

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// One row per day/month: total duration, accuracy range + average, best
// combo - deliberately not XP (unreliable in the source data) and not a
// per-lesson breakdown (too much to list).
function aggregate(entries) {
  const durations = entries.map((e) => Number(e.durationSeconds) || 0);
  const accuracies = entries
    .map((e) => e.accuracy)
    .filter((a) => a !== null && a !== undefined);
  const combos = entries
    .map((e) => e.combo)
    .filter((c) => c !== null && c !== undefined);

  return {
    sessionCount: entries.length,
    totalDurationSeconds: durations.reduce((sum, v) => sum + v, 0),
    accuracyMin: accuracies.length ? Math.min(...accuracies) : null,
    accuracyMax: accuracies.length ? Math.max(...accuracies) : null,
    accuracyAvg: accuracies.length ? Math.round(average(accuracies)) : null,
    bestCombo: combos.length ? Math.max(...combos) : null,
  };
}

module.exports = function () {
  const habit = loadHabits().find((h) => h.id === "duolingo");
  if (!habit) return [];

  const byDay = new Map();
  const byMonth = new Map();
  for (const entry of habit.entries) {
    const dayKey = entry.date;
    const monthKey = entry.date.slice(0, 7); // YYYY-MM
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey).push(entry);
    if (!byMonth.has(monthKey)) byMonth.set(monthKey, []);
    byMonth.get(monthKey).push(entry);
  }

  const months = [...byMonth.keys()].sort().map((key) => {
    const [year, month] = key.split("-").map(Number);
    const dayKeys = [...new Set(byMonth.get(key).map((e) => e.date))].sort();
    const days = dayKeys.map((date) => ({ date, ...aggregate(byDay.get(date)) }));

    return {
      key,
      year,
      month,
      monthPadded: String(month).padStart(2, "0"),
      label: `${MONTH_NAMES[month - 1]} ${year}`,
      url: `/habits/duolingo/${year}/${String(month).padStart(2, "0")}/`,
      days,
      totals: aggregate(byMonth.get(key)),
    };
  });

  months.forEach((m, i) => {
    m.prev = i > 0 ? { label: months[i - 1].label, url: months[i - 1].url } : null;
    m.next = i < months.length - 1 ? { label: months[i + 1].label, url: months[i + 1].url } : null;
  });

  return months;
};
