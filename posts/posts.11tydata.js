const todaysDate = new Date();

function isDev() {
  try {
    if (typeof process === "undefined" || !process || !process.argv || !Array.isArray(process.argv)) {
      return false;
    }
    return /serve|watch/.test(process.argv.join());
  } catch (e) {
    return false;
  }
}

const isDevEnv = isDev();

function isPublished(data) {
  if (!data) return true;
  if (isDevEnv) return true;
  const isDraft = "draft" in data && data.draft !== false;
  return !isDraft;
}

function isCollectionVisible(data) {
  if (!data) return false;
  if (!isPublished(data)) return false;

  if (isDevEnv) return true;

  // Robustly handle dates
  const scheduledDate = "scheduled" in data && data.scheduled ? new Date(data.scheduled) : null;
  const postDate = data.date ? new Date(data.date) : todaysDate;

  const isScheduledInFuture = scheduledDate && !isNaN(scheduledDate.getTime()) ? scheduledDate > todaysDate : false;
  const isPostInFuture = postDate && !isNaN(postDate.getTime()) ? postDate > todaysDate : false;

  return !isScheduledInFuture && !isPostInFuture;
}

module.exports = () => {
  return {
    layout: "layouts/post.njk",
    templateClass: "tmpl-post",
    eleventyComputed: {
      eleventyExcludeFromCollections: (data) =>
        data && isCollectionVisible(data) ? (data.eleventyExcludeFromCollections || false) : true,
      permalink: (data) => {
        if (!data || !isPublished(data)) return false;

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
