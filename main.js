document.documentElement.classList.add("js");

/**
 * Basis-URL voor `/api/submissions` (leeg = zelfde origin).
 * Zet `data-api-base="https://jouw-project.vercel.app"` op `<html>` om lokaal tegen een gedeployde API te testen.
 */
function getFormApiBase() {
  const raw = document.documentElement.getAttribute("data-api-base");
  if (raw == null || raw === "") return "";
  return raw.replace(/\/$/, "");
}

/** `data-form-demo` op `<html>`: verzenden toont succes zonder werkende API (presentaties / statische demo). */
function isFormDemoMode() {
  return document.documentElement.hasAttribute("data-form-demo");
}

/**
 * @param {"contact" | "recruit"} form
 * @param {Record<string, string>} payload
 */
async function submitToCms(form, payload) {
  const base = getFormApiBase();
  const url = `${base}/api/submissions`;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form, payload, website: "" }),
    });
  } catch {
    if (isFormDemoMode()) return;
    throw new Error(
      "Geen verbinding met de formulier-server. Open de site via je Vercel-adres, of zet op <html> het attribuut data-api-base naar die URL (lokaal testen tegen productie)."
    );
  }

  const raw = await res.text();
  /** @type {{ error?: string }} */
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    if (isFormDemoMode()) return;
    if (typeof data.error === "string" && data.error) {
      throw new Error(data.error);
    }
    if (res.status === 404) {
      throw new Error(
        "Formulier-API niet gevonden. Controleer of deze map op Vercel staat met /api/submissions, of zet data-api-base op je project-URL."
      );
    }
    throw new Error(`Verzenden mislukt (HTTP ${res.status}). Controleer Vercel-logs en Supabase-instellingen.`);
  }
}

(function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();

(function initNavActive() {
  const navItems = document.querySelectorAll(".nav__links .nav-item");
  if (!navItems.length) return;

  function currentFile() {
    let name = window.location.pathname.split("/").pop() || "";
    name = name.split("?")[0].split("#")[0];
    if (!name || name === "/") return "index.html";
    return name;
  }

  const file = currentFile();

  navItems.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const target = href.split("#")[0].split("/").pop();
    const active = target === file;
    link.classList.toggle("nav-item--active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
})();

(function initNavPill() {
  const nav = document.querySelector(".nav__links");
  const pill = document.querySelector(".nav__pill");
  if (!nav || !pill) return;

  const targets = Array.from(nav.querySelectorAll(".nav-pill-target"));
  if (!targets.length) return;

  let hoverTarget = null;

  function getActiveTarget() {
    return nav.querySelector(".nav-item--active");
  }

  function resolveTarget() {
    if (hoverTarget) return hoverTarget;
    const ae = document.activeElement;
    if (ae && nav.contains(ae)) {
      const wrap = ae.closest(".nav-pill-target");
      if (wrap && targets.includes(wrap)) return wrap;
    }
    return getActiveTarget();
  }

  function moveTo(el) {
    if (!el) return;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    pill.style.opacity = "1";
    pill.style.left = `${elRect.left - navRect.left + nav.scrollLeft}px`;
    pill.style.top = `${elRect.top - navRect.top + nav.scrollTop}px`;
    pill.style.width = `${elRect.width}px`;
    pill.style.height = `${elRect.height}px`;
  }

  function moveToIdle() {
    hoverTarget = null;
    const t = getActiveTarget();
    if (t) moveTo(t);
    else pill.style.opacity = "0";
  }

  targets.forEach((t) => {
    t.addEventListener("mouseenter", () => {
      hoverTarget = t;
      moveTo(t);
    });
    t.addEventListener("focusin", () => moveTo(t));
  });

  nav.addEventListener("mouseleave", () => moveToIdle());

  nav.addEventListener("focusout", (e) => {
    if (nav.contains(e.relatedTarget)) return;
    moveToIdle();
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const t = resolveTarget();
      if (t) moveTo(t);
      else pill.style.opacity = "0";
    }, 40);
  });

  pill.classList.add("nav__pill--no-motion");
  moveToIdle();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      pill.classList.remove("nav__pill--no-motion");
    });
  });
})();

(function initNavMobileMenu() {
  const header = document.querySelector(".nav");
  const toggle = document.querySelector(".nav__menu");
  const links = header?.querySelector("#nav-primary");
  if (!header || !toggle || !links) return;

  function setOpen(open) {
    const on = Boolean(open);
    header.classList.toggle("nav--menu-open", on);
    toggle.setAttribute("aria-expanded", on ? "true" : "false");
    toggle.setAttribute("aria-label", on ? "Menu sluiten" : "Menu openen");
    document.body.classList.toggle("nav-menu-open", on);
  }

  toggle.addEventListener("click", () => setOpen(!header.classList.contains("nav--menu-open")));

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("nav--menu-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    }, 80);
  });
})();

(function initSophieModulesSphere() {
  const canvas = document.getElementById("sophie-modules-sphere");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = 680;
  const H = 680;
  const CX = W / 2;
  const CY = H / 2;
  const R = 250;

  let nodes = [];
  let edges = [];
  let pulses = [];
  let rotX = 0.3;
  let rotY = 0;
  let dX = 0;
  let dY = 0.003;
  let dragging = false;
  let lx = 0;
  let ly = 0;

  function init() {
    nodes = [];
    const n = 60;
    const phi = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < n; i++) {
      const t = Math.acos(1 - (2 * (i + 0.5)) / n);
      const p = (2 * Math.PI * i) / phi;
      nodes.push({
        x: R * Math.sin(t) * Math.cos(p),
        y: R * Math.sin(t) * Math.sin(p),
        z: R * Math.cos(t),
        pulse: 0,
      });
    }

    edges = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < R * 0.56) edges.push([i, j]);
      }
    }
  }

  function proj(x, y, z) {
    const cx = Math.cos(rotX);
    const sx = Math.sin(rotX);
    const cy = Math.cos(rotY);
    const sy = Math.sin(rotY);
    const y2 = y * cx - z * sx;
    const z2 = y * sx + z * cx;
    const x3 = x * cy + z2 * sy;
    const z3 = -x * sy + z2 * cy;
    const f = 900 / (900 + z3 + R);
    return { sx: CX + x3 * f, sy: CY + y2 * f, z: z3, f };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    rotY += dY;
    rotX += dX;
    dX *= 0.95;
    const p = nodes.map((n) => proj(n.x, n.y, n.z));

    edges.forEach(([i, j]) => {
      const a = p[i];
      const b = p[j];
      const depth = ((a.z + b.z) / 2 + R) / (2 * R);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle = `rgba(249,115,22,${0.08 + 0.24 * depth})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    });

    pulses = pulses.filter((q) => q.t < 1);
    pulses.forEach((q) => {
      q.t += 0.02;
      const [i, j] = q.e;
      const a = p[i];
      const b = p[j];
      const tx = a.sx + (b.sx - a.sx) * q.t;
      const ty = a.sy + (b.sy - a.sy) * q.t;
      const depth = ((a.z + b.z) / 2 + R) / (2 * R);
      ctx.beginPath();
      ctx.arc(tx, ty, 2 + 3 * depth, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251,146,60,0.96)";
      ctx.fill();
      if (q.t > 0.95) nodes[j].pulse = 8;
    });

    nodes.forEach((node, i) => {
      if (node.pulse > 0) {
        node.pulse -= 0.2;
        if (node.pulse > 5 && Math.random() < 0.06) {
          const connected = edges.filter((e) => e[0] === i || e[1] === i);
          if (connected.length) {
            pulses.push({ e: connected[Math.floor(Math.random() * connected.length)], t: 0 });
          }
        }
      }
    });
    if (Math.random() < 0.02) {
      nodes[Math.floor(Math.random() * nodes.length)].pulse = 10;
    }

    const order = [...Array(nodes.length).keys()].sort((a, b) => p[a].z - p[b].z);
    order.forEach((i) => {
      const q = p[i];
      const n = nodes[i];
      const depth = (q.z + R) / (2 * R);
      const r = Math.max(1.5, (2 + 4 * depth) * q.f);
      if (n.pulse > 0) {
        const g = ctx.createRadialGradient(q.sx, q.sy, 0, q.sx, q.sy, r * 3.5);
        g.addColorStop(0, "rgba(255,166,94,0.5)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(q.sx, q.sy, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(q.sx, q.sy, r, 0, Math.PI * 2);
      ctx.fillStyle = n.pulse > 0 ? "rgba(255,193,129,0.98)" : `rgba(249,115,22,${0.24 + 0.64 * depth})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  canvas.addEventListener("mousedown", (e) => {
    dragging = true;
    lx = e.clientX;
    ly = e.clientY;
    dX = 0;
    dY = 0;
    canvas.style.cursor = "grabbing";
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    dY += (e.clientX - lx) * 0.003;
    dX += (e.clientY - ly) * 0.002;
    lx = e.clientX;
    ly = e.clientY;
  });
  canvas.addEventListener("mouseup", () => {
    dragging = false;
    canvas.style.cursor = "grab";
  });
  canvas.addEventListener("mouseleave", () => {
    dragging = false;
    canvas.style.cursor = "grab";
  });
  canvas.addEventListener(
    "touchstart",
    (e) => {
      lx = e.touches[0].clientX;
      ly = e.touches[0].clientY;
      dX = 0;
      dY = 0;
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      dY += (e.touches[0].clientX - lx) * 0.003;
      dX += (e.touches[0].clientY - ly) * 0.002;
      lx = e.touches[0].clientX;
      ly = e.touches[0].clientY;
    },
    { passive: true }
  );

  init();
  requestAnimationFrame(draw);
})();

document.querySelector(".cta__form")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (isFormDemoMode()) {
    form.reset();
    alert("Bedankt! (Demo — je aanmelding wordt hier niet opgeslagen.)");
    return;
  }
  alert("Dit formulier is nog niet gekoppeld aan een backend. Zet data-form-demo op <html> voor een demomodus, of koppel de API.");
});

