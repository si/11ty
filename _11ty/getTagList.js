module.exports = function(collection) {
  let tagSet = new Set();
  collection.getAll().forEach(function(item) {
    if( "tags" in item.data ) {
      let tags = item.data.tags;

      tags = tags.filter(function(item) {
        switch(item) {
          // Internal collection names (see .eleventy.js addCollection calls)
          // that must never be mistaken for a real tag.
          case "all":
          case "nav":
          case "post":
          case "posts":
          case "tagList":
          case "postDirectories":
          case "homeRecentPosts":
          case "blogPosts":
          case "asidePosts":
          case "portfolioPosts":
          case "microPosts":
            return false;
        }

        return true;
      });

      for (const tag of tags) {
        tagSet.add(tag);
      }
    }
  });

  // returning an array in addCollection works in Eleventy 0.5.3
  return [...tagSet];
};
