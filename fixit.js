/**
 * FixIt — Mapbox globe: start als wereldbol, daarna vaste route door Vlaanderen/België.
 * Zelfde publieke token als main.js (contact / geocoding).
 */
(function () {
  const MAPBOX_TOKEN = window.MAPBOX_PUBLIC_TOKEN || "";
  let mapboxTokenPromise = null;

  /** Startweergave: volledige wereldbol (zelfde idee als contact-globe). [lng, lat] */
  const GLOBE_START = {
    center: [-40, 28],
    zoom: 1.48,
    pitch: 50,
    bearing: -16,
  };

  /**
   * Vaste volgorde — [lng, lat] Mapbox-conventie
   * Gavere → Gent → Pittem → Kortrijk → Hasselt → Oosterzele → Merelbeke → Luik → Charleroi → Brussel
   */
  const ROUTE = [
    { name: "Gavere", lng: 3.6619, lat: 50.9289 },
    { name: "Gent", lng: 3.7174, lat: 51.0543 },
    { name: "Pittem", lng: 3.3278, lat: 50.9917 },
    { name: "Kortrijk", lng: 3.2649, lat: 50.827 },
    { name: "Hasselt", lng: 5.3378, lat: 50.9307 },
    { name: "Oosterzele", lng: 3.7756, lat: 50.9456 },
    { name: "Merelbeke", lng: 3.7461, lat: 51.0017 },
    { name: "Luik", lng: 5.5797, lat: 50.6326 },
    { name: "Charleroi", lng: 4.4446, lat: 50.4108 },
    { name: "Brussel", lng: 4.3517, lat: 50.8503 },
  ];

  function loadMapboxAssets() {
    if (window.mapboxgl) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('link[href*="mapbox-gl.css"]');
      if (existing) {
        const wait = () => {
          if (window.mapboxgl) resolve();
          else setTimeout(wait, 30);
        };
        wait();
        return;
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.11.0/mapbox-gl.css";
      document.head.appendChild(link);
      const s = document.createElement("script");
      s.src = "https://api.mapbox.com/mapbox-gl-js/v3.11.0/mapbox-gl.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Mapbox laden mislukt"));
      document.head.appendChild(s);
    });
  }

  async function getMapboxToken() {
    if (MAPBOX_TOKEN) return MAPBOX_TOKEN;
    const fromWindow = String(window.MAPBOX_PUBLIC_TOKEN || "").trim();
    if (fromWindow) return fromWindow;
    const metaEl = document.querySelector('meta[name="mapbox-public-token"]');
    const fromMeta = String(metaEl?.content || "").trim();
    if (fromMeta) return fromMeta;
    if (!mapboxTokenPromise) {
      mapboxTokenPromise = fetch("/api/mapbox-token", {
        method: "GET",
        headers: { Accept: "application/json" },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => String(json?.token || "").trim())
        .catch(() => "");
    }
    return mapboxTokenPromise;
  }

  function disableMapInteractions(map) {
    try {
      map.scrollZoom.disable();
      map.boxZoom.disable();
      map.dragRotate.disable();
      map.dragPan.disable();
      map.keyboard.disable();
      map.doubleClickZoom.disable();
      if (map.touchZoomRotate) map.touchZoomRotate.disable();
    } catch (e) {
      /* ignore */
    }
  }

  function waitMoveEnd(map) {
    return new Promise((resolve) => {
      function done() {
        if (map.isMoving && map.isMoving()) {
          map.once("moveend", done);
          return;
        }
        resolve();
      }
      map.once("moveend", done);
    });
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function init() {
    const root = document.getElementById("fixit-globe-root");
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      await loadMapboxAssets();
    } catch (e) {
      root.innerHTML =
        '<p class="fixit-map-fallback" role="status">De kaart kan niet geladen worden. Controleer je netwerkverbinding.</p>';
      return;
    }

    const token = await getMapboxToken();
    if (!token) {
      root.innerHTML =
        '<p class="fixit-map-fallback" role="status">De kaart kan niet geladen worden. Mapbox token ontbreekt op de server.</p>';
      return;
    }
    mapboxgl.accessToken = token;

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const map = new mapboxgl.Map({
      container: root,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: GLOBE_START.center,
      zoom: GLOBE_START.zoom,
      pitch: GLOBE_START.pitch,
      bearing: GLOBE_START.bearing,
      projection: "globe",
      antialias: true,
      attributionControl: true,
      failIfMajorPerformanceCaveat: false,
    });

    root._fixitMap = map;
    disableMapInteractions(map);

    function triggerResize() {
      try {
        map.resize();
      } catch (e) {
        /* ignore */
      }
    }

    const heroEl = root.closest(".fixit-hero");
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => triggerResize());
      ro.observe(root);
      if (heroEl) ro.observe(heroEl);
    }

    window.addEventListener("load", () => triggerResize(), { once: true });
    window.setTimeout(triggerResize, 100);
    window.setTimeout(triggerResize, 400);

    map.on("error", (e) => {
      if (e && e.error) {
        console.warn("[FixIt map]", e.error);
      }
    });

    await new Promise((resolve) => {
      if (map.loaded()) resolve();
      else map.once("load", resolve);
    });

    map.resize();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    map.resize();

    /**
     * Niet wachten op `idle`: dat kan seconden duren (alle tegels laden) — dan blijft de kaart stil.
     * Eén frame is genoeg om het canvas te laten meten; daarna mag de tour starten.
     */
    await new Promise((r) => requestAnimationFrame(r));

    map.setFog({
      range: [0.5, 10],
      "horizon-blend": 0.1,
      color: "rgb(186, 210, 235)",
      "high-color": "rgb(54, 118, 235)",
      "space-color": "rgb(22, 28, 48)",
      "star-intensity": 0.35,
    });

    function flyToView(opts) {
      const duration = opts.duration != null ? opts.duration : reduced ? 800 : 12000;
      map.flyTo({
        center: opts.center,
        zoom: opts.zoom,
        pitch: opts.pitch != null ? opts.pitch : 50,
        bearing: opts.bearing != null ? opts.bearing : GLOBE_START.bearing,
        duration,
        curve: 1.35,
        essential: true,
      });
      return waitMoveEnd(map);
    }

    function flyToCity(target, legIndex, options) {
      const o = options || {};
      const duration = o.duration != null ? o.duration : reduced ? 1400 : 12500;
      map.flyTo({
        center: [target.lng, target.lat],
        zoom: o.zoom != null ? o.zoom : 13.35,
        pitch: o.pitch != null ? o.pitch : 56,
        bearing: o.bearing != null ? o.bearing : -20 + (legIndex * 17) % 55,
        duration,
        curve: 1.35,
        essential: true,
      });
      return waitMoveEnd(map);
    }

    let tourRunning = false;

    async function runTour() {
      if (tourRunning) return;
      tourRunning = true;
      try {
        /* Kaart start al op de wereldbol — eerste vlucht is de lange zoom naar Gavere. */
        for (let i = 0; i < ROUTE.length; i++) {
          const city = ROUTE[i];
          const firstFromGlobe = i === 0;
          await flyToCity(city, i, {
            zoom: 13.25 + (i % 4) * 0.06,
            pitch: 56 + (i % 3),
            duration: reduced ? (firstFromGlobe ? 1600 : 1200) : firstFromGlobe ? 17000 : 11800,
          });
          await sleep(reduced ? 500 : 2000);
        }

        await flyToView({
          center: GLOBE_START.center,
          zoom: GLOBE_START.zoom,
          pitch: GLOBE_START.pitch,
          bearing: GLOBE_START.bearing,
          duration: reduced ? 900 : 14000,
        });
        await sleep(reduced ? 800 : 2800);
      } finally {
        tourRunning = false;
      }

      window.setTimeout(runTour, reduced ? 600 : 2000);
    }

    void runTour();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("resize", () => {
    const root = document.getElementById("fixit-globe-root");
    if (root && root._fixitMap) {
      root._fixitMap.resize();
    }
  });
})();
