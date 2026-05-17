const { JSDOM } = require("jsdom");
const { processImages } = require("./img-dim");
const { processCsp } = require("./apply-csp");

const combinedTransform = async (rawContent, outputPath) => {
  let content = rawContent;

  if (outputPath && outputPath.endsWith(".html")) {
    const dom = new JSDOM(content);
    const doc = dom.window.document;

    await processImages(doc, outputPath);
    processCsp(doc, outputPath);

    content = dom.serialize();
  }

  return content;
};

module.exports = {
  initArguments: {},
  configFunction: async (eleventyConfig, pluginOptions = {}) => {
    eleventyConfig.addTransform("combined", combinedTransform);
  },
};
