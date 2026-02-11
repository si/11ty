const todaysDate = new Date();
const isDev = require("../_data/isdevelopment")();

function isPublished(data) {
  if (isDev) return true;
  const isDraft = "draft" in data && data.draft !== false;
  return !isDraft;
}

function isCollectionVisible(data) {
  if (!isPublished(data)) return false;

  if (isDev) return true;

  // Robustly handle dates, defaulting to today if missing (shouldn't happen for posts)
  const scheduledDate = "scheduled" in data ? new Date(data.scheduled) : null;
  const postDate = data.date ? new Date(data.date) : todaysDate;

  const isScheduledInFuture = scheduledDate ? scheduledDate > todaysDate : false;
  const isPostInFuture = postDate > todaysDate;

  return !isScheduledInFuture && !isPostInFuture;
}

module.exports = () => {
  return {
    layout: "layouts/post.njk",
    templateClass: "tmpl-post",
    eleventyComputed: {
      eleventyExcludeFromCollections: (data) =>
        isCollectionVisible(data) ? (data.eleventyExcludeFromCollections || false) : true,
      permalink: (data) => {
        if (!isPublished(data)) return false;

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
