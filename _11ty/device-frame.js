/**
 * "Device frame" components for showing app screenshots in post content -
 * a static phone-shaped frame, and a scrolling variant that pans a taller
 * source image slowly up and down inside a fixed-height frame, like a
 * screen-recording of someone scrolling a phone. Registered the same way
 * as stat-cards.js and cta-buttons.js so both work from Markdown (rendered
 * through Liquid) as well as Nunjucks templates.
 *
 * The scrolling variant takes the *actual pixel dimensions* of the source
 * image and the frame's target aspect ratio, and works out the pan
 * distance itself (as a percentage of the image's own rendered height),
 * so the same component works for any future screenshot without any
 * manual maths from whoever's dropping it into a post - just the image
 * file's width/height.
 */

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapeAttribute = (value = "") => escapeHtml(value).replace(/"/g, "&quot;");

// A static screenshot in a phone-shaped frame, sized to the frame's own
// aspect ratio (defaults to a standard phone screen).
const deviceFrame = (src, alt, frameWidth = 390, frameHeight = 844) =>
  `<div class="device-frame" style="aspect-ratio:${frameWidth}/${frameHeight}">
  <img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" class="device-frame__img">
</div>`;

// A taller screenshot panned slowly up and down inside a fixed-height
// frame. srcWidth/srcHeight are the source image file's real pixel
// dimensions; frameWidth/frameHeight describe the frame's aspect ratio
// (not the source image's). The pan distance is derived purely from the
// two aspect ratios, so it holds true at any responsive display size.
const deviceFrameScroll = (
  src,
  alt,
  srcWidth,
  srcHeight,
  frameWidth = 390,
  frameHeight = 844
) => {
  const sourceRatio = srcHeight / srcWidth;
  const frameRatio = frameHeight / frameWidth;
  // How far, as a % of the image's own rendered height, it overshoots the
  // frame once scaled to the frame's width - i.e. how far there is to pan.
  const panPercent = Math.max(0, Math.min(95, (1 - frameRatio / sourceRatio) * 100));

  return `<div class="device-frame" style="aspect-ratio:${frameWidth}/${frameHeight}">
  <img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" class="device-frame__img device-frame__img--scroll" style="--device-scroll-distance: -${panPercent.toFixed(2)}%">
</div>`;
};

// Paired shortcode wrapping one or more {% deviceFrame %} calls in a
// side-by-side grid.
const deviceFrames = (content) => `<div class="device-frames">
${content.trim()}
</div>`;

module.exports = {
  initArguments: {},
  configFunction: (eleventyConfig) => {
    eleventyConfig.addShortcode("deviceFrame", deviceFrame);
    eleventyConfig.addNunjucksShortcode("deviceFrame", deviceFrame);
    eleventyConfig.addLiquidShortcode("deviceFrame", deviceFrame);

    eleventyConfig.addShortcode("deviceFrameScroll", deviceFrameScroll);
    eleventyConfig.addNunjucksShortcode("deviceFrameScroll", deviceFrameScroll);
    eleventyConfig.addLiquidShortcode("deviceFrameScroll", deviceFrameScroll);

    eleventyConfig.addPairedShortcode("deviceFrames", deviceFrames);
    eleventyConfig.addPairedNunjucksShortcode("deviceFrames", deviceFrames);
    eleventyConfig.addPairedLiquidShortcode("deviceFrames", deviceFrames);
  },
};
