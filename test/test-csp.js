
const assert = require("assert");
const applyCsp = require("../_11ty/apply-csp.js");

describe("CSP Transform", () => {
  let addCspHashFn;

  before(() => {
    const mockEleventyConfig = {
      addTransform: (name, fn) => {
        if (name === "csp") addCspHashFn = fn;
      }
    };
    applyCsp.configFunction(mockEleventyConfig);
  });

  const htmlWithCsp = `<!doctype html>
<html lang="en">
<head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' HASHES">
    <script csp-hash>console.log('Inline script 1');</script>
    <script csp-hash>
      const a = 1;
      const b = 2;
      console.log(a+b);
    </script>
    <script src="foo.js" csp-hash></script>
</head>
<body>
    <h1>Hello World</h1>
    <script>console.log('Regular script');</script>
</body>
</html>`;

  const htmlWithSwappedAttributes = `<!doctype html>
<html lang="en">
<head>
    <meta content="default-src 'self'; script-src 'self' HASHES" http-equiv="Content-Security-Policy">
    <script csp-hash>console.log('Inline script 2');</script>
</head>
<body>
</body>
</html>`;

  const htmlWithoutCsp = `<!doctype html>
<html lang="en">
<head>
    <!-- CSP commented out -->
    <script csp-hash>console.log('Inline script 1');</script>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>`;

  it("should replace HASHES and populate csp-hash attributes", async () => {
    const output = await addCspHashFn(htmlWithCsp, "test.html");

    assert.strictEqual(output.includes("HASHES"), false, "HASHES placeholder should be replaced");

    const hashRegex = /csp-hash="[^"]+"/;
    assert.ok(hashRegex.test(output), "csp-hash attribute should be populated");

    const metaTag = output.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i)[0];
    assert.ok(metaTag.includes("'sha256-"), "Meta tag should contain sha256 hashes");

    assert.ok(output.includes('<script csp-hash="'), "Script tag should have csp-hash attribute with value");
    assert.ok(output.includes("console.log('Inline script 1');"), "Script content should be preserved");
  });

  it("should handle swapped attributes in meta tag", async () => {
    const output = await addCspHashFn(htmlWithSwappedAttributes, "test.html");

    assert.strictEqual(output.includes("HASHES"), false, "HASHES placeholder should be replaced");

    const metaTag = output.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i)[0];
    assert.ok(metaTag.includes("'sha256-"), "Meta tag should contain sha256 hashes");
  });

  it("should not modify content if CSP meta tag is missing", async () => {
    const output = await addCspHashFn(htmlWithoutCsp, "test.html");
    assert.strictEqual(output, htmlWithoutCsp, "Output should match input");
  });
});
