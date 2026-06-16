(function () {
  "use strict";

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function iframeSrc(base, wa, apiOrigin, mapboxToken, siteKey) {
    var raw = String(base || "embed/chat-panel.html").trim();
    var url;
    try {
      url = new URL(raw, window.location.href);
    } catch (e) {
      return raw;
    }
    var n = String(wa || "").replace(/\D/g, "");
    if (n) url.searchParams.set("wa", n);
    url.searchParams.set("v", "20260504-sources-agenda");
    var ao = String(apiOrigin || "")
      .trim()
      .replace(/\/$/, "");
    if (ao && ao !== "null") url.searchParams.set("apiBase", ao);
    var mb = String(mapboxToken || "").trim();
    if (mb) url.searchParams.set("mapbox", mb);
    var sk = String(siteKey || "").trim();
    if (sk) url.searchParams.set("siteKey", sk);
    return url.href;
  }

  /** Zelfde vaste kop als lege-thread in embed/chat-panel.html (demo). */
  function sophieBegroetingTekst() {
    return "Goedeavond, ik ben Sophie.👋";
  }

  function rotatingPromptsFromConfig(sophieBegroeting, fallback) {
    var cfg = typeof window !== "undefined" ? window.__SOPHIE_SITE_CONFIG__ : null;
    var list =
      cfg &&
      cfg.rotatingLauncherPrompts &&
      cfg.rotatingLauncherPrompts.length
        ? cfg.rotatingLauncherPrompts.slice()
        : fallback;
    return list.map(function (line) {
      return line === "__SOPHIE_BEGROETING__" ? sophieBegroeting : line;
    });
  }

  function mount(root) {
    var wa = root.getAttribute("data-whatsapp-number") || "";
    var apiOrigin = "";
    try {
      var pr = window.location.protocol;
      if (pr === "http:" || pr === "https:") apiOrigin = window.location.origin;
    } catch (e) {}
    var fromAttr = (root.getAttribute("data-chat-api-origin") || "").trim();
    if (fromAttr) apiOrigin = fromAttr.replace(/\/$/, "");
    var mapboxTok = (root.getAttribute("data-mapbox-token") || "").trim();
    var siteKey = (root.getAttribute("data-sophie-site-key") || root.getAttribute("data-site-key") || "").trim();
    var src = iframeSrc(
      root.getAttribute("data-chat-iframe-src"),
      wa,
      apiOrigin,
      mapboxTok,
      siteKey
    );
    var sophieBegroeting = sophieBegroetingTekst();

    root.innerHTML =
      '<div id="ccw-panel" class="ccw__panel" role="dialog" aria-modal="true" aria-label="Sophie chat">' +
      '<iframe class="ccw__frame" title="Sophie chat" width="100%" height="100%" referrerpolicy="strict-origin-when-cross-origin" loading="eager" src="' +
      escapeAttr(src) +
      '"></iframe></div>' +
      '<button type="button" class="ccw__launcher" aria-expanded="false" aria-controls="ccw-panel">' +
      '<span class="ccw__launcher-text"><span class="ccw__launcher-copy">' +
      escapeAttr(sophieBegroeting) +
      "</span></span>" +
      "</button>";

    var launcher = root.querySelector(".ccw__launcher");
    var frame = root.querySelector(".ccw__frame");
    var launcherCopy = root.querySelector(".ccw__launcher-copy");
    var suggestionsTimer = null;
    var suggestionsObserver = null;

    var rotatingPrompts = rotatingPromptsFromConfig(sophieBegroeting, [
      sophieBegroeting,
      "Stel al je vragen over de gemeente hier",
      "ID verloren?",
      "Geboorte aangeven?",
    ]);
    var rotatingPromptIndex = 0;
    var ROTATE_DWELL_MS = 5000;
    var rotatingPromptFadeMs = 340;
    var rotatingPromptTimer = null;
    var lockLauncherSizeTimer = null;

    var LAUNCHER_SIZE_REFERENCE = "ID verloren?";

    function launcherSizePrompts() {
      var ref = LAUNCHER_SIZE_REFERENCE;
      if (rotatingPrompts.indexOf(ref) !== -1) return [ref];
      return rotatingPrompts.slice();
    }

    function measureLauncherForPrompt(prompt) {
      launcherCopy.textContent = prompt;
      launcher.style.width = "max-content";
      launcher.style.maxWidth = "none";
      launcher.style.minWidth = "0";
      return launcher.getBoundingClientRect();
    }

    function lockLauncherSize() {
      if (!launcher || !launcherCopy || !rotatingPrompts.length) return;

      var savedIndex = rotatingPromptIndex;
      var savedText = launcherCopy.textContent;
      var promptsToMeasure = launcherSizePrompts();
      var maxWidth = 0;
      var maxHeight = 0;

      launcher.style.height = "";
      launcher.style.minHeight = "";

      promptsToMeasure.forEach(function (prompt) {
        var rect = measureLauncherForPrompt(prompt);
        maxWidth = Math.max(maxWidth, rect.width);
        maxHeight = Math.max(maxHeight, rect.height);
      });

      rotatingPromptIndex = savedIndex;
      launcherCopy.textContent = savedText || rotatingPrompts[savedIndex] || rotatingPrompts[0];

      var lockedWidth = Math.ceil(maxWidth);
      var lockedHeight = Math.max(52, Math.ceil(maxHeight));

      launcher.style.width = lockedWidth + "px";
      launcher.style.minWidth = lockedWidth + "px";
      launcher.style.maxWidth = lockedWidth + "px";
      launcher.style.height = lockedHeight + "px";
      launcher.style.minHeight = lockedHeight + "px";
    }

    function stopLauncherPromptRotation() {
      if (!rotatingPromptTimer) return;
      window.clearTimeout(rotatingPromptTimer);
      rotatingPromptTimer = null;
    }

    function scheduleLauncherPromptRotation() {
      stopLauncherPromptRotation();
      if (!launcherCopy || rotatingPrompts.length < 2) return;
      if (root.classList.contains("is-open") || root.classList.contains("is-opening")) return;
      rotatingPromptTimer = window.setTimeout(rotateLauncherPrompt, ROTATE_DWELL_MS);
    }

    function rotateLauncherPrompt() {
      rotatingPromptTimer = null;
      if (!launcherCopy || rotatingPrompts.length < 2) return;
      if (root.classList.contains("is-open") || root.classList.contains("is-opening")) return;

      launcherCopy.classList.add("is-leaving");
      window.setTimeout(function () {
        rotatingPromptIndex =
          (rotatingPromptIndex + 1) % rotatingPrompts.length;
        launcherCopy.textContent = rotatingPrompts[rotatingPromptIndex];
        launcherCopy.classList.remove("is-leaving");
        launcherCopy.classList.add("is-entering");
        window.setTimeout(function () {
          launcherCopy.classList.remove("is-entering");
          scheduleLauncherPromptRotation();
        }, rotatingPromptFadeMs);
      }, rotatingPromptFadeMs);
    }

    function startLauncherPromptRotation() {
      scheduleLauncherPromptRotation();
    }

    function lockLauncherSizeDebounced() {
      if (lockLauncherSizeTimer) window.clearTimeout(lockLauncherSizeTimer);
      lockLauncherSizeTimer = window.setTimeout(function () {
        lockLauncherSizeTimer = null;
        lockLauncherSize();
      }, 150);
    }

    function updateLauncherGlowPosition(clientX, clientY) {
      if (!launcher) return;
      var rect = launcher.getBoundingClientRect();
      var x = clientX - rect.left;
      var y = clientY - rect.top;
      launcher.style.setProperty("--ccw-glow-x", x.toFixed(2) + "px");
      launcher.style.setProperty("--ccw-glow-y", y.toFixed(2) + "px");
    }

    var OPEN_MORPH_MS = 480;

    function morphLauncherWidth() {
      return Math.min(Math.floor(window.innerWidth * 0.8), window.innerWidth - 24);
    }

    function postToFrame(action) {
      if (!frame || !frame.contentWindow) return;
      try {
        frame.contentWindow.postMessage({ type: "sophie-chat", action: action }, "*");
      } catch (e) {}
    }

    function isMobileChat() {
      return window.matchMedia("(max-width: 640px)").matches;
    }

    function openChat() {
      if (root.classList.contains("is-open") || root.classList.contains("is-opening")) return;

      stopLauncherPromptRotation();
      launcher.setAttribute("aria-expanded", "true");
      root.classList.remove("ccw--close-done");

      if (isMobileChat()) {
        var morphWidth = morphLauncherWidth();
        root.style.setProperty("--ccw-morph-width", morphWidth + "px");
        launcher.style.width = morphWidth + "px";
        launcher.style.minWidth = morphWidth + "px";

        root.classList.add("is-opening");
        document.body.classList.add("ccw-chat-open");

        requestAnimationFrame(function () {
          root.classList.add("is-open");
        });

        window.setTimeout(function () {
          postToFrame("open-messages");
          postToFrame("panel-visible");
          showSuggestionsAfterDelay();
        }, 240);

        window.setTimeout(function () {
          root.classList.remove("is-opening");
        }, OPEN_MORPH_MS);
        return;
      }

      root.classList.add("is-open");
      postToFrame("open-messages");
      window.setTimeout(function () {
        postToFrame("open-messages");
      }, 120);
      window.setTimeout(showSuggestionsAfterDelay, 40);
    }

    function openMessagesTab() {
      postToFrame("open-messages");
    }

    function withFrameDocument(cb) {
      if (!frame) return;
      var doc = null;
      try {
        doc = frame.contentDocument || frame.contentWindow.document;
      } catch (e) {
        doc = null;
      }
      if (!doc) return;
      cb(doc);
    }

    function clearSuggestionsTimer() {
      if (suggestionsTimer !== null) {
        window.clearTimeout(suggestionsTimer);
        suggestionsTimer = null;
      }
    }

    function hideSuggestionsInFrame() {
      withFrameDocument(function (doc) {
        var suggestions = doc.getElementById("messageSuggestions");
        if (!suggestions) return;
        suggestions.classList.remove("is-visible");
        suggestions.hidden = true;
      });
    }

    function showSuggestionsAfterDelay() {
      clearSuggestionsTimer();
      hideSuggestionsInFrame();
      suggestionsTimer = window.setTimeout(function () {
        withFrameDocument(function (doc) {
          var suggestions = doc.getElementById("messageSuggestions");
          var appEl = doc.getElementById("app");
          if (!suggestions || !appEl) return;
          if (appEl.getAttribute("data-tab") !== "messages") return;
          suggestions.hidden = false;
          suggestions.classList.add("is-visible");
        });
      }, 3000);
    }

    function attachSendHideObserver() {
      withFrameDocument(function (doc) {
        var messagesEl = doc.getElementById("messages");
        if (!messagesEl || typeof MutationObserver === "undefined") return;
        if (suggestionsObserver) suggestionsObserver.disconnect();
        suggestionsObserver = new MutationObserver(function (records) {
          for (var i = 0; i < records.length; i++) {
            var added = records[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
              var node = added[j];
              if (
                node &&
                node.nodeType === 1 &&
                node.classList &&
                node.classList.contains("row--user")
              ) {
                hideSuggestionsInFrame();
                return;
              }
            }
          }
        });
        suggestionsObserver.observe(messagesEl, { childList: true });
      });
    }


    function setOpen(open) {
      if (open) {
        openChat();
        return;
      }
      root.classList.toggle("is-open", false);
      root.classList.toggle("is-closing", false);
      root.classList.remove("is-opening");
      launcher.setAttribute("aria-expanded", "false");
      document.body.classList.remove("ccw-chat-open");
    }

    function closeWithAnimation() {
      openMessagesTab();
      root.classList.add("is-closing");
      document.body.classList.remove("ccw-chat-open");
      window.setTimeout(function () {
        root.classList.remove("is-open", "is-closing", "is-opening");
        root.classList.add("ccw--close-done");
        launcher.setAttribute("aria-expanded", "false");
        launcher.focus();
        lockLauncherSize();
        startLauncherPromptRotation();
      }, 180);
    }

    launcher.addEventListener("click", openChat);

    launcher.addEventListener("pointerenter", function (e) {
      updateLauncherGlowPosition(e.clientX, e.clientY);
    });

    launcher.addEventListener("pointermove", function (e) {
      updateLauncherGlowPosition(e.clientX, e.clientY);
    });

    if (frame) {
      frame.addEventListener("load", function () {
        clearSuggestionsTimer();
        if (root.classList.contains("is-open")) {
          openMessagesTab();
          window.setTimeout(showSuggestionsAfterDelay, 80);
        }
        attachSendHideObserver();
      });
    }

    root.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("is-open")) {
        closeWithAnimation();
      }
    });

    window.addEventListener("message", function (e) {
      var d = e.data;
      if (!d || typeof d !== "object") return;
      if (d.type !== "sophie-chat") return;
      if (d.action === "close" && root.classList.contains("is-open")) {
        clearSuggestionsTimer();
        closeWithAnimation();
      }
    });

    if (typeof MutationObserver !== "undefined") {
      var navMenuObserver = new MutationObserver(function () {
        if (!document.body.classList.contains("nav-menu-open")) return;
        if (root.classList.contains("is-open")) closeWithAnimation();
      });
      navMenuObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    lockLauncherSize();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(lockLauncherSizeDebounced);
    }
    window.addEventListener("resize", lockLauncherSizeDebounced, { passive: true });
    startLauncherPromptRotation();
  }

  document.addEventListener("DOMContentLoaded", function () {
    var el = document.getElementById("corner-chat-widget");
    if (!el) return;
    mount(el);

    var scrollThreshold = 1;
    var delayMs = 2000;
    var revealTimer = null;
    var revealed = false;

    function reveal() {
      if (revealed) return;
      revealed = true;
      el.classList.add("ccw--visible");
      window.removeEventListener("scroll", onScroll);
    }

    function onScroll() {
      if (revealed) return;
      if (window.scrollY >= scrollThreshold) {
        if (!revealTimer) {
          revealTimer = window.setTimeout(reveal, delayMs);
        }
      } else {
        if (revealTimer) {
          window.clearTimeout(revealTimer);
          revealTimer = null;
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
  });
})();
