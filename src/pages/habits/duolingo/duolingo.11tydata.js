// Overrides the src/pages/ directory default (which derives the permalink
// from the file path) so the paginated month template below publishes at
// /habits/duolingo/<year>/<month>/ instead of /habits/duolingo/month/.
module.exports = {
  eleventyComputed: {
    permalink: (data) => `/habits/duolingo/${data.month.year}/${data.month.monthPadded}/`,
  },
};
