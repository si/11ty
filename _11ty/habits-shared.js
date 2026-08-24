/**
 * Pure, dependency-free habit math and rendering helpers - no `fs`, no DOM,
 * no Eleventy/Worker/browser-specific APIs. This is the single source of
 * truth for stat aggregation, formatting, and the SVG trend chart, shared by
 * three consumers that each load it differently:
 *
 *  - `_11ty/habits-data.js` / `_11ty/habits.js` (Node, `require()`) - builds
 *    the static page shells at Eleventy build time.
 *  - `worker/src/index.js` (Cloudflare Worker, bundled by esbuild via
 *    Wrangler, which interops `require()`/`module.exports` into its ESM
 *    output) - computes stats server-side for the read API.
 *  - `src/habits-app.js` (browser, bundled by Rollup with
 *    @rollup/plugin-commonjs) - renders stat tiles/chart/table client-side.
 *
 * New habits (e.g. fitness, MapTap) just add another schema-config JSON with
 * whatever metric keys/units make sense - nothing here changes.
 */

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
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

// ISO "YYYY-MM-DD" -> "1 Aug 2026". Deliberately not using Luxon here (the
// Node-only build already has it, but the Worker/browser consumers
// shouldn't need to bundle it just for date formatting).
const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatIsoDate(dateStr, format = "d LLL yyyy") {
  if (!dateStr) return dateStr;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return dateStr;
  const [, year, month, day] = match;
  const monthName = MONTH_NAMES_SHORT[Number(month) - 1];
  const dayNum = String(Number(day));
  if (format === "d LLL") return `${dayNum} ${monthName}`;
  return `${dayNum} ${monthName} ${year}`;
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

// Sorts entries date/time-ascending and computes the same `stats` shape the
// habit pages have always rendered (best/average/totals/extra), given a
// habit's schema config (primaryMetric/secondaryMetric/extraStats) and its
// raw entries (from a Sheet row read, in this new model).
function computeHabitStats(habitConfig, rawEntries) {
  const entries = [...(rawEntries || [])].sort((a, b) =>
    sortKey(a).localeCompare(sortKey(b))
  );
  const primaryValues = habitConfig.primaryMetric
    ? entries.map((e) => Number(e[habitConfig.primaryMetric.key]) || 0)
    : [];
  const secondaryValues = habitConfig.secondaryMetric
    ? entries.map((e) => Number(e[habitConfig.secondaryMetric.key]) || 0)
    : [];

  return {
    entries,
    sessionCount: entries.length,
    latest: entries.length ? entries[entries.length - 1] : null,
    stats: {
      best: habitConfig.primaryMetric
        ? pickBest(primaryValues, habitConfig.primaryMetric.goal)
        : null,
      average: habitConfig.primaryMetric ? average(primaryValues) : null,
      primaryTotal: habitConfig.primaryMetric ? sum(primaryValues) : null,
      secondaryTotal: sum(secondaryValues),
      secondaryBest: habitConfig.secondaryMetric
        ? pickBest(secondaryValues, habitConfig.secondaryMetric.goal)
        : null,
      extra: computeExtraStats(entries, habitConfig.extraStats),
    },
  };
}

// Cross-habit "recent activity" feed - top N most recent entries across all
// habits, newest first. `habits` is an array of {config, entries, url}.
function buildTimeline(habits, limit = 20) {
  const timeline = [];
  for (const habit of habits) {
    const config = habit.config || habit;
    for (const entry of habit.entries) {
      timeline.push({
        habitId: config.id,
        habitName: config.name,
        icon: config.icon,
        url: habit.url || `/habits/${config.id}/`,
        date: entry.date,
        time: entry.time,
        primaryDisplay: config.primaryMetric
          ? formatMetricValue(entry[config.primaryMetric.key], config.primaryMetric)
          : null,
        secondaryDisplay: config.secondaryMetric
          ? formatMetricValue(entry[config.secondaryMetric.key], config.secondaryMetric)
          : null,
        secondaryLabel: config.secondaryMetric
          ? pluralizeLabel(entry[config.secondaryMetric.key], config.secondaryMetric.label)
          : null,
      });
    }
  }
  timeline.sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
  return limit ? timeline.slice(0, limit) : timeline;
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

// Round a value up to a "nice" axis maximum. Duration (seconds) gets
// human-scaled steps (30s/1m/5m) since powers-of-ten read oddly for times;
// everything else falls back to a standard 1/2/5/10 magnitude step.
function niceAxisMax(maxValue, unit) {
  const padded = Math.max(maxValue, 1) * 1.1;

  if (unit === "duration") {
    const step = padded <= 300 ? 30 : padded <= 1200 ? 60 : 300;
    return Math.ceil(padded / step) * step;
  }

  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  const residual = padded / magnitude;
  let niceResidual = 10;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  return niceResidual * magnitude;
}

/**
 * Renders a single-series trend line for `habit.primaryMetric` over
 * `habit.entries` (ascending order). Each point is coloured by whether that
 * session's `secondaryMetric` was zero ("clean") or not ("flagged") - e.g.
 * sudoku sessions with mistakes - as a status accent, not a second series.
 *
 * `habit` here is `{ ...schemaConfig, entries }` - the same shape both the
 * Eleventy `getHabit` filter (build time, when entries existed in git) and
 * the client app (runtime, entries fetched from the Worker) pass in.
 */
function habitTrendChart(habit, options = {}) {
  const entries = habit && habit.entries ? habit.entries : [];
  if (entries.length < 2 || !habit.primaryMetric) {
    return "";
  }

  const width = options.width || 640;
  const height = options.height || 220;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 28;
  const marginLeft = 50;
  const innerWidth = width - marginLeft - marginRight;
  const innerHeight = height - marginTop - marginBottom;

  const metric = habit.primaryMetric;
  const values = entries.map((e) => Number(e[metric.key]) || 0);
  const axisMax = niceAxisMax(Math.max(...values), metric.unit);

  const xStep = innerWidth / (entries.length - 1);
  const x = (i) => marginLeft + i * xStep;
  const y = (v) => marginTop + innerHeight - (v / axisMax) * innerHeight;
  const baselineY = y(0);

  const points = entries.map((entry, i) => ({
    entry,
    x: x(i),
    y: y(Number(entry[metric.key]) || 0),
    flagged: habit.secondaryMetric
      ? Number(entry[habit.secondaryMetric.key]) > 0
      : false,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    `M${points[0].x.toFixed(1)},${baselineY.toFixed(1)} ` +
    points.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
    ` L${points[points.length - 1].x.toFixed(1)},${baselineY.toFixed(1)} Z`;

  // Three evenly spaced horizontal gridlines (0 / half / max).
  const gridlines = [0, axisMax / 2, axisMax]
    .map((value) => {
      const gy = y(value).toFixed(1);
      return `
      <line class="habit-chart__gridline" x1="${marginLeft}" x2="${width - marginRight}" y1="${gy}" y2="${gy}"></line>
      <text class="habit-chart__axis-label habit-chart__axis-label--y" x="${marginLeft - 8}" y="${gy}" text-anchor="end" dominant-baseline="middle">${escapeXml(formatMetricValue(value, metric))}</text>`;
    })
    .join("");

  // Thin the x-axis date labels so they never collide, however many entries exist.
  const maxLabels = 6;
  const labelStep = Math.max(1, Math.ceil(entries.length / maxLabels));
  const xLabels = points
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i % labelStep === 0 || i === points.length - 1)
    .map(
      ({ p }) => `
      <text class="habit-chart__axis-label" x="${p.x.toFixed(1)}" y="${height - marginBottom + 16}" text-anchor="middle">${escapeXml(formatIsoDate(p.entry.date, "d LLL"))}</text>`
    )
    .join("");

  const markers = points
    .map(({ entry, x: cx, y: cy, flagged }) => {
      const secondaryValue = habit.secondaryMetric ? entry[habit.secondaryMetric.key] : null;
      const secondaryNote = habit.secondaryMetric
        ? `, ${formatMetricValue(secondaryValue, habit.secondaryMetric)} ${pluralizeLabel(secondaryValue, habit.secondaryMetric.label)}`
        : "";
      const title = `${formatIsoDate(entry.date)} — ${formatMetricValue(entry[metric.key], metric)}${secondaryNote}`;
      return `
      <circle class="habit-chart__marker ${flagged ? "habit-chart__marker--flagged" : "habit-chart__marker--clean"}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5"><title>${escapeXml(title)}</title></circle>`;
    })
    .join("");

  const last = points[points.length - 1];
  const endLabel = `
      <text class="habit-chart__end-label" x="${last.x.toFixed(1)}" y="${(last.y - 12).toFixed(1)}" text-anchor="middle">${escapeXml(formatMetricValue(last.entry[metric.key], metric))}</text>`;

  const ariaLabel = `${habit.name} ${metric.label.toLowerCase()} trend over ${entries.length} sessions, latest ${formatMetricValue(last.entry[metric.key], metric)}`;

  return `
    <svg class="habit-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(ariaLabel)}">
      <path class="habit-chart__area" d="${areaPath}"></path>
      ${gridlines}
      <path class="habit-chart__line" d="${linePath}"></path>
      ${markers}
      ${endLabel}
      ${xLabels}
    </svg>`;
}

module.exports = {
  formatDuration,
  formatMetricValue,
  formatIsoDate,
  pluralizeLabel,
  sortKey,
  pickBest,
  average,
  sum,
  computeExtraStats,
  lastKnownValue,
  computeHabitStats,
  buildTimeline,
  habitTrendChart,
  escapeXml,
};
