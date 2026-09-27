/**
 * Small reusable "stat card" components for dropping quick metrics (habit
 * catch-ups, fitness week-on-week numbers, etc.) straight into Markdown
 * content - blog posts and weeknotes are rendered through Liquid, so these
 * are registered as universal + Liquid + Nunjucks shortcodes the same way
 * the HF site registers `vipBanner`.
 */

const DIRECTION_META = {
  up: { symbol: "▲", className: "stat-card__delta--up" },
  down: { symbol: "▼", className: "stat-card__delta--down" },
  flat: { symbol: "●", className: "stat-card__delta--flat" },
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// A single metric card: an emoji, a label, the headline value, and an
// optional week-on-week delta line with an up/down/flat indicator.
const statCard = (emoji, label, value, direction, deltaText) => {
  const meta = DIRECTION_META[direction];
  let deltaHtml = "";
  if (deltaText) {
    const className = meta
      ? `stat-card__delta ${meta.className}`
      : "stat-card__delta";
    const symbol = meta ? `<span aria-hidden="true">${meta.symbol}</span> ` : "";
    deltaHtml = `\n  <p class="${className}">${symbol}${escapeHtml(deltaText)}</p>`;
  }

  return `<div class="stat-card">
  <div class="stat-card__emoji" aria-hidden="true">${escapeHtml(emoji)}</div>
  <p class="stat-card__label">${escapeHtml(label)}</p>
  <p class="stat-card__value">${escapeHtml(value)}</p>${deltaHtml}
</div>`;
};

// Paired shortcode wrapping one or more {% statCard %} calls in the grid
// container. Content is already-rendered HTML from the inner shortcodes.
const statCards = (content) => `<div class="stat-cards">
${content.trim()}
</div>`;

module.exports = {
  initArguments: {},
  configFunction: (eleventyConfig) => {
    eleventyConfig.addShortcode("statCard", statCard);
    eleventyConfig.addNunjucksShortcode("statCard", statCard);
    eleventyConfig.addLiquidShortcode("statCard", statCard);

    eleventyConfig.addPairedShortcode("statCards", statCards);
    eleventyConfig.addPairedNunjucksShortcode("statCards", statCards);
    eleventyConfig.addPairedLiquidShortcode("statCards", statCards);
  },
};
