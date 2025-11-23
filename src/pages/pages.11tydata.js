module.exports = {
  layout: "layouts/base.njk",
  templateClass: "tmpl-post",
  eleventyComputed: {
    permalink: (data) => {
      // Flatten any /src/pages prefix so pages publish at the root.
      const stem = data.page.filePathStem.replace(/^\/?src\/pages/, "");
      return `${stem}/`;
    },
  },
};
