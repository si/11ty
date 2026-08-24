/**
 * Client-side app for /habits/* - mounted into the `#habit-app` div left by
 * the static shell templates (src/pages/habits/*.njk). Fetches live data
 * from the Cloudflare Worker read API (worker/) and renders stat tiles, the
 * trend chart, and a day-by-day table entirely at runtime, so a new logged
 * entry never needs a site rebuild.
 *
 * Also drives pushState-based navigation: clicking a day on a habit's
 * detail page updates the URL to /habits/<slug>/<date>/ and swaps in that
 * day's raw entries, without a full page reload - with back/forward and
 * direct-link support (the initial load parses location.pathname the same
 * way popstate does). Only bundled/loaded on /habits/* pages - see
 * _includes/layouts/base.njk.
 */

import {
  formatMetricValue,
  formatIsoDate,
  pluralizeLabel,
  habitTrendChart,
  escapeXml,
} from "../_11ty/habits-shared.js";

const API_BASE = "/api";

function groupByDay(entries) {
  const byDay = new Map();
  for (const entry of entries) {
    if (!byDay.has(entry.date)) byDay.set(entry.date, []);
    byDay.get(entry.date).push(entry);
  }
  return [...byDay.entries()]
    .map(([date, dayEntries]) => ({ date, entries: dayEntries }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function sumField(entries, key) {
  return entries.reduce((total, e) => total + (Number(e[key]) || 0), 0);
}

function fieldLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function statTile(label, value) {
  return `
    <div class="habit-stat">
      <span class="habit-stat__label">${escapeXml(label)}</span>
      <span class="habit-stat__value">${escapeXml(value)}</span>
    </div>`;
}

function renderStatTiles(config, data) {
  const tiles = [];
  tiles.push(statTile("Sessions logged", data.sessionCount));
  if (data.stats.best != null) {
    tiles.push(statTile(`Best ${config.primaryMetric.label.toLowerCase()}`, formatMetricValue(data.stats.best, config.primaryMetric)));
  }
  if (config.secondaryMetric && data.stats.secondaryBest != null) {
    tiles.push(statTile(`Best ${config.secondaryMetric.label.toLowerCase()}`, formatMetricValue(data.stats.secondaryBest, config.secondaryMetric)));
  }
  for (const stat of data.stats.extra) {
    if (stat.value != null) tiles.push(statTile(stat.label, formatMetricValue(stat.value, stat)));
  }
  return `<div class="habit-stats">${tiles.join("")}</div>`;
}

function renderChart(config, entries) {
  const chart = habitTrendChart({ ...config, entries });
  if (!chart) return "<p><em>Log a few more sessions to see a trend chart here.</em></p>";
  return `<figure class="habit-chart-figure">${chart}<figcaption>${escapeXml(config.primaryMetric.label)} per session.</figcaption></figure>`;
}

function renderDaysTable(config, days, activeDate) {
  const rows = days
    .map((day) => {
      const primary = config.primaryMetric
        ? formatMetricValue(sumField(day.entries, config.primaryMetric.key), config.primaryMetric)
        : "-";
      const secondary = config.secondaryMetric
        ? formatMetricValue(sumField(day.entries, config.secondaryMetric.key), config.secondaryMetric)
        : null;
      const activeClass = day.date === activeDate ? " habit-table__row--active" : "";
      return `
        <tr class="habit-table__row${activeClass}" data-date="${escapeXml(day.date)}" tabindex="0">
          <td><a href="/habits/${escapeXml(config.id)}/${escapeXml(day.date)}/" data-date-link="${escapeXml(day.date)}">${escapeXml(formatIsoDate(day.date))}</a></td>
          <td>${escapeXml(primary)}</td>
          ${config.secondaryMetric ? `<td>${escapeXml(secondary)}</td>` : ""}
          ${day.entries.length > 1 ? `<td>${day.entries.length} sessions</td>` : "<td></td>"}
        </tr>`;
    })
    .join("");

  return `
    <div class="habit-table-wrap">
      <table class="habit-table">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">${escapeXml(config.primaryMetric.label)}</th>
            ${config.secondaryMetric ? `<th scope="col">${escapeXml(config.secondaryMetric.label)}</th>` : ""}
            <th scope="col"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderDayDetail(config, day) {
  const skipKeys = new Set(["date"]);
  const entriesHtml = day.entries
    .map((entry) => {
      const fields = Object.keys(entry)
        .filter((key) => !skipKeys.has(key) && entry[key] !== null && entry[key] !== undefined)
        .map((key) => {
          const metric = [config.primaryMetric, config.secondaryMetric].find((m) => m && m.key === key);
          const display = metric ? formatMetricValue(entry[key], metric) : String(entry[key]);
          return `<div class="habit-stat"><span class="habit-stat__label">${escapeXml(fieldLabel(key))}</span><span class="habit-stat__value">${escapeXml(display)}</span></div>`;
        })
        .join("");
      return `<div class="habit-stats">${fields}</div>`;
    })
    .join("<hr>");

  return `
    <div class="habit-day-detail">
      <p><a href="/habits/${escapeXml(config.id)}/" data-back-link>← All ${escapeXml(pluralizeLabel(2, "sessions"))}</a></p>
      <h2>${escapeXml(formatIsoDate(day.date))}</h2>
      ${entriesHtml}
    </div>`;
}

function getDateFromPath(pathname, slug) {
  const match = new RegExp(`^/habits/${slug}/(\\d{4}-\\d{2}-\\d{2})/?$`).exec(pathname);
  return match ? match[1] : null;
}

function render(mount, config, days, activeDate) {
  const activeDay = activeDate ? days.find((d) => d.date === activeDate) : null;
  if (activeDay) {
    mount.querySelector("[data-habit-body]").innerHTML = renderDayDetail(config, activeDay);
  } else {
    mount.querySelector("[data-habit-body]").outerHTML = `<div data-habit-body>${renderDaysTable(config, days, null)}</div>`;
  }
}

function wireNavigation(mount, config, days) {
  mount.addEventListener("click", (e) => {
    const dateLink = e.target.closest("[data-date-link]");
    const backLink = e.target.closest("[data-back-link]");
    if (dateLink) {
      e.preventDefault();
      const date = dateLink.getAttribute("data-date-link");
      history.pushState({ date }, "", `/habits/${config.id}/${date}/`);
      render(mount, config, days, date);
    } else if (backLink) {
      e.preventDefault();
      history.pushState({}, "", `/habits/${config.id}/`);
      render(mount, config, days, null);
    }
  });

  window.addEventListener("popstate", () => {
    render(mount, config, days, getDateFromPath(location.pathname, config.id));
  });
}

async function renderDetailPage(mount, slug) {
  let response;
  try {
    response = await fetch(`${API_BASE}/habits/${slug}`);
  } catch (err) {
    return; // offline/network error - leave the noscript-era fallback text in place
  }
  if (!response.ok) return;
  const data = await response.json();
  const config = data.config;
  const days = groupByDay(data.entries);

  mount.innerHTML = `
    ${renderStatTiles(config, data)}
    ${renderChart(config, data.entries)}
    <h2>All sessions</h2>
    <div data-habit-body></div>`;

  wireNavigation(mount, config, days);
  render(mount, config, days, getDateFromPath(location.pathname, slug));
}

function habitCard(habit) {
  const latest = habit.latest
    ? `<span class="habit-card__latest">Last: ${escapeXml(formatMetricValue(habit.latest[habit.primaryMetric.key], habit.primaryMetric))}${
        habit.secondaryMetric
          ? ` · ${escapeXml(formatMetricValue(habit.latest[habit.secondaryMetric.key], habit.secondaryMetric))} ${escapeXml(pluralizeLabel(habit.latest[habit.secondaryMetric.key], habit.secondaryMetric.label))}`
          : ""
      }</span>`
    : "";
  return `
    <a class="habit-card" href="${escapeXml(habit.url)}">
      <span class="habit-card__icon" aria-hidden="true">${habit.icon}</span>
      <span class="habit-card__name">${escapeXml(habit.name)}</span>
      <span class="habit-card__meta">${habit.sessionCount} session${habit.sessionCount !== 1 ? "s" : ""} logged</span>
      ${latest}
    </a>`;
}

function timelineRow(item) {
  return `
    <tr>
      <td><a href="${escapeXml(item.url)}">${item.icon} ${escapeXml(item.habitName)}</a></td>
      <td>${escapeXml(formatIsoDate(item.date))}</td>
      <td>${escapeXml(item.time || "")}</td>
      <td>${escapeXml(item.primaryDisplay || "")}${item.secondaryDisplay ? ` · ${escapeXml(item.secondaryDisplay)} ${escapeXml(item.secondaryLabel)}` : ""}</td>
    </tr>`;
}

async function renderIndexPage(mount) {
  let response;
  try {
    response = await fetch(`${API_BASE}/habits`);
  } catch (err) {
    return;
  }
  if (!response.ok) return;
  const data = await response.json();

  mount.innerHTML = `
    <div class="habit-grid">${data.list.map(habitCard).join("")}</div>
    <h2>Recent activity</h2>
    <div class="habit-table-wrap">
      <table class="habit-table">
        <thead>
          <tr>
            <th scope="col">Habit</th>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>${data.timeline.map(timelineRow).join("")}</tbody>
      </table>
    </div>`;
}

function init() {
  const mount = document.getElementById("habit-app");
  if (!mount) return;

  const mode = mount.getAttribute("data-habit-app");
  if (mode === "index") {
    renderIndexPage(mount);
  } else if (mode === "detail") {
    renderDetailPage(mount, mount.getAttribute("data-habit"));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
