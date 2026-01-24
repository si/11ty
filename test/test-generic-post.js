const assert = require("assert").strict;
const expect = require("expect.js");
const { JSDOM } = require("jsdom");
const readFileSync = require("fs").readFileSync;
const existsSync = require("fs").existsSync;
const metadata = require("../_data/metadata.json");
const GA_ID = require("../_data/googleanalytics.js")();

/**
 * These tests kind of suck and they are kind of useful.
 *
 * They suck, because they need to be changed when the hardcoded post changes.
 * They are useful because I tend to break the things they test all the time.
 */

describe("check build output for a generic post", () => {
  describe("sample post", () => {
    const POST_FILENAME = "_site/blog/asos/index.html";
    const URL = metadata.url;
    const POST_URL = URL + "/blog/asos/";

    if (!existsSync(POST_FILENAME)) {
      it("WARNING skipping tests because POST_FILENAME does not exist", () => {});
      return;
    }

    let dom;
    let html;
    let doc;

    function select(selector, opt_attribute) {
      const element = doc.querySelector(selector);
      assert(element, "Expected to find: " + selector);
      if (opt_attribute) {
        return element.getAttribute(opt_attribute);
      }
      return element.textContent;
    }

    before(() => {
      html = readFileSync(POST_FILENAME);
      dom = new JSDOM(html);
      doc = dom.window.document;
    });

    it("should have metadata", () => {
      assert.equal(select("title"), "ASOS • Si Jobling");
      assert.equal(select("link[rel='canonical']", "href"), POST_URL);
    });

    it("should have inlined css", () => {
      const css = select("style");
      expect(css).to.match(/header nav/);
      expect(css).to.not.match(/test-dead-code-elimination-sentinel/);
    });

    it("should have script elements", () => {
      const scripts = doc.querySelectorAll("script[src]");
      let has_ga_id = GA_ID ? 1 : 0;
      expect(scripts).to.have.length(has_ga_id + 1); // NOTE: update this when adding more <script>
      expect(scripts[0].getAttribute("src")).to.match(
        /^\/js\/min\.js\?hash=\w+/
      );
    });



    /*
    // Update me. Comment in if you turned on the CSP support.
    it("should have a good CSP", () => {
      const csp = select(
        "meta[http-equiv='Content-Security-Policy']",
        "content"
      );
      expect(csp).to.contain(";object-src 'none';");
      expect(csp).to.match(/^default-src 'self';/);
    });*/



    describe("body", () => {

      it("should have paragraphs", () => {
        const images = Array.from(doc.querySelectorAll("article > p"));
        expect(images.length).to.greaterThan(0);
      });
    });
  });
});
