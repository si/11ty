/**
 * HTML Transform to convert YouTube URLs in HTML blocks to embeds
 * This handles cases where YouTube URLs are in HTML (like WordPress embeds)
 * rather than in markdown paragraphs
 */

const { createEmbedHtml, isYoutubeUrl } = require("./youtube-embed.js");

module.exports = function (eleventyConfig) {
  eleventyConfig.addTransform("youtube-html-embed", function (content, outputPath) {
    // Only process HTML files
    if (!outputPath || !outputPath.endsWith(".html")) {
      return content;
    }

    // Handle WordPress embed blocks - replace entire figure blocks containing YouTube URLs
    const wpEmbedBlockPattern = /<figure[^>]*class="[^"]*wp-block-embed[^"]*youtube[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*wp-block-embed__wrapper[^"]*"[^>]*>\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/)|youtu\.be\/)[^\s<>"']+)\s*<\/div>[\s\S]*?<\/figure>/gi;
    
    content = content.replace(wpEmbedBlockPattern, (match, url) => {
      // Normalize escaped characters
      const normalized = url.replace(/\\([_\*\[\]()])/g, "$1");
      if (isYoutubeUrl(normalized)) {
        const embed = createEmbedHtml(normalized);
        return embed || match;
      }
      return match;
    });

    // Also handle plain text YouTube URLs that are standalone (not in links or iframes)
    // Match URLs that appear between > and < (inside HTML tags but not in links/iframes)
    const standaloneUrlPattern = />\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/)|youtu\.be\/)[^\s<>"']+)\s*</gi;
    
    content = content.replace(standaloneUrlPattern, (match, url, offset, string) => {
      // Normalize escaped characters
      const normalized = url.replace(/\\([_\*\[\]()])/g, "$1");
      
      if (!isYoutubeUrl(normalized)) {
        return match;
      }

      // Check context to avoid replacing URLs already in embeds or links
      const beforeContext = string.substring(Math.max(0, offset - 200), offset);
      const afterContext = string.substring(offset + match.length, Math.min(string.length, offset + match.length + 200));
      
      // Skip if already in an iframe, link, or YouTube embed
      if (
        /<iframe[^>]*>/.test(beforeContext) ||
        /youtube-embed/.test(beforeContext) ||
        /<a[^>]*href[^>]*>/.test(beforeContext)
      ) {
        return match;
      }

      const embed = createEmbedHtml(normalized);
      if (embed) {
        return `>${embed}<`;
      }
      
      return match;
    });

    return content;
  });
};

