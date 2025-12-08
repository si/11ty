const todaysDate = new Date();
const isDev = require("../_data/isdevelopment")();

function showDraft(data) {
  if (isDev) return true;
  const isDraft = "draft" in data && data.draft !== false;
  const isPostInFuture =
    "scheduled" in data ? data.scheduled > todaysDate : false;
  return !isDraft && !isPostInFuture;
}

module.exports = () => {
  return {
    eleventyComputed: {
      eleventyExcludeFromCollections: (data) =>
        showDraft(data) ? data.eleventyExcludeFromCollections : true,
      permalink: (data) => {
        if (!showDraft(data)) return false;

        if (data.permalink) return data.permalink;

        const categories = Array.isArray(data.categories) ? data.categories : [];
        // Prefer an explicit primaryCategory; otherwise, keep blog posts under /blog/
        // even if other categories are listed first.
        let primaryCategory = data.primaryCategory;
        if (!primaryCategory && categories.includes("blog")) {
          primaryCategory = "blog";
        } else if (!primaryCategory) {
          primaryCategory = categories[0];
        }
        const slug = data.page && data.page.fileSlug ? data.page.fileSlug : "";

        if (primaryCategory) {
          return `/${primaryCategory}/${slug}/`;
        }

        // Default to a flat permalink so posts do not inherit the /posts/ prefix.
        return `/${slug}/`;
      },
    },
    tags: ["posts"],
  };
};
