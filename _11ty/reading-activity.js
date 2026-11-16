/**
 * Turns the reading posts into per-month and per-year counts for
 * /reading/activity/. A book counts in the month it was finished. Books with
 * no finish date (most of the Goodreads era) count in the month they were
 * started, and are tracked separately so the chart can show which is which.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const toDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// 0-4 shade for the heatmap, relative to the busiest month.
const level = (count, max) => (count === 0 || max === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4)));

module.exports = function readingActivity(posts, now = new Date()) {
  const counts = new Map(); // "YYYY-M" -> { finished, startedOnly }
  let first = null;

  for (const post of posts || []) {
    const reading = (post.data && post.data.reading) || {};
    if (reading.status === "to-read") continue;
    const finished = toDate(reading.finished);
    const when = finished || toDate(reading.started) || toDate(post.date);
    if (!when) continue;
    const key = `${when.getUTCFullYear()}-${when.getUTCMonth()}`;
    if (!counts.has(key)) counts.set(key, { finished: 0, startedOnly: 0 });
    counts.get(key)[finished ? "finished" : "startedOnly"]++;
    if (!first || when < first) first = when;
  }
  if (!first) return null;

  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth();
  const startYear = first.getUTCFullYear();
  const years = [];
  const monthTotals = Array(12).fill(0);
  let max = 0;
  let best = null;
  let activeMonths = 0;
  let elapsedMonths = 0;

  for (let year = startYear; year <= nowYear; year++) {
    const months = MONTHS.map((label, m) => {
      const c = counts.get(`${year}-${m}`) || { finished: 0, startedOnly: 0 };
      const total = c.finished + c.startedOnly;
      const future = year > nowYear || (year === nowYear && m > nowMonth);
      const before = year === startYear && m < first.getUTCMonth();
      return { n: m, label, long: LONG_MONTHS[m], finished: c.finished, startedOnly: c.startedOnly, total, future, before };
    });
    const row = {
      year,
      months,
      finished: months.reduce((s, m) => s + m.finished, 0),
      startedOnly: months.reduce((s, m) => s + m.startedOnly, 0),
    };
    row.total = row.finished + row.startedOnly;
    for (const m of months) {
      monthTotals[m.n] += m.total;
      max = Math.max(max, m.total);
      if (!m.future && !m.before) {
        elapsedMonths++;
        if (m.total) activeMonths++;
      }
      if (m.total && (!best || m.total > best.total)) best = { year, label: m.long, total: m.total };
    }
    years.push(row);
  }

  const total = years.reduce((s, y) => s + y.total, 0);
  const yearMax = Math.max(...years.map((y) => y.total));
  const bestYear = years.find((y) => y.total === yearMax);
  const monthMax = Math.max(...monthTotals);

  for (const y of years) {
    y.barPct = Math.round((y.total / yearMax) * 100);
    for (const m of y.months) m.level = level(m.total, max);
  }

  return {
    years,
    total,
    yearMax,
    bestYear: { year: bestYear.year, total: bestYear.total },
    bestMonth: best,
    activeMonths,
    elapsedMonths,
    emptyMonths: elapsedMonths - activeMonths,
    perMonth: elapsedMonths ? Math.round((total / elapsedMonths) * 10) / 10 : 0,
    // Seasonality: books per calendar month across all years.
    seasons: MONTHS.map((label, n) => ({ label, long: LONG_MONTHS[n], total: monthTotals[n], pct: monthMax ? Math.round((monthTotals[n] / monthMax) * 100) : 0 })),
    firstLabel: `${LONG_MONTHS[first.getUTCMonth()]} ${first.getUTCFullYear()}`,
    nowYear,
  };
};
