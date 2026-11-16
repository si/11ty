const terser = require("@rollup/plugin-terser").default;

module.exports = {
  input: "src/main.js",
  output: [
    {
      file: "js/min.js",
      format: "iife",
      sourcemap: true,
      plugins: [terser()],
    },
  ],
};
