/**
 * Reusable "figure row" component: two or more captioned images laid out
 * side by side on larger viewports and stacked on mobile. Handy for pairs
 * of phone screenshots (before/after, step 1/step 2) in Markdown content.
 *
 * Blog posts, asides and weeknotes are rendered through Liquid, so these are
 * registered as universal + Liquid + Nunjucks shortcodes, same as stat-cards.
 *
 * Usage:
 *   {% figureRow %}
 *   {% rowFigure "/img/assets/2026/10/one.png", "Alt text", "Optional caption" %}
 *   {% rowFigure "/img/assets/2026/10/two.png", "Alt text", "Optional caption" %}
 *   {% endfigureRow %}
 */

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// A single figure inside a row. Output must not contain blank lines or
// Markdown will break the surrounding HTML block.
const rowFigure = (src, alt = "", caption = "") => {
  const captionHtml = caption
    ? `\n  <figcaption>${escapeHtml(caption)}</figcaption>`
    : "";
  return `<figure class="figure-row__item">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">${captionHtml}
</figure>`;
};

// Paired shortcode wrapping one or more {% rowFigure %} calls.
const figureRow = (content) => `<div class="figure-row">
${content.trim()}
</div>`;

module.exports = {
  initArguments: {},
  configFunction: (eleventyConfig) => {
    eleventyConfig.addShortcode("rowFigure", rowFigure);
    eleventyConfig.addNunjucksShortcode("rowFigure", rowFigure);
    eleventyConfig.addLiquidShortcode("rowFigure", rowFigure);

    eleventyConfig.addPairedShortcode("figureRow", figureRow);
    eleventyConfig.addPairedNunjucksShortcode("figureRow", figureRow);
    eleventyConfig.addPairedLiquidShortcode("figureRow", figureRow);
  },
};
