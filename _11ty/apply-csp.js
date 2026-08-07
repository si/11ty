/**
 * Copyright (c) 2020 Google Inc
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const cspHashGen = require("csp-hash-generator");
const syncPackage = require("browser-sync/package.json");

/**
 * Substitute the magic `HASHES` string in the CSP with the actual values of the
 * loaded JS files.
 * The ACTUAL CSP is configured in `_data/csp.js`.
 */

// Allow the auto-reload script in local dev. Would be good to get rid of this magic
// string which would break on ungrades of 11ty.
const AUTO_RELOAD_SCRIPTS = [
  quote(
    cspHashGen(
      "//<![CDATA[\n    document.write(\"<script async src='/browser-sync/browser-sync-client.js?v=" +
        syncPackage.version +
        '\'><\\/script>".replace("HOST", location.hostname));\n//]]>'
    )
  ),
];

function quote(str) {
  return `'${str}'`;
}

const addCspHash = async (rawContent, outputPath) => {
  let content = rawContent;

  if (outputPath && outputPath.endsWith(".html")) {
    // Fast fail if no CSP meta tag is present (check for the header value)
    if (!/Content-Security-Policy/i.test(content)) {
      return content;
    }

    const hashes = [];

    // Find and replace script tags with csp-hash attribute
    content = content.replace(
      /<script([^>]*)csp-hash([^>]*)>([\s\S]*?)<\/script>/gi,
      (match, p1, p2, p3) => {
        const hash = cspHashGen(p3);
        hashes.push(quote(hash));
        return `<script${p1}csp-hash="${hash}"${p2}>${p3}</script>`;
      }
    );

    if (isDevelopmentMode()) {
      hashes.push.apply(hashes, AUTO_RELOAD_SCRIPTS);
    }

    // Replace HASHES in the CSP meta tag
    // Finds the meta tag with http-equiv="Content-Security-Policy" and replaces HASHES inside it
    const metaTagRegex = /<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i;
    content = content.replace(metaTagRegex, (match) => {
        if (match.includes("HASHES")) {
             return match.replace("HASHES", hashes.join(" "));
        }
        return match;
    });
  }

  return content;
};

function parseHeaders(headersFile) {
  let currentFilename;
  let headers = {};
  for (let line of headersFile.split(/[\r\n]+/)) {
    if (!line) continue;
    if (/^\S/.test(line)) {
      currentFilename = line;
      headers[currentFilename] = [];
    } else {
      line = line.trim();
      const h = line.split(/:\s+/);
      headers[currentFilename][h[0]] = h[1];
    }
  }
  return headers;
}

module.exports = {
  initArguments: {},
  configFunction: async (eleventyConfig, pluginOptions = {}) => {
    eleventyConfig.addTransform("csp", addCspHash);
  },
};

function isDevelopmentMode() {
  return /serve|dev/.test(process.argv.join());
}
