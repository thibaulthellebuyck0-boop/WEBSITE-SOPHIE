(function () {
  "use strict";

  var panels = document.querySelectorAll(".dash-panel");
  var navButtons = document.querySelectorAll("[data-dash-view]");
  var app = document.getElementById("dash-app");
  var sidebarToggle = document.getElementById("dash-sidebar-toggle");
  var backdrop = document.getElementById("dash-backdrop");

  function closeMobileNav() {
    if (app) app.classList.remove("nav-open");
    if (sidebarToggle) sidebarToggle.setAttribute("aria-expanded", "false");
  }

  function showView(id) {
    panels.forEach(function (panel) {
      panel.hidden = panel.id !== "panel-" + id;
    });

    navButtons.forEach(function (btn) {
      var active = btn.getAttribute("data-dash-view") === id;
      btn.setAttribute("aria-current", active ? "page" : "false");
    });

    closeMobileNav();
  }

  navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      showView(btn.getAttribute("data-dash-view"));
    });
  });

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", function () {
      if (!app) return;
      var open = !app.classList.contains("nav-open");
      app.classList.toggle("nav-open", open);
      sidebarToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeMobileNav);
  }

  var logoutBtn = document.getElementById("dash-logout");
  if (logoutBtn && window.SophieAuth) {
    logoutBtn.addEventListener("click", function () {
      window.SophieAuth.logout();
      window.location.href = "../login.html";
    });
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function typeText(el, text, speed) {
    return new Promise(function (resolve) {
      var index = 0;
      function tick() {
        if (index <= text.length) {
          el.textContent = text.slice(0, index);
          index += 1;
          window.setTimeout(tick, speed);
          return;
        }
        resolve();
      }
      tick();
    });
  }

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function colorizeSophie(text) {
    return escapeHtml(text).replace(/(sophie)/gi, '<span class="dash-inline-terminal__sophie">$1</span>');
  }

  function setColorizedText(el, text, welcome) {
    var cls = welcome ? "dash-welcome__sophie" : "dash-inline-terminal__sophie";
    var html = escapeHtml(text).replace(/(sophie)/gi, '<span class="' + cls + '">$1</span>');
    if (welcome) {
      html = html.replace(/(instellingen)/gi, '<span class="dash-welcome__accent">$1</span>');
    }
    el.innerHTML = html;
  }

  (function typeWelcome() {
    var el = document.getElementById("dash-typed-welcome");
    var wrap = document.querySelector(".dash-welcome-wrap");
    if (!el) return;

    (async function runWelcomeSequence() {
      await typeText(el, "Welkom bij Sophie", 70);
      setColorizedText(el, "Welkom bij Sophie", true);
      el.insertAdjacentHTML("beforeend", ' <span class="dash-welcome__wave" aria-hidden="true">\u{1F44B}</span>');
      await wait(1000);
      el.textContent = "";
      await typeText(el, "Laten we Sophie samen instellen.", 58);
      setColorizedText(el, "Laten we Sophie samen instellen.", true);
      await wait(500);
      if (wrap) wrap.classList.add("dash-welcome-wrap--corner");
    })();
  })();

  (function initDashSetupFlow() {
    var wrap = document.querySelector(".dash-welcome-wrap");
    var title = document.getElementById("dash-typed-welcome");
    var log = document.getElementById("dash-setup-log");
    var form = document.getElementById("dash-setup-form");
    var input = document.getElementById("dash-setup-input");
    var mirror = document.getElementById("dash-setup-mirror");
    var suggestions = document.getElementById("dash-setup-suggestions");
    var mapWidget = document.getElementById("dash-map-widget");
    var mapCanvas = document.getElementById("dash-map-canvas");
    if (
      !(wrap instanceof HTMLElement) ||
      !(title instanceof HTMLElement) ||
      !(log instanceof HTMLElement) ||
      !(form instanceof HTMLFormElement) ||
      !(input instanceof HTMLInputElement) ||
      !(mirror instanceof HTMLElement) ||
      !(suggestions instanceof HTMLUListElement) ||
      !(mapWidget instanceof HTMLElement) ||
      !(mapCanvas instanceof HTMLElement)
    ) {
      return;
    }

    var MAPBOX_TOKEN = window.MAPBOX_PUBLIC_TOKEN || "";
    var mapboxTokenPromise = null;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var answers = {};
    var setupStarted = false;
    var setupDone = false;
    var supportMode = false;
    var stepIndex = 0;
    var gemeenteList = [];
    var filtered = [];
    var activeIndex = 0;
    var mapboxAssetsPromise = null;
    var globeMap = null;

    var steps = [
      { key: "municipality", prompt: "Voor welke gemeente stellen we Sophie in?" },
      { key: "fullName", prompt: "Wat is de volledige naam van de basisgebruiker?" },
      { key: "email", prompt: "Wat is het e-mailadres van deze gebruiker?" },
      { key: "password", prompt: "Maak een wachtwoord aan voor deze basisaccount." },
      { key: "role", prompt: "Wat doet deze gebruiker binnen de gemeente?" },
      { key: "confirm", prompt: "Typ \"opslaan\" om de basisaccount aan te maken." }
    ];

    function sleep(ms) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, ms);
      });
    }

    function isReadyToShow() {
      return wrap.classList.contains("dash-welcome-wrap--corner");
    }

    function scrollToBottom() {
      log.scrollTop = log.scrollHeight;
    }

    function makeLine(text, className) {
      var line = document.createElement("p");
      line.className = "dash-inline-terminal__line " + className;
      line.innerHTML = colorizeSophie(text);
      return line;
    }

    async function typeBotLine(text) {
      var line = makeLine("", "dash-inline-terminal__line--bot");
      log.appendChild(line);
      scrollToBottom();
      if (reduced) {
        line.innerHTML = colorizeSophie(text);
        return;
      }
      for (var i = 0; i < text.length; i++) {
        line.textContent += text[i];
        if (i % 4 === 0 || i === text.length - 1) scrollToBottom();
        await sleep(18 + Math.random() * 22);
      }
      line.innerHTML = colorizeSophie(text);
    }

    function pushUserLine(text) {
      log.appendChild(makeLine("beheer@sophie % " + text, "dash-inline-terminal__line--user"));
      scrollToBottom();
    }

    function syncMirror() {
      if (currentStepKey() === "password") {
        mirror.textContent = "\u2022".repeat(input.value.length);
        return;
      }
      mirror.textContent = input.value;
    }

    function normalize(text) {
      return text
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .trim();
    }

    function normalizeLoose(text) {
      return normalize(text).replace(/[-'\s]+/g, "");
    }

    function currentStepKey() {
      var current = steps[stepIndex];
      return current ? current.key : "";
    }

    function isEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function applyInputMode() {
      var key = currentStepKey();
      if (supportMode) {
        input.type = "text";
        input.autocomplete = "off";
        return;
      }
      if (key === "password") {
        input.type = "password";
        input.autocomplete = "new-password";
        return;
      }
      if (key === "email") {
        input.type = "email";
        input.autocomplete = "email";
        return;
      }
      input.type = "text";
      input.autocomplete = "off";
    }

    async function animateSupportTitle(text) {
      title.textContent = "";
      await typeText(title, text, 42);
      setColorizedText(title, text, true);
      title.insertAdjacentHTML("beforeend", ' <span class="dash-welcome__wave dash-welcome__wave--loop" aria-hidden="true">\u{1F44B}</span>');
    }

    function hideSuggestions() {
      suggestions.hidden = true;
      suggestions.replaceChildren();
      filtered = [];
      activeIndex = 0;
      input.setAttribute("aria-expanded", "false");
    }

    function applySuggestion(value) {
      input.value = value;
      syncMirror();
      hideSuggestions();
    }

    function renderSuggestions() {
      suggestions.replaceChildren();
      if (!filtered.length) {
        hideSuggestions();
        return;
      }
      suggestions.hidden = false;
      input.setAttribute("aria-expanded", "true");
      filtered.forEach(function (name, index) {
        var li = document.createElement("li");
        li.className =
          "dash-inline-terminal__suggestion" + (index === activeIndex ? " dash-inline-terminal__suggestion--active" : "");
        li.textContent = name;
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", index === activeIndex ? "true" : "false");
        li.addEventListener("mousedown", function (event) {
          event.preventDefault();
          applySuggestion(name);
          void submitCurrent();
        });
        suggestions.appendChild(li);
      });
    }

    function filterSuggestions() {
      if (currentStepKey() !== "municipality") {
        hideSuggestions();
        return;
      }
      var raw = input.value.trim();
      if (!raw) {
        hideSuggestions();
        return;
      }
      var q = normalize(raw);
      var qLoose = normalizeLoose(raw);
      filtered = gemeenteList
        .filter(function (name) {
          var n = normalize(name);
          var l = normalizeLoose(name);
          return n.startsWith(q) || n.includes(q) || l.includes(qLoose);
        })
        .slice(0, 10);
      activeIndex = 0;
      renderSuggestions();
    }

    function resolveMunicipality(inputValue) {
      var loose = normalizeLoose(inputValue);
      return gemeenteList.find(function (name) {
        return normalizeLoose(name) === loose;
      });
    }

    function getFallbackGemeenten() {
      return [
        "Aalst",
        "Antwerpen",
        "Brugge",
        "Brussel",
        "Genk",
        "Gent",
        "Hasselt",
        "Kortrijk",
        "Leuven",
        "Mechelen",
        "Oostende",
        "Roeselare",
        "Sint-Niklaas",
        "Turnhout",
        "Zottegem"
      ];
    }

    function loadMapboxAssets() {
      if (window.mapboxgl) return Promise.resolve();
      if (!mapboxAssetsPromise) {
        mapboxAssetsPromise = new Promise(function (resolve, reject) {
          var link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://api.mapbox.com/mapbox-gl-js/v3.11.0/mapbox-gl.css";
          document.head.appendChild(link);
          var script = document.createElement("script");
          script.src = "https://api.mapbox.com/mapbox-gl-js/v3.11.0/mapbox-gl.js";
          script.async = true;
          script.onload = function () {
            resolve();
          };
          script.onerror = function () {
            reject(new Error("Mapbox laden mislukt"));
          };
          document.head.appendChild(script);
        });
      }
      return mapboxAssetsPromise;
    }

    async function getMapboxToken() {
      if (MAPBOX_TOKEN) return MAPBOX_TOKEN;
      var fromWindow = String(window.MAPBOX_PUBLIC_TOKEN || "").trim();
      if (fromWindow) return fromWindow;
      var metaEl = document.querySelector('meta[name="mapbox-public-token"]');
      var fromMeta = String((metaEl && metaEl.content) || "").trim();
      if (fromMeta) return fromMeta;
      if (!mapboxTokenPromise) {
        mapboxTokenPromise = fetch("/api/mapbox-token", {
          method: "GET",
          headers: { Accept: "application/json" }
        })
          .then(function (res) {
            return res.ok ? res.json() : null;
          })
          .then(function (json) {
            return String((json && json.token) || "").trim();
          })
          .catch(function () {
            return "";
          });
      }
      return mapboxTokenPromise;
    }

    async function ensureMap() {
      await loadMapboxAssets();
      if (!window.mapboxgl) return;
      var token = await getMapboxToken();
      if (!token) throw new Error("Mapbox token ontbreekt");
      mapboxgl.accessToken = token;
      if (!globeMap) {
        globeMap = new mapboxgl.Map({
          container: mapCanvas,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [-30, 24],
          zoom: 1.4,
          pitch: 52,
          bearing: -12,
          projection: "globe",
          antialias: true
        });
        globeMap.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");
      } else {
        globeMap.resize();
      }
      await new Promise(function (resolve) {
        if (globeMap.loaded()) resolve();
        else globeMap.once("load", resolve);
      });
      globeMap.setFog({
        range: [0.5, 10],
        "horizon-blend": 0.08,
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(54, 118, 235)",
        "space-color": "rgb(8, 10, 28)",
        "star-intensity": 0.42
      });
    }

    async function geocodeMunicipality(name) {
      var token = await getMapboxToken();
      if (!token) return null;
      var path = encodeURIComponent(name + ", Vlaams Gewest, België");
      var url =
        "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
        path +
        ".json?access_token=" +
        token +
        "&limit=1&country=be&proximity=4.4699,50.5039";
      var res = await fetch(url);
      if (!res.ok) return null;
      var json = await res.json();
      var center = json.features && json.features[0] && json.features[0].center;
      return Array.isArray(center) && center.length >= 2 ? center : null;
    }

    async function zoomToMunicipality(name) {
      mapWidget.hidden = false;
      try {
        await ensureMap();
        if (!globeMap) return;
        var center = (await geocodeMunicipality(name)) || [4.4699, 50.5039];
        globeMap.flyTo({
          center: center,
          zoom: 11.5,
          pitch: 58,
          bearing: 28,
          duration: reduced ? 450 : 9000,
          essential: true
        });
      } catch (error) {
        mapWidget.hidden = true;
      }
    }

    async function waitForCorner() {
      while (!isReadyToShow()) {
        await sleep(80);
      }
    }

    async function askCurrentStep() {
      if (stepIndex >= steps.length) return;
      applyInputMode();
      await typeBotLine(steps[stepIndex].prompt);
      if (steps[stepIndex].key === "municipality") {
        await typeBotLine("Typ een paar letters en kies uit de suggesties.");
      }
    }

    async function startSetup() {
      setupStarted = true;
      await typeBotLine("Top. We stellen Sophie nu stap voor stap in.");
      await askCurrentStep();
    }

    async function enterSupportMode() {
      supportMode = true;
      hideSuggestions();
      wrap.classList.add("dash-welcome-wrap--support");
      mapWidget.classList.add("dash-map-widget--flyout");
      window.setTimeout(function () {
        mapWidget.hidden = true;
      }, 620);
      await animateSupportTitle("Heb je een vraag over de instellingen?");
      form.hidden = false;
      input.value = "";
      applyInputMode();
      syncMirror();
      input.placeholder = "Typ je vraag over instellingen en druk op Enter";
      input.focus();
    }

    async function finishSetup() {
      setupDone = true;
      hideSuggestions();
      await typeBotLine("Basisaccount ontvangen. Samenvatting:");
      await typeBotLine("- Gemeente: " + (answers.municipality || "niet ingevuld"));
      await typeBotLine("- Naam: " + (answers.fullName || "niet ingevuld"));
      await typeBotLine("- E-mail: " + (answers.email || "niet ingevuld"));
      await typeBotLine("- Rol: " + (answers.role || "niet ingevuld"));
      await typeBotLine("Je kan later meerdere accounts aanmaken via Instellingen.");
      await typeBotLine(
        "Ik ben de instellingenpagina. Je kan nu Sophie verkennen. Heb je vragen over het systeem zelf, of wil je dat ik instellingen aanpas, dan kan je hier terecht."
      );
      await typeBotLine("Veel succes! Op naar een gemeente van de toekomst!");
      await enterSupportMode();
    }

    async function submitCurrent() {
      var value = input.value.trim();
      if (!value) return;
      var keyBeforeSubmit = setupStarted && !setupDone && steps[stepIndex] ? steps[stepIndex].key : "";
      var displayValue = keyBeforeSubmit === "password" ? "\u2022".repeat(value.length) : value;
      input.value = "";
      syncMirror();
      pushUserLine(displayValue);

      if (supportMode) {
        hideSuggestions();
        await typeBotLine("Dank je, ik heb je vraag genoteerd. Ik help je hier verder met de instellingen.");
        input.focus();
        return;
      }

      if (!setupStarted) {
        hideSuggestions();
        if (value.toLowerCase() !== "ja") {
          await typeBotLine('Typ "ja" om het instellen te starten.');
          input.focus();
          return;
        }
        await startSetup();
        input.focus();
        return;
      }

      if (setupDone) return;
      var current = steps[stepIndex];
      if (!current) return;

      if (current.key === "confirm") {
        hideSuggestions();
        if (value.toLowerCase() !== "opslaan") {
          await typeBotLine('Bevestig met "opslaan".');
          input.focus();
          return;
        }
        await finishSetup();
        return;
      }

      if (current.key === "municipality") {
        var resolved = resolveMunicipality(value);
        if (!resolved) {
          await typeBotLine("Ik herken die gemeente niet in Vlaanderen. Kies uit de suggesties.");
          input.value = value;
          syncMirror();
          filterSuggestions();
          input.focus();
          return;
        }
        answers[current.key] = resolved;
        hideSuggestions();
        await zoomToMunicipality(resolved);
      } else if (current.key === "email") {
        hideSuggestions();
        if (!isEmail(value)) {
          await typeBotLine("Dat lijkt geen geldig e-mailadres. Probeer opnieuw.");
          input.focus();
          return;
        }
        answers[current.key] = value;
      } else if (current.key === "password") {
        hideSuggestions();
        if (value.length < 8) {
          await typeBotLine("Gebruik minstens 8 tekens voor het wachtwoord.");
          input.focus();
          return;
        }
        answers[current.key] = value;
      } else {
        hideSuggestions();
        answers[current.key] = value;
      }

      stepIndex += 1;
      await askCurrentStep();
      input.focus();
    }

    async function boot() {
      await waitForCorner();
      try {
        var municipalityRes = await fetch("../vlaamse-gemeenten.json");
        var municipalityData = await municipalityRes.json();
        gemeenteList = Array.isArray(municipalityData) && municipalityData.length ? municipalityData : getFallbackGemeenten();
      } catch (error) {
        gemeenteList = getFallbackGemeenten();
      }
      await typeBotLine("Ben je er klaar voor?");
      await typeBotLine('Typ "ja" om te starten.');
      form.hidden = false;
      applyInputMode();
      syncMirror();
      input.focus();
    }

    input.addEventListener("input", function () {
      syncMirror();
      filterSuggestions();
    });

    input.addEventListener("keydown", function (event) {
      if (!setupStarted || currentStepKey() !== "municipality" || suggestions.hidden || !filtered.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex = (activeIndex + 1) % filtered.length;
        renderSuggestions();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
        renderSuggestions();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        hideSuggestions();
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (
        setupStarted &&
        !setupDone &&
        currentStepKey() === "municipality" &&
        filtered.length &&
        !suggestions.hidden
      ) {
        applySuggestion(filtered[activeIndex] || filtered[0]);
      }
      void submitCurrent();
    });

    void boot();
  })();
})();