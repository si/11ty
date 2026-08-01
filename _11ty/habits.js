/**
 * Eleventy plugin for the /habits/ section: filters for formatting habit
 * metrics, and a shortcode that renders a dependency-free inline SVG trend
 * line for a single habit (build-time only, no client-side JS or chart
 * library so it works within the site's CSP).
 */

const {
  loadHabits,
  formatDuration,
  formatMetricValue,
  formatIsoDate,
  pluralizeLabel,
} = require("./habits-data.js");

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
  initArguments: {},
  configFunction: (eleventyConfig) => {
    eleventyConfig.addFilter("formatDuration", formatDuration);
    eleventyConfig.addFilter("formatMetric", formatMetricValue);
    eleventyConfig.addFilter("readableIsoDate", (dateStr) => formatIsoDate(dateStr));
    eleventyConfig.addFilter("pluralizeLabel", pluralizeLabel);
    eleventyConfig.addFilter("getHabit", (id) =>
      loadHabits().find((habit) => habit.id === id) || null
    );
    // Registered as a Nunjucks global (rather than addShortcode) so it can be
    // called as an expression - `{% set chart = habitTrendChart(habit) %}` -
    // and conditionally skipped when there isn't enough data for a trend.
    eleventyConfig.addNunjucksGlobal("habitTrendChart", habitTrendChart);
  },
};
