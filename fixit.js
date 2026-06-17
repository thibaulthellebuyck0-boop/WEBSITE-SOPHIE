/**
 * FixIt Public — Mapbox globe tour.
 * Starts from the world, zooms into Belgian municipalities, and highlights sample public-space reports.
 */
(function () {
  const MAPBOX_TOKEN = window.MAPBOX_PUBLIC_TOKEN || "";
  let mapboxTokenPromise = null;

  const GLOBE_START = {
    center: [-34, 26],
    zoom: 1.35,
    pitch: 48,
    bearing: -18,
  };

  const ROUTE = [
    {
      name: "Gavere",
      lng: 3.6619,
      lat: 50.9289,
      zoom: 13.35,
      reports: [
        { type: "Straatlamp", status: "Fluvius", lng: 3.6569, lat: 50.9304, urgency: "normal" },
        { type: "Sluikstort", status: "Groendienst", lng: 3.6676, lat: 50.9256, urgency: "high" },
        { type: "Losse tegel", status: "Klusjesdienst", lng: 3.6627, lat: 50.9342, urgency: "normal" },
      ],
    },
    {
      name: "Gent",
      lng: 3.7174,
      lat: 51.0543,
      zoom: 12.8,
      reports: [
        { type: "Fietspad", status: "Mobiliteit", lng: 3.7268, lat: 51.0566, urgency: "normal" },
        { type: "Afval", status: "Netheid", lng: 3.7105, lat: 51.0508, urgency: "high" },
      ],
    },
    {
      name: "Kortrijk",
      lng: 3.2649,
      lat: 50.827,
      zoom: 12.9,
      reports: [
        { type: "Signalisatie", status: "Technische dienst", lng: 3.2699, lat: 50.8291, urgency: "normal" },
        { type: "Wateroverlast", status: "Extern", lng: 3.2558, lat: 50.8238, urgency: "high" },
      ],
    },
    {
      name: "Hasselt",
      lng: 5.3378,
      lat: 50.9307,
      zoom: 12.9,
      reports: [
        { type: "Groenonderhoud", status: "Groendienst", lng: 5.3442, lat: 50.9344, urgency: "normal" },
        { type: "Put in wegdek", status: "Aannemer", lng: 5.331, lat: 50.9282, urgency: "high" },
      ],
    },
  ];

  function loadMapboxAssets() {
    if (window.mapboxgl) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="mapbox-gl.js"]');
      const existingCss = document.querySelector('link[href*="mapbox-gl.css"]');

      if (!existingCss) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.11.0/mapbox-gl.css";
        document.head.appendChild(link);
      }

      if (existingScript) {
        const wait = () => {
          if (window.mapboxgl) resolve();
          else window.setTimeout(wait, 30);
        };
        wait();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://api.mapbox.com/mapbox-gl-js/v3.11.0/mapbox-gl.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Mapbox laden mislukt"));
      document.head.appendChild(script);
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
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.dragPan.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    if (map.touchZoomRotate) map.touchZoomRotate.disable();
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
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function buildReportFeatures(reports) {
    return reports.map((report, index) => ({
      type: "Feature",
      properties: {
        id: `${report.type}-${index}`,
        typeLabel: report.type,
        status: report.status,
        urgency: report.urgency,
      },
      geometry: {
        type: "Point",
        coordinates: [report.lng, report.lat],
      },
    }));
  }

  function setActiveReports(map, city) {
    const data = {
      type: "FeatureCollection",
      features: buildReportFeatures(city.reports),
    };

    const source = map.getSource("fixit-reports");
    if (source) {
      source.setData(data);
    }
  }

  async function init() {
    const root = document.getElementById("fixit-globe-root");
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      await loadMapboxAssets();
    } catch (error) {
      root.innerHTML =
        '<p class="fixit-map-fallback" role="status">De kaart kan niet geladen worden. Controleer uw netwerkverbinding.</p>';
      return;
    }

    const token = await getMapboxToken();
    if (!token) {
      root.innerHTML =
        '<p class="fixit-map-fallback" role="status">De kaart kan niet geladen worden. Mapbox token ontbreekt op de server.</p>';
      return;
    }

    mapboxgl.accessToken = token;

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

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

    const resize = () => {
      try {
        map.resize();
      } catch {
        /* Mapbox can throw while tearing down; ignore resize races. */
      }
    };

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(resize);
      ro.observe(root);
      const hero = root.closest(".fixit-hero");
      if (hero) ro.observe(hero);
    }

    window.addEventListener("load", resize, { once: true });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("orientationchange", resize, { passive: true });
    window.setTimeout(resize, 120);
    window.setTimeout(resize, 520);

    await new Promise((resolve) => {
      if (map.loaded()) resolve();
      else map.once("load", resolve);
    });

    map.setFog({
      range: [0.4, 9],
      "horizon-blend": 0.12,
      color: "rgb(220, 232, 245)",
      "high-color": "rgb(78, 119, 201)",
      "space-color": "rgb(7, 10, 22)",
      "star-intensity": 0.28,
    });

    map.addSource("fixit-reports", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    map.addLayer({
      id: "fixit-report-halo",
      type: "circle",
      source: "fixit-reports",
      paint: {
        "circle-radius": ["case", ["==", ["get", "urgency"], "high"], 24, 18],
        "circle-color": ["case", ["==", ["get", "urgency"], "high"], "#ff5c35", "#0a84ff"],
        "circle-opacity": 0.16,
        "circle-blur": 0.25,
      },
    });

    map.addLayer({
      id: "fixit-report-dot",
      type: "circle",
      source: "fixit-reports",
      paint: {
        "circle-radius": ["case", ["==", ["get", "urgency"], "high"], 7, 5],
        "circle-color": ["case", ["==", ["get", "urgency"], "high"], "#ff5c35", "#ffffff"],
        "circle-stroke-color": "#0b0b0d",
        "circle-stroke-width": 1.5,
      },
    });

    map.addLayer({
      id: "fixit-report-label",
      type: "symbol",
      source: "fixit-reports",
      layout: {
        "text-field": ["concat", ["get", "typeLabel"], " · ", ["get", "status"]],
        "text-size": 12,
        "text-offset": [0, 1.6],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(0, 0, 0, 0.72)",
        "text-halo-width": 1.4,
      },
    });

    async function flyToCity(city, index) {
      setActiveReports(map, city);
      map.flyTo({
        center: [city.lng, city.lat],
        zoom: city.zoom,
        pitch: 58,
        bearing: -24 + index * 18,
        duration: reduced ? 1200 : index === 0 ? 12500 : 9000,
        curve: 1.42,
        essential: true,
      });
      await waitMoveEnd(map);
    }

    async function flyToGlobe() {
      map.flyTo({
        center: GLOBE_START.center,
        zoom: GLOBE_START.zoom,
        pitch: GLOBE_START.pitch,
        bearing: GLOBE_START.bearing,
        duration: reduced ? 900 : 10500,
        curve: 1.35,
        essential: true,
      });
      await waitMoveEnd(map);
    }

    async function runTour() {
      for (;;) {
        for (let i = 0; i < ROUTE.length; i += 1) {
          await flyToCity(ROUTE[i], i);
          await sleep(reduced ? 550 : 2200);
        }

        setActiveReports(map, { reports: [] });
        await flyToGlobe();
        await sleep(reduced ? 700 : 1800);
      }
    }

    resize();
    void runTour();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
