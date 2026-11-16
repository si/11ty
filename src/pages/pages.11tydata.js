module.exports = {
  layout: "layouts/base.njk",
  templateClass: "tmpl-post",
  eleventyComputed: {
    permalink: (data) => {
      // Flatten any /src/pages prefix so pages publish at the root.
      let stem = data.page.filePathStem.replace(/^\/?src\/pages/, "");
      // index.njk publishes at its directory root instead of /foo/index/.
      stem = stem.replace(/\/index$/, "") || "/";
      return `${stem}/`;
    },
  },
};