(function initHeroTerminals() {
  /** @type {Record<string, { gradient?: boolean, pinkBlink?: boolean, text: string }[][]>} */
  const configs = {
    "home-hero-stage": [
      [{ text: "De eerste AI-agent", gradient: false }],
      [{ text: "voor gemeenten en steden", gradient: true }],
    ],
    "sophie-hero-stage": [
      [{ text: "Sophie — De eerste AI-chatbot/agent ", gradient: false }],
      [
        { text: "speciaal ontwikkeld", gradient: true },
        { text: " voor steden en gemeenten", gradient: false },
      ],
    ],
    "over-ons-hero-stage": [
      [{ text: "Hoe artificiële intelligentie uw gemeente ", gradient: false }],
      [
        { text: "digitaal", gradient: true },
        { text: " zal transformeren", gradient: false },
      ],
    ],
    "fixit-hero-stage": [
      [{ text: "FixIt — ", gradient: false }, { text: "Coming soon", gradient: true }],
    ],
    "sophie-modules-stage": [
      [
        { text: "Modules — de \u2018handen\u2019 van ", gradient: false },
        { text: "Sophie", gradient: true },
      ],
    ],
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function makeCaret() {
    const el = document.createElement("span");
    el.className = "typewriter__caret";
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  function delayMs() {
    return 26 + Math.random() * 38;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function typeInto(el, text) {
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      await sleep(delayMs());
    }
  }

  function segmentSpan(seg) {
    const el = document.createElement("span");
    if (seg.gradient) el.className = "hero__gradient";
    else if (seg.pinkBlink) el.className = "sophie-module-title__pink";
    return el;
  }

  /**
   * @param {HTMLElement} stage
   * @param {{ gradient?: boolean, pinkBlink?: boolean, text: string }[][]} rows
   * @returns {Promise<void>}
   */
  async function runTerminalTyping(stage, rows) {
    stage.innerHTML = "";

    if (reduced) {
      rows.forEach((rowSegments, r) => {
        const line = document.createElement("span");
        line.className = "hero-terminal__line";
        const spans = rowSegments.map((seg) => {
          const el = segmentSpan(seg);
          el.textContent = seg.text;
          return el;
        });
        const isLast = r === rows.length - 1;
        line.append(...spans);
        if (isLast) {
          const tail = spans[spans.length - 1];
          const caret = makeCaret();
          if (tail) tail.appendChild(caret);
          else line.appendChild(caret);
        }
        stage.appendChild(line);
      });
      return;
    }

    for (let r = 0; r < rows.length; r++) {
      const rowSegments = rows[r];
      const line = document.createElement("span");
      line.className = "hero-terminal__line";
      const spans = rowSegments.map(segmentSpan);
      const caret = makeCaret();
      const tail = spans[spans.length - 1];
      line.append(...spans);
      if (tail) tail.appendChild(caret);
      else line.appendChild(caret);
      stage.appendChild(line);
      for (let i = 0; i < rowSegments.length; i++) {
        await typeInto(spans[i], rowSegments[i].text);
      }
      if (r < rows.length - 1) caret.remove();
    }
  }

  /**
   * @param {HTMLElement} stage
   * @param {{ gradient?: boolean, pinkBlink?: boolean, text: string }[][]} rows
   */
  function mountTerminal(stage, rows) {
    void runTerminalTyping(stage, rows);
  }

  Object.keys(configs).forEach((id) => {
    if (id === "sophie-modules-stage") return;
    const stage = document.getElementById(id);
    if (!stage) return;
    mountTerminal(stage, configs[id]);
  });

  /** Sophie-modules-sectie: eerst de h2-terminal, daarna de vier moduletitels (zelfde animatie als elders). */
  (function mountSophieModulesSectionTerminals() {
    /** @type {Record<string, { gradient?: boolean, pinkBlink?: boolean, text: string }[][]>} */
    const blockConfigs = {
      "sophie-module-stage-agenda": [[{ text: "Agenda", gradient: false }]],
      "sophie-module-stage-meldingen": [[{ text: "Meldingen", gradient: false }]],
      "sophie-module-stage-community": [[{ text: "Community", gradient: false }]],
      "sophie-module-stage-direct-contact": [
        [
          { text: "Direct ", gradient: false },
          { text: "contact", pinkBlink: true },
        ],
      ],
    };
    const blockIds = Object.keys(blockConfigs);
    const mainStage = document.getElementById("sophie-modules-stage");
    const section = document.querySelector(".sophie-modules-dark");
    if (!section || (!mainStage && !blockIds.some((id) => document.getElementById(id)))) return;

    const mainRows = configs["sophie-modules-stage"];

    async function runAllInOrder() {
      if (mainStage && mainRows) {
        await runTerminalTyping(mainStage, mainRows);
        if (!reduced) await sleep(220);
      }
      for (const id of blockIds) {
        const stage = document.getElementById(id);
        if (!stage) continue;
        await runTerminalTyping(stage, blockConfigs[id]);
        if (!reduced) await sleep(200);
      }
    }

    if (reduced) {
      void runAllInOrder();
      return;
    }

    let started = false;
    const io = new IntersectionObserver(
      async (entries, observer) => {
        if (started || !entries[0]?.isIntersecting) return;
        started = true;
        observer.disconnect();
        await runAllInOrder();
      },
      { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.12 }
    );
    io.observe(section);
  })();

  (function initLoginHeroRotation() {
    const stage = document.getElementById("login-hero-stage");
    const live = document.getElementById("login-hero-live");
    if (!stage) return;

    /** @type {{ gradient?: boolean, text: string }[][][]} */
    const slogans = [
      // Bestaande + verbeterd
      [
        [
          { text: "Pioneering ", gradient: false },
          { text: "artificial intelligence", gradient: true },
        ],
        [{ text: "for local authorities", gradient: false }],
      ],
      [
        [
          { text: "Built for ", gradient: false },
          { text: "the authorities", gradient: true },
          { text: " that serve millions.", gradient: false },
        ],
      ],
      [
        [
          { text: "Minder wachtrijen. ", gradient: false },
          { text: "Meer antwoorden. ", gradient: true },
          { text: "Altijd bereikbaar.", gradient: false },
        ],
      ],
      [
        [{ text: "Sophie — ", gradient: false }],
        [{ text: "The layer on top", gradient: true }],
      ],
      // Extra — kort & krachtig
      [
        [{ text: "Uw gemeente. ", gradient: false }],
        [{ text: "24/7 bereikbaar.", gradient: true }],
      ],
      [
        [
          { text: "De burger geholpen. ", gradient: true },
          { text: "Uw loket ontlast.", gradient: false },
        ],
      ],
      [
        [{ text: "Slim gebouwd voor elke gemeente. ", gradient: false }],
        [{ text: "Vanaf dag één.", gradient: true }],
      ],
      [
        [
          { text: "Van vraag naar antwoord ", gradient: false },
          { text: "— zonder wachten.", gradient: true },
        ],
      ],
      [
        [{ text: "Speciaal gebouwd voor steden en gemeenten. ", gradient: false }],
        [{ text: "Niet aangepast. Niet gegeneriek.", gradient: true }],
      ],
      [
        [
          { text: "Wij zetten de standaard voor ", gradient: false },
          { text: "digitale dienstverlening", gradient: true },
          { text: " in Vlaanderen.", gradient: false },
        ],
      ],
      // Extra — ambitieus
      [
        [
          { text: "De gemeente van morgen ", gradient: false },
          { text: "begint vandaag.", gradient: true },
        ],
      ],
      [
        [
          { text: "AI die uw gemeente ", gradient: false },
          { text: "écht kent.", gradient: true },
        ],
      ],
      [
        [
          { text: "Elke burger verdient ", gradient: false },
          { text: "een direct antwoord.", gradient: true },
        ],
      ],
    ];

    const plain = [
      "Pioneering artificial intelligence for local authorities",
      "Built for the authorities that serve millions.",
      "Minder wachtrijen. Meer antwoorden. Altijd bereikbaar.",
      "Sophie — The layer on top",
      "Uw gemeente. 24/7 bereikbaar.",
      "De burger geholpen. Uw loket ontlast.",
      "Slim gebouwd voor elke gemeente. Vanaf dag één.",
      "Van vraag naar antwoord — zonder wachten.",
      "Speciaal gebouwd voor steden en gemeenten. Niet aangepast. Niet gegeneriek.",
      "Wij zetten de standaard voor digitale dienstverlening in Vlaanderen.",
      "De gemeente van morgen begint vandaag.",
      "AI die uw gemeente écht kent.",
      "Elke burger verdient een direct antwoord.",
    ];

    async function loop() {
      let i = 0;
      for (;;) {
        await runTerminalTyping(stage, slogans[i]);
        if (live) live.textContent = plain[i];
        await sleep(2000);
        stage.innerHTML = "";
        i = (i + 1) % slogans.length;
      }
    }

    void loop();
  })();
})();

(function initContactFlow() {
  const flowRoot = document.getElementById("contact-flow");
  const historyEl = document.getElementById("contact-flow-history");
  const activeEl = document.getElementById("contact-flow-active");
  const sentEl = document.getElementById("contact-flow-sent");
  const sentOut = document.getElementById("contact-flow-sent-out");
  const questionEl = document.getElementById("contact-flow-question");
  const hintEl = document.getElementById("contact-flow-hint");
  const roleChoicesEl = document.getElementById("contact-flow-role-choices");
  const errEl = document.getElementById("contact-flow-err");
  const singleEl = document.getElementById("contact-flow-single");
  const multilineEl = document.getElementById("contact-flow-multiline");
  const field = document.getElementById("contact-flow-field");
  const textarea = document.getElementById("contact-flow-textarea");
  const mirror = document.getElementById("contact-flow-mirror");
  const inputRowEl = document.getElementById("contact-flow-input-row");
  const suggestionsWrap = document.getElementById("contact-flow-suggestions-wrap");
  const suggestionsList = document.getElementById("contact-flow-suggestions");
  const globeWrap = document.getElementById("contact-gemeente-map-wrap");
  const globeMapEl = document.getElementById("contact-gemeente-map");
  const globeLabel = document.getElementById("contact-globe-label");
  const roleChoiceButtons = Array.from(
    document.querySelectorAll("#contact-flow-role-choices [data-role-choice]")
  );

  if (
    !flowRoot ||
    !historyEl ||
    !activeEl ||
    !sentEl ||
    !sentOut ||
    !questionEl ||
    !hintEl ||
    !roleChoicesEl ||
    !errEl ||
    !singleEl ||
    !multilineEl ||
    !field ||
    !textarea ||
    !mirror ||
    !inputRowEl ||
    !suggestionsWrap ||
    !suggestionsList ||
    !roleChoiceButtons.length
  )
    return;

  function getFallbackGemeenten() {
    return [
      "Aalst",
      "Aalter",
      "Aarschot",
      "Affligem",
      "Alken",
      "Antwerpen",
      "As",
      "Asse",
      "Balen",
      "Beernem",
      "Beersel",
      "Begijnendijk",
      "Beringen",
      "Berlare",
      "Beveren-Kruibeke-Zwijndrecht",
      "Bilzen-Hoeselt",
      "Blankenberge",
      "Bonheiden",
      "Boom",
      "Borgloon",
      "Borsbeek",
      "Brasschaat",
      "Brugge",
      "Brussel",
      "Buggenhout",
      "Damme",
      "De Haan",
      "De Panne",
      "Deinze",
      "Denderleeuw",
      "Dendermonde",
      "Destelbergen",
      "Diepenbeek",
      "Dilbeek",
      "Diest",
      "Diksmuide",
      "Edegem",
      "Eeklo",
      "Evergem",
      "Gavere",
      "Geel",
      "Genk",
      "Gent",
      "Geraardsbergen",
      "Gingelom",
      "Haaltert",
      "Halle",
      "Hamme",
      "Hasselt",
      "Heist-op-den-Berg",
      "Herentals",
      "Herk-de-Stad",
      "Heusden-Zolder",
      "Hoeselt",
      "Hoogstraten",
      "Houthalen-Helchteren",
      "Ieper",
      "Izegem",
      "Kalmthout",
      "Kapellen",
      "Kasterlee",
      "Knokke-Heist",
      "Kortrijk",
      "Koksijde",
      "Kuurne",
      "Leuven",
      "Lier",
      "Lierde",
      "Lokeren",
      "Lommel",
      "Maasmechelen",
      "Maldegem",
      "Mechelen",
      "Melle",
      "Merelbeke-Melle",
      "Mol",
      "Mortsel",
      "Ninove",
      "Oostende",
      "Oudenaarde",
      "Poperinge",
      "Roeselare",
      "Ronse",
      "Schoten",
      "Sint-Niklaas",
      "Temse",
      "Ternat",
      "Tielt",
      "Tongeren-Borgloon",
      "Torhout",
      "Turnhout",
      "Vilvoorde",
      "Waregem",
      "Wetteren",
      "Wevelgem",
      "Zaventem",
      "Zedelgem",
      "Zele",
      "Zemst",
      "Zoersel",
      "Zonhoven",
      "Zottegem",
    ];
  }

  let gemeentenLijst = [];
  const gemeentenPromise = fetch("vlaamse-gemeenten.json")
    .then((r) => r.json())
    .then((list) => {
      gemeentenLijst = Array.isArray(list) ? list : [];
      return gemeentenLijst;
    })
    .catch(() => {
      gemeentenLijst = getFallbackGemeenten();
      return gemeentenLijst;
    });

  /** Accenten weg + lowercase; voor losse match ook spaties en koppeltekens weg. */
  function normalizeMuni(s) {
    return s
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .trim();
  }

  function normalizeMuniLoose(s) {
    return normalizeMuni(s).replace(/[-'\s]+/g, "");
  }

  function resolveGemeente(raw) {
    const v = raw.trim();
    if (!v) return null;
    const loose = normalizeMuniLoose(v);
    const exact = gemeentenLijst.find((g) => normalizeMuniLoose(g) === loose);
    if (exact) return exact;
    return gemeentenLijst.find((g) => g.toLowerCase() === v.toLowerCase()) || null;
  }

  const data = {
    role: "",
    municipality: "",
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  };

  let gemeenteFiltered = [];
  let gemeenteActiveIndex = 0;

  /** Publieke token kan inline staan of via API geladen worden. */
  const MAPBOX_TOKEN = window.MAPBOX_PUBLIC_TOKEN || "";
  let mapboxTokenPromise = null;

  let globeMap = null;
  let mapboxAssetsPromise = null;
  let contactMapViewportBound = false;

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function bindContactMapViewportResize() {
    if (contactMapViewportBound) return;
    contactMapViewportBound = true;
    const onResize = () => {
      if (!globeMap) return;
      try {
        globeMap.resize();
      } catch (e) {
        /* ignore */
      }
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize, { passive: true });
    }
  }

  function loadMapboxAssets() {
    if (window.mapboxgl) return Promise.resolve();
    if (!mapboxAssetsPromise) {
      mapboxAssetsPromise = new Promise((resolve, reject) => {
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
    return mapboxAssetsPromise;
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

  async function geocodeMunicipality(name) {
    const token = await getMapboxToken();
    if (!token) return null;
    const path = encodeURIComponent(`${name}, Vlaams Gewest, België`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${path}.json?access_token=${token}&limit=1&country=be&proximity=4.4699,50.5039`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const c = json.features?.[0]?.center;
    return Array.isArray(c) && c.length >= 2 ? c : null;
  }

  async function showGlobeForMunicipality(name) {
    if (!globeWrap || !globeMapEl || !globeLabel) return;
    globeLabel.innerHTML = `Gemeente: <strong>${escapeHtml(name)}</strong>`;
    globeWrap.hidden = false;

    const dest = (await geocodeMunicipality(name)) || [4.4699, 50.5039];

    try {
      await loadMapboxAssets();
      const token = await getMapboxToken();
      if (!token) throw new Error("Mapbox token ontbreekt");
      mapboxgl.accessToken = token;

      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      if (!globeMap) {
        globeMap = new mapboxgl.Map({
          container: globeMapEl,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center: [-40, 32],
          zoom: 1.55,
          pitch: 50,
          bearing: -18,
          projection: "globe",
          antialias: true,
        });
        globeMap.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");
        bindContactMapViewportResize();
      } else {
        globeMap.resize();
      }

      await new Promise((resolve) => {
        if (globeMap.loaded()) resolve();
        else globeMap.once("load", resolve);
      });

      globeMap.resize();
      globeMap.setFog({
        range: [0.5, 10],
        "horizon-blend": 0.08,
        color: "rgb(186, 210, 235)",
        "high-color": "rgb(54, 118, 235)",
        "space-color": "rgb(8, 10, 28)",
        "star-intensity": 0.45,
      });

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      globeMap.flyTo({
        center: dest,
        zoom: 11.4,
        pitch: 58,
        bearing: 32,
        duration: reduced ? 400 : 11000,
        essential: true,
      });

      globeWrap.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    } catch (e) {
      globeWrap.hidden = true;
    }
  }

  function destroyGlobeMap() {
    if (globeMap) {
      try {
        globeMap.remove();
      } catch (e) {
        /* ignore */
      }
      globeMap = null;
    }
    if (globeWrap) globeWrap.hidden = true;
    if (globeLabel) globeLabel.textContent = "";
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Zet het invoerveld (of het succesvenster) zo veel mogelijk in het midden van het scherm. */
  let scrollContactRaf = 0;
  function scrollContactTypingIntoCenter() {
    const behavior = prefersReducedMotion ? "auto" : "smooth";
    if (scrollContactRaf) cancelAnimationFrame(scrollContactRaf);
    scrollContactRaf = requestAnimationFrame(() => {
      scrollContactRaf = requestAnimationFrame(() => {
        scrollContactRaf = 0;
        const el = !sentEl.hidden ? sentEl : inputRowEl;
        el.scrollIntoView({ block: "center", inline: "nearest", behavior });
      });
    });
  }

  function syncMirror() {
    mirror.textContent = field.value;
  }

  function resetContactFieldAria() {
    field.setAttribute("aria-autocomplete", "off");
    field.setAttribute("aria-expanded", "false");
    field.removeAttribute("aria-controls");
  }

  function applyGemeenteFieldAria() {
    field.setAttribute("aria-autocomplete", "list");
    field.setAttribute("aria-controls", "contact-flow-suggestions");
    field.setAttribute("aria-expanded", suggestionsWrap.hidden ? "false" : "true");
  }

  function hideGemeenteSuggestions() {
    suggestionsWrap.hidden = true;
    suggestionsList.replaceChildren();
    gemeenteFiltered = [];
    gemeenteActiveIndex = 0;
  }

  function renderGemeenteSuggestions() {
    suggestionsList.replaceChildren();
    if (!gemeenteFiltered.length) {
      suggestionsWrap.hidden = true;
      return;
    }
    suggestionsWrap.hidden = false;
    gemeenteActiveIndex = Math.max(0, Math.min(gemeenteActiveIndex, gemeenteFiltered.length - 1));
    gemeenteFiltered.forEach((name, i) => {
      const li = document.createElement("li");
      li.className =
        "contact-flow__suggestion" + (i === gemeenteActiveIndex ? " contact-flow__suggestion--active" : "");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", i === gemeenteActiveIndex ? "true" : "false");
      li.textContent = name;
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
      });
      li.addEventListener("click", () => {
        field.value = name;
        syncMirror();
        hideGemeenteSuggestions();
        submitLine();
      });
      suggestionsList.appendChild(li);
    });
    applyGemeenteFieldAria();
  }

  function filterGemeenteSuggestions() {
    const q = field.value.trim();
    if (!gemeentenLijst.length || !q) {
      gemeenteFiltered = [];
      suggestionsWrap.hidden = true;
      suggestionsList.replaceChildren();
      gemeenteActiveIndex = 0;
      applyGemeenteFieldAria();
      return;
    }
    const nq = normalizeMuni(q);
    const looseQ = normalizeMuniLoose(q);
    gemeenteFiltered = gemeentenLijst
      .filter((g) => {
        const ng = normalizeMuni(g);
        const gl = normalizeMuniLoose(g);
        return ng.startsWith(nq) || ng.includes(nq) || gl.includes(looseQ);
      })
      .slice(0, 12);
    gemeenteActiveIndex = 0;
    renderGemeenteSuggestions();
  }

  function configureSingleFieldForStep(stepKey) {
    field.type = "text";
    field.setAttribute("name", "answer");
    field.setAttribute("inputmode", "text");
    field.setAttribute("autocomplete", "off");
    field.setAttribute("autocapitalize", "off");

    if (stepKey === "firstName") {
      field.setAttribute("name", "given-name");
      field.setAttribute("autocomplete", "given-name");
      field.setAttribute("autocapitalize", "words");
      return;
    }
    if (stepKey === "lastName") {
      field.setAttribute("name", "family-name");
      field.setAttribute("autocomplete", "family-name");
      field.setAttribute("autocapitalize", "words");
      return;
    }
    if (stepKey === "email") {
      field.type = "email";
      field.setAttribute("name", "email");
      field.setAttribute("inputmode", "email");
      field.setAttribute("autocomplete", "email");
      field.setAttribute("autocapitalize", "off");
      return;
    }
    if (stepKey === "municipality") {
      field.setAttribute("name", "address-level2");
      field.setAttribute("autocomplete", "address-level2");
      field.setAttribute("autocapitalize", "words");
      return;
    }
    if (stepKey === "role") {
      field.setAttribute("name", "role");
      return;
    }
    if (stepKey === "sendConfirm") {
      field.setAttribute("name", "sendConfirm");
    }
  }

  function setRoleChoicesVisible(on) {
    const visible = Boolean(on);
    roleChoicesEl.hidden = !visible;
    inputRowEl.hidden = visible;
    if (!visible) return;
    hideGemeenteSuggestions();
    resetContactFieldAria();
    field.value = "";
    syncMirror();
  }

  activeEl.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  function setMultilineMode(on) {
    multilineEl.hidden = !on;
    singleEl.hidden = on;
    if (on) {
      textarea.focus();
    } else {
      field.focus();
    }
  }

  function getInputValue() {
    return multilineEl.hidden ? field.value : textarea.value;
  }

  function clearInputValue() {
    if (multilineEl.hidden) {
      field.value = "";
      syncMirror();
    } else {
      textarea.value = "";
    }
  }

  function focusActiveControl() {
    if (multilineEl.hidden) field.focus();
    else textarea.focus();
  }

  function showErr(msg) {
    errEl.textContent = msg;
    errEl.hidden = false;
    scrollContactTypingIntoCenter();
  }

  function clearErr() {
    errEl.textContent = "";
    errEl.hidden = true;
  }

  function appendHistory(promptText, answerDisplay) {
    const block = document.createElement("div");
    block.className = "contact-flow__past";
    const q = document.createElement("p");
    q.className = "contact-flow__past-q";
    q.textContent = promptText;
    const a = document.createElement("p");
    a.className = "contact-flow__past-a";
    a.textContent = answerDisplay;
    block.append(q, a);
    historyEl.appendChild(block);
    scrollContactTypingIntoCenter();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getContactSuccessMessage() {
    const name = (data.firstName || "").trim();
    if (!name) return "Je bericht is succesvol verzonden!";
    return `Je bericht is succesvol verzonden ${name}!`;
  }

  async function playTerminalSuccess() {
    sentOut.replaceChildren();
    const reduced = prefersReducedMotion;
    const line = document.createElement("p");
    line.className = "contact-flow__sent-line";
    const prefix = document.createTextNode("> ");
    const typed = document.createElement("span");
    const caret = document.createElement("span");
    caret.className = "typewriter__caret contact-flow__sent-caret";
    caret.setAttribute("aria-hidden", "true");
    typed.appendChild(caret);
    line.append(prefix, typed);
    sentOut.appendChild(line);

    const msg = getContactSuccessMessage();
    if (reduced) {
      typed.textContent = msg;
      caret.remove();
      scrollContactTypingIntoCenter();
      return;
    }

    for (let i = 0; i < msg.length; i++) {
      typed.textContent += msg[i];
      if (i % 4 === 0 || i === msg.length - 1) {
        scrollContactTypingIntoCenter();
      }
      await sleep(26 + Math.random() * 34);
    }
    caret.remove();
    scrollContactTypingIntoCenter();
  }

  function finalizeSend() {
    configureSingleFieldForStep("role");
    setMultilineMode(false);
    hideGemeenteSuggestions();
    resetContactFieldAria();
    destroyGlobeMap();
    historyEl.replaceChildren();
    activeEl.hidden = true;
    sentEl.hidden = false;
    flowRoot.classList.add("contact-flow--sent");
    scrollContactTypingIntoCenter();
    playTerminalSuccess();
  }

  const stepDefs = {
    role: {
      key: "role",
      prompt: "Ben je ontwikkelaar of gemeente?",
      hint: "Kies een van de twee knoppen.",
      ask() {
        questionEl.textContent = this.prompt;
        hintEl.textContent = this.hint;
        hintEl.hidden = false;
        configureSingleFieldForStep(this.key);
        setRoleChoicesVisible(true);
        setMultilineMode(false);
        requestAnimationFrame(() => {
          roleChoiceButtons[0]?.focus();
        });
      },
      validate(raw) {
        const v = raw.trim().toLowerCase();
        if (["1", "gemeente", "g"].includes(v)) return { ok: true, value: "gemeente", label: "Gemeente" };
        if (["2", "ontwikkelaar", "o", "dev", "developer", "ontwikkelaars"].includes(v))
          return { ok: true, value: "ontwikkelaar", label: "Ontwikkelaar" };
        return { ok: false, err: "Ongeldige keuze. Typ 1 (gemeente) of 2 (ontwikkelaar)." };
      },
    },
    municipality: {
      key: "municipality",
      prompt: "Voor welke gemeente is dit?",
      hint: "Begin te typen: je krijgt suggesties uit alle gemeenten in Vlaanderen. Bevestig met Enter of klik een regel.",
      ask() {
        questionEl.textContent = this.prompt;
        hintEl.textContent = this.hint;
        hintEl.hidden = false;
        configureSingleFieldForStep(this.key);
        setRoleChoicesVisible(false);
        setMultilineMode(false);
        field.value = "";
        syncMirror();
        hideGemeenteSuggestions();
        applyGemeenteFieldAria();
        gemeentenPromise.then(() => {
          if (getSteps()[stepIndex]?.key === "municipality") filterGemeenteSuggestions();
        });
      },
      validate(raw) {
        const v = raw.trim();
        if (!v) return { ok: false, err: "Geef de naam van de gemeente." };
        const match = resolveGemeente(v);
        if (!match) {
          return {
            ok: false,
            err: "Dat is geen erkende gemeente in Vlaanderen. Kies uit de suggesties of typ de officiële naam.",
          };
        }
        return { ok: true, value: match, label: match };
      },
    },
    firstName: {
      key: "firstName",
      prompt: "Wat is je voornaam?",
      ask() {
        questionEl.textContent = this.prompt;
        hintEl.hidden = true;
        configureSingleFieldForStep(this.key);
        setRoleChoicesVisible(false);
        setMultilineMode(false);
        hideGemeenteSuggestions();
        resetContactFieldAria();
      },
      validate(raw) {
        const v = raw.trim();
        if (!v) return { ok: false, err: "Voornaam is verplicht." };
        return { ok: true, value: v, label: v };
      },
    },
    lastName: {
      key: "lastName",
      prompt: "Wat is je achternaam?",
      ask() {
        questionEl.textContent = this.prompt;
        hintEl.hidden = true;
        configureSingleFieldForStep(this.key);
        setRoleChoicesVisible(false);
        setMultilineMode(false);
      },
      validate(raw) {
        const v = raw.trim();
        if (!v) return { ok: false, err: "Achternaam is verplicht." };
        return { ok: true, value: v, label: v };
      },
    },
    email: {
      key: "email",
      prompt: "Wat is je e-mailadres?",
      ask() {
        questionEl.textContent = this.prompt;
        hintEl.hidden = true;
        configureSingleFieldForStep(this.key);
        setRoleChoicesVisible(false);
        setMultilineMode(false);
      },
      validate(raw) {
        const v = raw.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
          return { ok: false, err: "Dat lijkt geen geldig e-mailadres. Probeer opnieuw." };
        return { ok: true, value: v, label: v };
      },
    },
    message: {
      key: "message",
      prompt: "Schrijf je bericht.",
      hint: "Shift+Enter voor een nieuwe regel. Enter om door te gaan.",
      ask() {
        questionEl.textContent = this.prompt;
        hintEl.textContent = this.hint;
        hintEl.hidden = false;
        configureSingleFieldForStep(this.key);
        setRoleChoicesVisible(false);
        setMultilineMode(true);
        hideGemeenteSuggestions();
        resetContactFieldAria();
      },
      validate(raw) {
        const v = raw.trim();
        if (!v) return { ok: false, err: "Schrijf een bericht om door te gaan." };
        const label = v.length > 72 ? `${v.slice(0, 72).trim()}…` : v;
        return { ok: true, value: v, label };
      },
    },
    sendConfirm: {
      key: "sendConfirm",
      prompt: "Typ verzenden om je bericht te versturen.",
      hint: "Je gegevens worden nu pas verstuurd.",
      ask() {
        questionEl.textContent = this.prompt;
        hintEl.textContent = this.hint;
        hintEl.hidden = false;
        configureSingleFieldForStep(this.key);
        setRoleChoicesVisible(false);
        setMultilineMode(false);
        hideGemeenteSuggestions();
        resetContactFieldAria();
      },
      validate(raw) {
        const v = raw.trim().toLowerCase();
        if (v !== "verzenden") return { ok: false, err: "Typ precies het woord: verzenden" };
        return { ok: true, value: true, label: "verzenden" };
      },
    },
  };

  function getSteps() {
    const order = ["role"];
    if (data.role === "gemeente") order.push("municipality");
    order.push("firstName", "lastName", "email", "message", "sendConfirm");
    return order.map((k) => stepDefs[k]);
  }

  let stepIndex = 0;

  async function submitLine() {
    const steps = getSteps();
    const step = steps[stepIndex];
    if (step.key === "municipality") {
      await gemeentenPromise;
    }
    const value = getInputValue();
    const result = step.validate(value);
    if (!result.ok) {
      showErr(result.err);
      focusActiveControl();
      return;
    }

    if (step.key === "sendConfirm") {
      clearErr();
      try {
        await submitToCms("contact", {
          role: data.role,
          municipality: data.municipality,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          message: data.message,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Verzenden mislukt. Probeer later opnieuw of mail ons rechtstreeks.";
        showErr(msg);
        focusActiveControl();
        return;
      }
      finalizeSend();
      return;
    }

    clearErr();
    appendHistory(step.prompt, result.label);
    if (step.key) data[step.key] = result.value;
    if (step.key === "municipality") {
      void showGlobeForMunicipality(result.value);
    }
    clearInputValue();
    hideGemeenteSuggestions();

    stepIndex += 1;

    const stepsAfter = getSteps();
    if (stepIndex >= stepsAfter.length) {
      return;
    }

    stepsAfter[stepIndex].ask();
    scrollContactTypingIntoCenter();
    focusActiveControl();
  }

  field.addEventListener("input", () => {
    syncMirror();
    clearErr();
    scrollContactTypingIntoCenter();
    const steps = getSteps();
    if (steps[stepIndex]?.key === "municipality") {
      filterGemeenteSuggestions();
    }
  });

  roleChoiceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      field.value = String(btn.getAttribute("data-role-choice") || "").trim();
      syncMirror();
      clearErr();
      submitLine();
    });
  });

  textarea.addEventListener("input", () => {
    clearErr();
    scrollContactTypingIntoCenter();
  });

  field.addEventListener("keydown", (e) => {
    const steps = getSteps();
    const cur = steps[stepIndex];
    if (cur?.key === "municipality" && gemeenteFiltered.length && !suggestionsWrap.hidden) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        gemeenteActiveIndex = (gemeenteActiveIndex + 1) % gemeenteFiltered.length;
        renderGemeenteSuggestions();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        gemeenteActiveIndex =
          (gemeenteActiveIndex - 1 + gemeenteFiltered.length) % gemeenteFiltered.length;
        renderGemeenteSuggestions();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const pick = gemeenteFiltered[gemeenteActiveIndex] ?? gemeenteFiltered[0];
        if (pick) {
          field.value = pick;
          syncMirror();
          hideGemeenteSuggestions();
          submitLine();
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        hideGemeenteSuggestions();
        applyGemeenteFieldAria();
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submitLine();
    }
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitLine();
    }
  });

  getSteps()[0].ask();
  field.focus();
})();

(function initScrollReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;

  function revealAll() {
    nodes.forEach((el) => el.classList.add("reveal--visible", "reveal--instant"));
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealAll();
    return;
  }

  /** Zelfde logica als IntersectionObserver rootMargin 0 0 -12% 0: onderkant root = 88% van viewport. */
  function isInitiallyInView(el) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const bottomEdge = vh * 0.88;
    return rect.top < bottomEdge && rect.bottom > 0;
  }

  const io = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal--visible");
        observer.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );

  nodes.forEach((el) => {
    if (isInitiallyInView(el)) {
      el.classList.add("reveal--visible", "reveal--instant");
    } else {
      io.observe(el);
    }
  });
})();

(function initDevRecruitTerminal() {
  const stage = document.getElementById("dev-recruit-stage");
  if (!stage) return;

  /** @type {{ kind: string, text?: string }[]} */
  const rows = [
    { kind: "lead", text: "We bouwen de toekomst van lokale besturen — doe mee." },
    { kind: "gap" },
    {
      kind: "p",
      text:
        "We zijn Sophie Technologies, een jong en ambitieus team dat AI bouwt speciaal voor steden en gemeenten. We groeien snel, denken groot en zoeken mensen die dat ook doen.",
    },
    { kind: "gap" },
    {
      kind: "p",
      text:
        "Ben jij een software developer die meer wil dan tickets wegwerken? Die wil bouwen aan iets dat écht impact heeft — voor duizenden burgers, dag na dag?",
    },
    { kind: "p", text: "Dan zoeken we jou." },
    { kind: "gap" },
    { kind: "h2", text: "Wat je bij ons doet" },
    {
      kind: "p",
      text:
        "Je bouwt mee aan Sophie — van de kern van het platform tot nieuwe modules die gemeenten slimmer maken. Je werkt in een kleine, snelle en gedreven ploeg waar jouw code er echt toe doet. Geen corporate bureaucratie. Geen eindeloze vergaderingen. Gewoon bouwen.",
    },
    { kind: "gap" },
    { kind: "h2", text: "Wie we zoeken" },
    {
      kind: "p",
      text: "We zoeken geen specifiek profiel — we zoeken een specifieke mindset. Iemand die:",
    },
    { kind: "gap" },
    { kind: "sub", text: "Gedreven is en initiatief neemt" },
    { kind: "sub", text: "Houdt van bouwen, itereren en verbeteren" },
    { kind: "sub", text: "Gelooft dat technologie het verschil kan maken voor de samenleving" },
    { kind: "sub", text: "Niet wacht op instructies maar zelf met oplossingen komt" },
    { kind: "gap" },
    { kind: "h2", text: "Waarom Sophie Technologies?" },
    { kind: "gap" },
    { kind: "p", text: "Je bent er vroeg bij — en dat telt" },
    { kind: "p", text: "Je bouwt aan een product dat al gebruikt wordt door echte gemeenten" },
    { kind: "p", text: "Je werkt met de nieuwste AI-technologie" },
    { kind: "p", text: "Je krijgt verantwoordelijkheid vanaf dag één" },
    { kind: "gap" },
    { kind: "gap" },
    { kind: "h2", text: "Geïnteresseerd?" },
    {
      kind: "p",
      text:
        "Stuur een berichtje naar nathan.debusschere@ugent.be — vertel ons wie je bent en wat je wil bouwen. We horen graag van je.",
    },
    { kind: "p", text: "De gemeente van morgen begint vandaag. Bouw je mee?" },
  ];

  const CLOSING_Q = "Klaar om aan de leukste startup van Gent te bouwen?";
  const CLOSING_HINT = 'Typ "ja" om de vragen te starten.';

  /** @type {{ key: string, prompt: string, hint: string, multiline: boolean, validate: (v: string) => { ok: boolean, err?: string, value?: string | boolean } }[]} */
  const RECRUIT_STEPS = [
    {
      key: "firstName",
      prompt: "Hoe heet je? (voornaam)",
      hint: "",
      multiline: false,
      validate: (v) => {
        const t = v.trim();
        if (!t) return { ok: false, err: "Vul je voornaam in." };
        return { ok: true, value: t };
      },
    },
    {
      key: "lastName",
      prompt: "En je achternaam?",
      hint: "",
      multiline: false,
      validate: (v) => {
        const t = v.trim();
        if (!t) return { ok: false, err: "Vul je achternaam in." };
        return { ok: true, value: t };
      },
    },
    {
      key: "email",
      prompt: "Wat is je e-mailadres?",
      hint: "",
      multiline: false,
      validate: (v) => {
        const t = v.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return { ok: false, err: "Dat lijkt geen geldig e-mailadres." };
        return { ok: true, value: t };
      },
    },
    {
      key: "stack",
      prompt: "Met welke stack, talen of frameworks werk je het liefst?",
      hint: "Eén regel is genoeg.",
      multiline: false,
      validate: (v) => {
        const t = v.trim();
        if (!t) return { ok: false, err: "Vertel iets over je stack." };
        return { ok: true, value: t };
      },
    },
    {
      key: "experience",
      prompt: "Vertel kort over je ervaring: studie, werk, eigen projecten…",
      hint: "Shift+Enter voor een nieuwe regel, Enter om door te gaan.",
      multiline: true,
      validate: (v) => {
        const t = v.trim();
        if (!t) return { ok: false, err: "Een korte beschrijving is nodig." };
        return { ok: true, value: t };
      },
    },
    {
      key: "motivation",
      prompt: "Wat wil je bij ons bouwen of leren?",
      hint: "Shift+Enter voor een nieuwe regel, Enter om door te gaan.",
      multiline: true,
      validate: (v) => {
        const t = v.trim();
        if (!t) return { ok: false, err: "Schrijf even waar je warm voor wordt." };
        return { ok: true, value: t };
      },
    },
    {
      key: "sendConfirm",
      prompt: 'Typ "verzenden" om je sollicitatie door te sturen.',
      hint: "Je gegevens worden naar ons verstuurd.",
      multiline: false,
      validate: (v) => {
        const t = v.trim().toLowerCase();
        if (t !== "verzenden") return { ok: false, err: 'Typ precies: verzenden' };
        return { ok: true, value: true };
      },
    },
  ];

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let aborted = false;
  let recruitFlowStarted = false;
  /** @type {Record<string, string>} */
  let recruitData = {};
  let recruitStepIndex = 0;
  /** Tijdens typewriter in het sollicitatieformulier / afsluittekst — Enter vult de regel meteen. */
  let recruitStepIsTyping = false;
  /** Eén druk op Enter: huidige typeInto meteen met volledige tekst afronden. */
  let instantTypeRequested = false;

  function delayMs() {
    return 16 + Math.random() * 26;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function typeInto(el, text) {
    function flushInstant() {
      el.textContent = text;
      instantTypeRequested = false;
      stage.scrollTop = stage.scrollHeight;
    }

    if (instantTypeRequested) {
      flushInstant();
      return;
    }

    for (let i = 0; i < text.length; i++) {
      if (aborted) return;
      if (instantTypeRequested) {
        flushInstant();
        return;
      }
      el.textContent += text[i];
      if (i % 5 === 0 || i === text.length - 1) {
        stage.scrollTop = stage.scrollHeight;
      }
      await sleep(delayMs());
    }
    if (aborted) return;
  }

  function makeCaret() {
    const el = document.createElement("span");
    el.className = "typewriter__caret dev-terminal__caret";
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  function buildRecruitMailto() {
    const subject = encodeURIComponent("Sollicitatie developer — Sophie Technologies");
    const body = encodeURIComponent(
      `Voornaam: ${recruitData.firstName}\nAchternaam: ${recruitData.lastName}\nE-mail: ${recruitData.email}\n\nStack:\n${recruitData.stack}\n\nErvaring:\n${recruitData.experience}\n\nWaarom Sophie / wat wil je bouwen:\n${recruitData.motivation}\n`
    );
    return `mailto:nathan.debusschere@ugent.be?subject=${subject}&body=${body}`;
  }

  function appendRecruitHistory(question, answer) {
    const history = document.getElementById("dev-recruit-history");
    if (!history) return;
    const block = document.createElement("div");
    block.className = "dev-recruit-flow__past";
    const pq = document.createElement("p");
    pq.className = "dev-recruit-flow__past-q";
    pq.textContent = question;
    const pa = document.createElement("p");
    pa.className = "dev-recruit-flow__past-a";
    pa.textContent = answer;
    pa.style.whiteSpace = "pre-wrap";
    block.append(pq, pa);
    history.appendChild(block);
    stage.scrollTop = stage.scrollHeight;
  }

  async function finalizeRecruitMail() {
    const active = document.getElementById("dev-recruit-active");
    if (active) active.innerHTML = "";

    let submitOk = false;
    let submitErr = "";
    try {
      await submitToCms("recruit", {
        firstName: recruitData.firstName,
        lastName: recruitData.lastName,
        email: recruitData.email,
        stack: recruitData.stack,
        experience: recruitData.experience,
        motivation: recruitData.motivation,
      });
      submitOk = true;
    } catch (e) {
      submitErr = e instanceof Error ? e.message : "Onbekende fout";
    }

    const wrap = document.createElement("div");
    wrap.className = "dev-recruit-flow__done";
    const line = document.createElement("p");
    line.className = "dev-terminal__line dev-terminal__line--flow-done";
    const span = document.createElement("span");
    span.className = "dev-terminal__text";
    const msg = submitOk
      ? "Bedankt! Je sollicitatie is ontvangen. We nemen contact op als er een match is."
      : `Verzenden mislukt (${submitErr}). We openen je mailprogramma met een concept — verzend die om alsnog te solliciteren.`;
    recruitStepIsTyping = true;
    try {
      if (reduced) {
        span.textContent = msg;
        line.appendChild(span);
      } else {
        const caret = makeCaret();
        span.appendChild(caret);
        line.append(span);
        await typeInto(span, msg);
        caret.remove();
      }
    } finally {
      recruitStepIsTyping = false;
    }
    wrap.appendChild(line);
    stage.appendChild(wrap);
    stage.scrollTop = stage.scrollHeight;
    if (!submitOk) {
      window.setTimeout(() => {
        window.location.href = buildRecruitMailto();
      }, reduced ? 0 : 500);
    }
  }

  function mountRecruitField(step, active, errEl) {
    const row = document.createElement("p");
    row.className = "dev-terminal__line dev-terminal__line--prompt";
    const promptMark = document.createElement("span");
    promptMark.className = "dev-terminal__prompt";
    promptMark.textContent = "> ";
    promptMark.setAttribute("aria-hidden", "true");
    /** @type {HTMLInputElement | HTMLTextAreaElement} */
    let field;
    if (step.multiline) {
      field = document.createElement("textarea");
      field.rows = 5;
      field.className = "dev-terminal__textarea";
    } else {
      field = document.createElement("input");
      field.type = step.key === "email" ? "email" : "text";
      field.className = "dev-terminal__input";
    }
    field.id = "dev-recruit-field";
    field.setAttribute("autocomplete", step.key === "email" ? "email" : "off");
    field.setAttribute("spellcheck", step.multiline ? "true" : "false");
    field.setAttribute("aria-label", step.prompt);
    row.append(promptMark, field);
    active.appendChild(row);

    function submit() {
      const value = field.value || "";
      const result = step.validate(value);
      if (!result.ok) {
        errEl.textContent = result.err || "";
        errEl.hidden = false;
        stage.scrollTop = stage.scrollHeight;
        return;
      }
      errEl.hidden = true;
      if (step.key !== "sendConfirm") {
        recruitData[step.key] = /** @type {string} */ (result.value);
      }
      const display =
        step.key === "sendConfirm" ? "verzenden" : step.multiline ? value.trim() : String(result.value);
      appendRecruitHistory(step.prompt, display);
      recruitStepIndex += 1;
      void runRecruitStep();
    }

    field.addEventListener("keydown", (e) => {
      if (step.multiline) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });

    requestAnimationFrame(() => field.focus());
  }

  async function runRecruitStep() {
    const step = RECRUIT_STEPS[recruitStepIndex];
    const active = document.getElementById("dev-recruit-active");
    if (!active) return;
    if (!step) {
      await finalizeRecruitMail();
      return;
    }

    const isFirst = recruitStepIndex === 0;
    active.innerHTML = "";

    recruitStepIsTyping = true;
    try {
      if (isFirst) {
        const intro = document.createElement("p");
        intro.className = "dev-terminal__line dev-terminal__line--flow-intro";
        const introSpan = document.createElement("span");
        introSpan.className = "dev-terminal__text";
        const introText = "Top — hier komen een paar korte vragen.";
        if (reduced) {
          introSpan.textContent = introText;
          intro.appendChild(introSpan);
        } else {
          const c = makeCaret();
          introSpan.appendChild(c);
          intro.append(introSpan);
          await typeInto(introSpan, introText);
          if (aborted) return;
          c.remove();
        }
        active.appendChild(intro);
        await sleep(120);
        if (aborted) return;
      }

      const qLine = document.createElement("p");
      qLine.className = "dev-terminal__line dev-terminal__line--flow-q";
      const qSpan = document.createElement("span");
      qSpan.className = "dev-terminal__text";
      if (reduced) {
        qSpan.textContent = step.prompt;
        qLine.appendChild(qSpan);
      } else {
        const caret = makeCaret();
        qSpan.appendChild(caret);
        qLine.append(qSpan);
        await typeInto(qSpan, step.prompt);
        if (aborted) return;
        caret.remove();
      }
      active.appendChild(qLine);

      if (step.hint) {
        const hint = document.createElement("p");
        hint.className = "dev-recruit-flow__hint";
        hint.textContent = step.hint;
        active.appendChild(hint);
      }

      const errEl = document.createElement("p");
      errEl.className = "dev-recruit-flow__err";
      errEl.hidden = true;
      errEl.setAttribute("role", "alert");
      active.appendChild(errEl);

      mountRecruitField(step, active, errEl);
    } finally {
      recruitStepIsTyping = false;
    }
  }

  function startRecruitForm() {
    recruitFlowStarted = true;
    const jaInput = document.getElementById("dev-recruit-ja-input");
    const jaRow = jaInput?.closest(".dev-terminal__line--prompt");
    if (jaRow) {
      const echo = document.createElement("p");
      echo.className = "dev-recruit-flow__echo";
      echo.textContent = "> ja";
      jaRow.replaceWith(echo);
    }

    const history = document.createElement("div");
    history.id = "dev-recruit-history";
    history.className = "dev-recruit-flow__history";
    stage.appendChild(history);

    const active = document.createElement("div");
    active.id = "dev-recruit-active";
    active.className = "dev-recruit-flow__active";
    stage.appendChild(active);

    recruitStepIndex = 0;
    recruitData = {};
    void runRecruitStep();
  }

  function mountJaPrompt(focus) {
    const wrap = document.createElement("p");
    wrap.className = "dev-terminal__line dev-terminal__line--prompt";
    const promptMark = document.createElement("span");
    promptMark.className = "dev-terminal__prompt";
    promptMark.textContent = "> ";
    promptMark.setAttribute("aria-hidden", "true");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "dev-terminal__input";
    input.id = "dev-recruit-ja-input";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("inputmode", "text");
    input.setAttribute("aria-label", 'Typ het woord ja en druk op Enter om het formulier te starten.');
    wrap.append(promptMark, input);
    stage.appendChild(wrap);
    stage.scrollTop = stage.scrollHeight;

    function tryGo() {
      if (input.value.trim().toLowerCase() === "ja") startRecruitForm();
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        tryGo();
      }
    });

    if (focus) {
      requestAnimationFrame(() => {
        input.focus();
      });
    }
  }

  function appendClosingInstant() {
    const gap = document.createElement("div");
    gap.className = "dev-terminal__gap";
    gap.setAttribute("aria-hidden", "true");
    stage.appendChild(gap);

    const lineQ = document.createElement("p");
    lineQ.className = "dev-terminal__line dev-terminal__line--closing";
    const sq = document.createElement("span");
    sq.className = "dev-terminal__text";
    sq.textContent = CLOSING_Q;
    lineQ.appendChild(sq);
    stage.appendChild(lineQ);

    const lineH = document.createElement("p");
    lineH.className = "dev-terminal__line dev-terminal__line--closing-hint";
    const sh = document.createElement("span");
    sh.className = "dev-terminal__text";
    sh.textContent = CLOSING_HINT;
    lineH.appendChild(sh);
    stage.appendChild(lineH);

    mountJaPrompt(true);
  }

  async function typeClosingBlock() {
    const gap = document.createElement("div");
    gap.className = "dev-terminal__gap";
    gap.setAttribute("aria-hidden", "true");
    stage.appendChild(gap);
    await sleep(110);
    if (aborted) return;

    const lines = [
      { className: "dev-terminal__line--closing", text: CLOSING_Q },
      { className: "dev-terminal__line--closing-hint", text: CLOSING_HINT },
    ];

    for (const { className, text } of lines) {
      if (aborted) return;
      const line = document.createElement("p");
      line.className = `dev-terminal__line ${className}`;
      const textSpan = document.createElement("span");
      textSpan.className = "dev-terminal__text";
      const caret = makeCaret();
      textSpan.appendChild(caret);
      line.append(textSpan);
      stage.appendChild(line);
      stage.scrollTop = stage.scrollHeight;
      await typeInto(textSpan, text);
      if (aborted) return;
      caret.remove();
      await sleep(32 + Math.random() * 36);
    }

    if (aborted) return;
    mountJaPrompt(true);
  }

  function linkifyEmailInStage() {
    const email = "nathan.debusschere@ugent.be";
    stage.querySelectorAll(".dev-terminal__text").forEach((span) => {
      const t = span.textContent || "";
      if (!t.includes(email)) return;
      const parts = t.split(email);
      span.replaceChildren();
      span.append(document.createTextNode(parts[0]));
      const a = document.createElement("a");
      a.href = `mailto:${email}`;
      a.className = "dev-terminal__link";
      a.textContent = email;
      span.append(a);
      if (parts[1]) span.append(document.createTextNode(parts[1]));
    });
  }

  function renderInstant() {
    stage.innerHTML = "";
    rows.forEach((row) => {
      if (row.kind === "gap") {
        const gap = document.createElement("div");
        gap.className = "dev-terminal__gap";
        gap.setAttribute("aria-hidden", "true");
        stage.appendChild(gap);
        return;
      }
      const line = document.createElement("p");
      line.className = `dev-terminal__line dev-terminal__line--${row.kind}`;
      const textSpan = document.createElement("span");
      textSpan.className = "dev-terminal__text";
      textSpan.textContent = row.text || "";
      line.appendChild(textSpan);
      stage.appendChild(line);
    });
    linkifyEmailInStage();
    appendClosingInstant();
    stage.removeAttribute("aria-busy");
    stage.setAttribute("aria-live", "polite");
  }

  async function run() {
    stage.innerHTML = "";
    if (reduced || aborted) {
      renderInstant();
      return;
    }

    for (const row of rows) {
      if (aborted) return;
      if (row.kind === "gap") {
        const gap = document.createElement("div");
        gap.className = "dev-terminal__gap";
        gap.setAttribute("aria-hidden", "true");
        stage.appendChild(gap);
        await sleep(90);
        if (aborted) return;
        continue;
      }

      const line = document.createElement("p");
      line.className = `dev-terminal__line dev-terminal__line--${row.kind}`;
      const textSpan = document.createElement("span");
      textSpan.className = "dev-terminal__text";
      const caret = makeCaret();
      textSpan.appendChild(caret);
      line.append(textSpan);
      stage.appendChild(line);
      stage.scrollTop = stage.scrollHeight;

      await typeInto(textSpan, row.text || "");
      if (aborted) return;
      caret.remove();
      await sleep(28 + Math.random() * 40);
    }

    if (aborted) return;
    linkifyEmailInStage();
    await typeClosingBlock();
    if (aborted) return;
    stage.removeAttribute("aria-busy");
    stage.setAttribute("aria-live", "polite");
  }

  function skip() {
    if (recruitFlowStarted) return;
    if (aborted) return;
    aborted = true;
    renderInstant();
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" && !e.repeat) {
        if (!recruitFlowStarted && stage.getAttribute("aria-busy") === "true") {
          e.preventDefault();
          skip();
          return;
        }
        if (recruitFlowStarted && recruitStepIsTyping) {
          e.preventDefault();
          instantTypeRequested = true;
          return;
        }
      }
      if (e.key === "s" || e.key === "S") {
        if (recruitFlowStarted) return;
        if (e.target && (e.target.closest("input") || e.target.closest("textarea"))) return;
        e.preventDefault();
        skip();
      }
    },
    true
  );

  void run();
})();
