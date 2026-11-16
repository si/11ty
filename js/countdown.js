/**
 * Countdown facade: each episode starts as a thumbnail link (so the page loads
 * no YouTube code up front). On click it swaps in the youtube-nocookie iframe
 * and autoplays. Without JS the link just opens the video on YouTube.
 */
(function () {
  "use strict";

  var facades = document.querySelectorAll(".countdown-facade");

  function load(facade) {
    var iframe = document.createElement("iframe");
    iframe.src = facade.getAttribute("data-embed") + "?autoplay=1&rel=0";
    iframe.title = facade.getAttribute("data-title") || "YouTube video player";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    iframe.className = "countdown-frame";
    facade.parentNode.replaceChild(iframe, facade);
    iframe.focus();
  }

  Array.prototype.forEach.call(facades, function (facade) {
    facade.addEventListener("click", function (event) {
      // Let modified clicks (new tab etc.) go to YouTube as normal.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      load(facade);
    });
  });
})();
