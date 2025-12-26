module.exports = function (collection) {
  let categorySet = new Set();

  collection.getFilteredByTag("posts").forEach(function (item) {
    if ("categories" in item.data) {
      let categories = item.data.categories;
      categories = Array.isArray(categories) ? categories : [categories];

      for (const category of categories) {
        if (category) {
          categorySet.add(category);
        }
      }
    }
  });

  return [...categorySet].sort();
};
