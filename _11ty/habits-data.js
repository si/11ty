/**
 * Shared, framework-free helpers for the /habits/ section.
 *
 * Used both from `_data/habitsIndex.js` (plain Eleventy global data, no
 * `eleventyConfig` available) and from `_11ty/habits.js` (the Eleventy
 * plugin that exposes filters/shortcodes built on the same data).
 *
 * Each habit is a JSON file in `_data/habits/<slug>.json` describing a
 * `primaryMetric` (and optional `secondaryMetric`) plus a list of dated
 * `entries`. New habits (e.g. fitness) just add another JSON file with
 * whatever metric keys/units make sense - nothing else here changes.
 */

const fs = require("fs");
const path = require("path");
const { DateTime } = require("luxon");

const HABITS_DIR = path.join(__dirname, "..", "_data", "habits");

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatMetricValue(value, metric) {
  if (value === undefined || value === null || !metric) return "-";
  switch (metric.unit) {
    case "duration":
      return formatDuration(value);
    case "percent":
      return `${Math.round(value)}%`;
    case "count":
      return `${value}${metric.suffix ? ` ${metric.suffix}` : ""}`;
    default:
      return `${value}${metric.suffix ? ` ${metric.suffix}` : ""}`;
  }
}

// ISO "YYYY-MM-DD" -> "1 Aug 2026" (habit entries store plain date strings,
// not JS Date objects, so this is distinct from the site's `readableDate`).
function formatIsoDate(dateStr, format = "d LLL yyyy") {
  const dt = DateTime.fromISO(dateStr, { zone: "utc" });
  return dt.isValid ? dt.toFormat(format) : dateStr;
}

// Naive English singular/plural for a metric label given a count, e.g.
// (1, "Mistakes") -> "mistake", (2, "Mistakes") -> "mistakes".
function pluralizeLabel(count, label) {
  const lower = String(label).toLowerCase();
  if (Number(count) === 1 && lower.endsWith("s")) return lower.slice(0, -1);
  return lower;
}

function sortKey(entry) {
  return `${entry.date || ""}T${entry.time || "00:00"}`;
}

function pickBest(values, goal) {
  if (!values.length) return null;
  return goal === "higher" ? Math.max(...values) : Math.min(...values);
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sum(values) {
  return values.reduce((total, v) => total + v, 0);
}

// Optional per-habit `extraStats` entries (beyond primary/secondary metric)
// - e.g. Duolingo's accuracy, which isn't the thing charted but is still
// worth a headline number. Missing values are skipped rather than treated
// as zero, so a handful of ungraded sessions doesn't drag the average down.
function computeExtraStats(entries, specs) {
  if (!specs || !specs.length) return [];
  return specs.map((spec) => {
    const values = entries
      .map((e) => e[spec.key])
      .filter((v) => v !== undefined && v !== null)
      .map(Number);
    const value = spec.agg === "total" ? sum(values) : average(values);
    return { ...spec, value: values.length ? value : null };
  });
}

// Most recent entry (entries must already be date-ascending) that has a
// non-null value for `key` - for sparsely-recorded fields like Duolingo's
// level, which the export only captures some of the time.
function lastKnownValue(entries, key) {
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (entries[i][key] !== undefined && entries[i][key] !== null) {
      return entries[i];
    }
  }
  return null;
}

function loadHabits() {
  if (!fs.existsSync(HABITS_DIR)) return [];

  return fs
    .readdirSync(HABITS_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const habit = JSON.parse(
        fs.readFileSync(path.join(HABITS_DIR, file), "utf-8")
      );
      const entries = [...(habit.entries || [])].sort((a, b) =>
        sortKey(a).localeCompare(sortKey(b))
      );
      const primaryValues = habit.primaryMetric
        ? entries.map((e) => Number(e[habit.primaryMetric.key]) || 0)
        : [];
      const secondaryValues = habit.secondaryMetric
        ? entries.map((e) => Number(e[habit.secondaryMetric.key]) || 0)
        : [];

      return {
        ...habit,
        url: `/habits/${habit.id}/`,
        entries,
        sessionCount: entries.length,
        latest: entries.length ? entries[entries.length - 1] : null,
        stats: {
          best: habit.primaryMetric
            ? pickBest(primaryValues, habit.primaryMetric.goal)
            : null,
          average: habit.primaryMetric ? average(primaryValues) : null,
          primaryTotal: habit.primaryMetric ? sum(primaryValues) : null,
          secondaryTotal: sum(secondaryValues),
          extra: computeExtraStats(entries, habit.extraStats),
        },
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildTimeline(habits, limit = 20) {
  const timeline = [];
  for (const habit of habits) {
    for (const entry of habit.entries) {
      timeline.push({
        habitId: habit.id,
        habitName: habit.name,
        icon: habit.icon,
        url: habit.url,
        date: entry.date,
        time: entry.time,
        primaryDisplay: habit.primaryMetric
          ? formatMetricValue(entry[habit.primaryMetric.key], habit.primaryMetric)
          : null,
        secondaryDisplay: habit.secondaryMetric
          ? formatMetricValue(entry[habit.secondaryMetric.key], habit.secondaryMetric)
          : null,
        secondaryLabel: habit.secondaryMetric
          ? pluralizeLabel(entry[habit.secondaryMetric.key], habit.secondaryMetric.label)
          : null,
      });
    }
  }
  timeline.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  return limit ? timeline.slice(0, limit) : timeline;
}

module.exports = {
  loadHabits,
  buildTimeline,
  formatDuration,
  formatMetricValue,
  formatIsoDate,
  pluralizeLabel,
  pickBest,
  average,
  sum,
  lastKnownValue,
};
