import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    input: "src/main.js",
    output: [
      {
        file: "js/min.js",
        format: "iife",
        sourcemap: true,
        plugins: [terser()],
      },
    ],
  },
  {
    // Bundled separately (rather than folded into main.js) so pages outside
    // /habits/ don't ship this code - see base.njk's conditional <script>.
    // Pulls in _11ty/habits-shared.js (CommonJS) via resolve+commonjs so
    // the stat/chart math isn't duplicated between build time and runtime.
    input: "src/habits-app.js",
    output: [
      {
        file: "js/habits-app.js",
        format: "iife",
        sourcemap: true,
        plugins: [terser()],
      },
    ],
    plugins: [resolve(), commonjs()],
  },
];
