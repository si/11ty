/**
 * Record Collection: fetches liked-track rows from a public Google Sheet
 * (populated by an IFTTT "Spotify like -> add row" recipe) and renders them
 * as a scrollable shelf of record sleeves. Cover art isn't in the sheet, so
 * it's fetched per-track from Spotify's public oEmbed endpoint and cached in
 * localStorage.
 */
(function () {
  "use strict";

  var container = document.getElementById("record-collection");
  if (!container) return;

  var sheetId = container.getAttribute("data-sheet-id");
  var shelf = container.querySelector(".record-shelf");
  var status = container.querySelector(".record-collection__status");
  var template = document.getElementById("record-sleeve-template");
  var prevBtn = container.querySelector(".record-nav--prev");
  var nextBtn = container.querySelector(".record-nav--next");

  if (!sheetId || !shelf || !template || !template.content) return;

  var CSV_URL =
    "https://docs.google.com/spreadsheets/d/" + sheetId + "/gviz/tq?tqx=out:csv";
  var ART_CACHE_PREFIX = "records-artwork-v1:";
  var MONTHS = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  // Minimal RFC4180-ish CSV parser: handles quoted fields, embedded commas
  // and "" escaped quotes, which the sheet's Artists column relies on.
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;

    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
        continue;
      }
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\r") {
        // no-op, \n below closes the row
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function headerIndex(header, name) {
    for (var i = 0; i < header.length; i++) {
      if (header[i].trim().toLowerCase() === name) return i;
    }
    return -1;
  }

  // "March 12, 2025 at 07:10PM" - the IFTTT recipe's timestamp format.
  function parseTimestamp(value) {
    if (!value) return null;
    var m = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})(AM|PM)$/i.exec(
      value.trim()
    );
    if (!m) return null;
    var monthIndex = MONTHS.indexOf(m[1].toLowerCase());
    if (monthIndex === -1) return null;
    var hour = parseInt(m[4], 10) % 12;
    if (/pm/i.test(m[6])) hour += 12;
    var date = new Date(
      parseInt(m[3], 10),
      monthIndex,
      parseInt(m[2], 10),
      hour,
      parseInt(m[5], 10)
    );
    return isNaN(date.getTime()) ? null : date;
  }

  // "12/03/2025" fallback (UK day/month/year) when the timestamp doesn't parse.
  function parseUkDate(value) {
    if (!value) return null;
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (!m) return null;
    var date = new Date(
      parseInt(m[3], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[1], 10)
    );
    return isNaN(date.getTime()) ? null : date;
  }

  function trackIdFromUrl(url) {
    var m = /track\/([A-Za-z0-9]+)/.exec(url || "");
    return m ? m[1] : null;
  }

  function buildTracks(rows) {
    if (!rows.length) return [];
    var header = rows[0];
    var idx = {
      title: headerIndex(header, "track"),
      artists: headerIndex(header, "artists"),
      album: headerIndex(header, "album"),
      artwork: headerIndex(header, "artwork"),
      url: headerIndex(header, "url"),
      timestamp: headerIndex(header, "timestamp"),
      date: headerIndex(header, "date"),
    };

    // Liked tracks occasionally reappear (re-liked, or re-synced by IFTTT);
    // keep only the most recent row per Spotify URL.
    var byUrl = {};
    for (var r = 1; r < rows.length; r++) {
      var cols = rows[r];
      var url = idx.url > -1 ? (cols[idx.url] || "").trim() : "";
      var title = idx.title > -1 ? (cols[idx.title] || "").trim() : "";
      if (!url || !title) continue;
      var trackId = trackIdFromUrl(url);
      if (!trackId) continue;

      var when =
        parseTimestamp(idx.timestamp > -1 ? cols[idx.timestamp] : "") ||
        parseUkDate(idx.date > -1 ? cols[idx.date] : "");

      var existing = byUrl[url];
      if (existing && existing.when && when && when <= existing.when) continue;

      byUrl[url] = {
        trackId: trackId,
        title: title,
        artists: idx.artists > -1 ? (cols[idx.artists] || "").trim() : "",
        album: idx.album > -1 ? (cols[idx.album] || "").trim() : "",
        artwork: idx.artwork > -1 ? (cols[idx.artwork] || "").trim() : "",
        url: url,
        when: when,
      };
    }

    var tracks = Object.keys(byUrl).map(function (key) {
      return byUrl[key];
    });
    tracks.sort(function (a, b) {
      if (a.when && b.when) return b.when - a.when;
      if (a.when) return -1;
      if (b.when) return 1;
      return 0;
    });
    return tracks;
  }

  function readArtCache(trackId) {
    try {
      return window.localStorage.getItem(ART_CACHE_PREFIX + trackId);
    } catch (e) {
      return null;
    }
  }

  function writeArtCache(trackId, url) {
    try {
      window.localStorage.setItem(ART_CACHE_PREFIX + trackId, url);
    } catch (e) {
      // Storage full/unavailable (private browsing etc.) - just skip caching.
    }
  }

  function markFallback(artEl) {
    artEl.classList.remove("record-sleeve__art--loading");
    artEl.classList.add("record-sleeve__art--fallback");
  }

  function applyArtwork(img, artEl, src) {
    img.addEventListener(
      "load",
      function () {
        artEl.classList.remove("record-sleeve__art--loading");
      },
      { once: true }
    );
    img.addEventListener("error", function () { markFallback(artEl); }, {
      once: true,
    });
    img.src = src;
  }

  function loadArtwork(img, artEl, track) {
    var cached = track.artwork || readArtCache(track.trackId);
    if (cached) {
      applyArtwork(img, artEl, cached);
      return;
    }
    fetch("https://open.spotify.com/oembed?url=" + encodeURIComponent(track.url))
      .then(function (res) {
        if (!res.ok) throw new Error("oEmbed request failed");
        return res.json();
      })
      .then(function (data) {
        if (data && data.thumbnail_url) {
          writeArtCache(track.trackId, data.thumbnail_url);
          applyArtwork(img, artEl, data.thumbnail_url);
        } else {
          markFallback(artEl);
        }
      })
      .catch(function () {
        markFallback(artEl);
      });
  }

  function renderTracks(tracks) {
    var observer = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            var li = entry.target;
            var img = li.querySelector(".record-sleeve__art-image");
            var artEl = li.querySelector(".record-sleeve__art");
            if (img && artEl && li.__track) loadArtwork(img, artEl, li.__track);
          });
        },
        { root: shelf, rootMargin: "200px" }
      );
    }

    tracks.forEach(function (track) {
      var fragment = template.content.cloneNode(true);
      var li = fragment.querySelector(".record-sleeve");
      var link = fragment.querySelector(".record-sleeve__link");
      var img = fragment.querySelector(".record-sleeve__art-image");
      var titleEl = fragment.querySelector(".record-sleeve__title");
      var artistEl = fragment.querySelector(".record-sleeve__artist");

      link.href = track.url;
      titleEl.textContent = track.title;
      artistEl.textContent = track.artists;
      img.alt = track.title + (track.artists ? " — " + track.artists : "");
      li.__track = track;

      shelf.appendChild(li);

      if (observer) {
        observer.observe(li);
      } else {
        loadArtwork(img, li.querySelector(".record-sleeve__art"), track);
      }
    });
  }

  function wireControls() {
    if (!prevBtn || !nextBtn) return;
    function scrollAmount() {
      return Math.max(shelf.clientWidth * 0.8, 240);
    }
    prevBtn.addEventListener("click", function () {
      shelf.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    });
    nextBtn.addEventListener("click", function () {
      shelf.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    });
    shelf.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        shelf.scrollBy({ left: scrollAmount(), behavior: "smooth" });
      } else if (e.key === "ArrowLeft") {
        shelf.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
      }
    });
  }

  wireControls();
  setStatus("Loading the crate…");

  fetch(CSV_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("Sheet fetch failed: " + res.status);
      return res.text();
    })
    .then(function (text) {
      var tracks = buildTracks(parseCSV(text));
      if (!tracks.length) {
        setStatus("No liked tracks found yet.");
        return;
      }
      setStatus(tracks.length + " liked track" + (tracks.length === 1 ? "" : "s"));
      renderTracks(tracks);
    })
    .catch(function (err) {
      console.error(err);
      setStatus(
        "Couldn't load the record collection right now. Try refreshing, or check back later."
      );
    });
})();
