/**
 * Small "subscribe here" style CTA button component for post content -
 * registered the same way as stat-cards.js so it works from Markdown
 * (rendered through Liquid) as well as Nunjucks templates.
 */

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapeAttribute = (value = "") => escapeHtml(value).replace(/"/g, "&quot;");

const ctaButton = (label, href) =>
  `<a class="cta-button" href="${escapeAttribute(href)}">${escapeHtml(label)}</a>`;

const ctaButtons = (content) => `<p class="cta-buttons">
${content.trim()}
</p>`;

module.exports = {
  initArguments: {},
  configFunction: (eleventyConfig) => {
    eleventyConfig.addShortcode("ctaButton", ctaButton);
    eleventyConfig.addNunjucksShortcode("ctaButton", ctaButton);
    eleventyConfig.addLiquidShortcode("ctaButton", ctaButton);

    eleventyConfig.addPairedShortcode("ctaButtons", ctaButtons);
    eleventyConfig.addPairedNunjucksShortcode("ctaButtons", ctaButtons);
    eleventyConfig.addPairedLiquidShortcode("ctaButtons", ctaButtons);
  },
};
