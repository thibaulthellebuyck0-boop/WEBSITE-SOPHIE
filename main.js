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
  const topLinks = document.querySelectorAll(".nav__links > .nav-item[href]");
  const moreLinks = document.querySelectorAll(".nav-more__link");
  const moreToggle = document.querySelector(".nav-more__toggle");
  const moreWrap = document.querySelector(".nav-more");
  if (!topLinks.length && !moreLinks.length) return;

  function normalizeNavPath(raw) {
    if (!raw) return "index";
    let value = String(raw).trim();
    value = value.split("#")[0].split("?")[0];
    if (!value) return "index";
    value = value.replace(/\/+$/, "");
    const last = value.split("/").pop() || "";
    const clean = (last || "index").replace(/\.html?$/i, "");
    return clean.toLowerCase();
  }

  function setActive(el, active) {
    if (!el) return;
    el.classList.toggle("nav-item--active", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  }

  const current = normalizeNavPath(window.location.pathname);
  let moreActive = false;

  topLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    setActive(link, normalizeNavPath(href) === current);
  });

  moreLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const active = normalizeNavPath(href) === current;
    setActive(link, active);
    if (active) moreActive = true;
  });

  setActive(moreToggle, moreActive);
  if (moreWrap) moreWrap.classList.toggle("nav-more--active", moreActive);
})();

(function initNavPill() {
  const nav = document.querySelector(".nav__links");
  const pill = document.querySelector(".nav__pill");
  if (!nav || !pill) return;

  const targets = Array.from(nav.querySelectorAll(".nav-pill-target"));
  if (!targets.length) return;

  let hoverTarget = null;

  function getActiveTarget() {
    const activeMore = nav.querySelector(".nav-more--active");
    if (activeMore) return activeMore;
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

  function getPillRoot() {
    return nav;
  }

  function moveTo(el) {
    if (!el) return;
    const root = getPillRoot();
    const rootRect = root.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    pill.style.opacity = "1";
    pill.style.left = `${elRect.left - rootRect.left + root.scrollLeft}px`;
    pill.style.top = `${elRect.top - rootRect.top + root.scrollTop}px`;
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
  window.addEventListener("load", moveToIdle, { once: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(moveToIdle);
  }
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
  const moreWrap = document.querySelector(".nav-more");
  const moreToggle = document.querySelector(".nav-more__toggle");
  const morePanel = document.getElementById("nav-more-panel");
  const subBack = document.getElementById("nav-mobile-sub-back");
  const mobileMq = window.matchMedia("(max-width: 767px)");
  const reducedMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!header || !toggle || !links) return;

  let menuEnterTimer = 0;
  let subEnterTimer = 0;
  const MENU_ENTER_MS = 750;

  function clearEnterTimers() {
    window.clearTimeout(menuEnterTimer);
    window.clearTimeout(subEnterTimer);
    header.classList.remove("nav--menu-entering", "nav--sub-entering");
  }

  function runMenuEnterAnimation() {
    header.classList.remove("nav--menu-entering");
    window.clearTimeout(menuEnterTimer);

    if (!mobileMq.matches || reducedMotionMq.matches) {
      header.classList.add("nav--menu-animate");
      return;
    }

    header.classList.add("nav--menu-animate", "nav--menu-entering");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        header.classList.add("nav--menu-animate");
      });
    });
    menuEnterTimer = window.setTimeout(() => {
      header.classList.remove("nav--menu-entering");
      header.classList.add("nav--menu-animate");
    }, MENU_ENTER_MS);
  }

  function runSubEnterAnimation() {
    header.classList.remove("nav--sub-entering");
    window.clearTimeout(subEnterTimer);

    if (!mobileMq.matches || reducedMotionMq.matches) {
      header.classList.add("nav--sub-animate");
      return;
    }

    header.classList.remove("nav--sub-animate");
    header.classList.add("nav--sub-entering");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        header.classList.add("nav--sub-animate");
      });
    });
    subEnterTimer = window.setTimeout(() => {
      header.classList.remove("nav--sub-entering");
      header.classList.add("nav--sub-animate");
    }, MENU_ENTER_MS);
  }

  function resetMobileMore() {
    if (!mobileMq.matches || !moreWrap || !moreToggle || !morePanel) return;
    moreWrap.classList.remove("nav-more--open");
    morePanel.hidden = true;
    moreToggle.setAttribute("aria-expanded", "false");
    if (subBack) subBack.hidden = true;
    header.classList.remove("nav--sub-open", "nav--sub-animate", "nav--sub-entering");
    window.clearTimeout(subEnterTimer);
  }

  function setSubOpen(open) {
    if (!mobileMq.matches) return;
    const on = Boolean(open);
    header.classList.toggle("nav--sub-open", on);
    header.classList.toggle("nav--sub-animate", false);
    if (moreWrap) moreWrap.classList.toggle("nav-more--open", false);
    if (moreToggle) moreToggle.setAttribute("aria-expanded", on ? "true" : "false");
    if (morePanel) morePanel.hidden = !on;
    if (subBack) subBack.hidden = !on;
    if (on) {
      runSubEnterAnimation();
      window.requestAnimationFrame(() => subBack?.focus());
    }
  }

  function setOpen(open) {
    const on = Boolean(open);

    if (on) {
      if (mobileMq.matches && header.classList.contains("nav--on-hero")) {
        header.classList.remove("nav--on-hero");
      }
      header.classList.add("nav--menu-open");
      if (mobileMq.matches) {
        header.classList.add("nav--menu-animate");
      } else {
        header.classList.remove("nav--menu-animate");
      }
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Menu sluiten");
      document.body.classList.add("nav-menu-open");
      runMenuEnterAnimation();
      if (mobileMq.matches && !header.classList.contains("nav--sub-open")) {
        const first = links.querySelector('.nav-item[href$="sophie.html"]');
        window.requestAnimationFrame(() => first?.focus());
      }
      return;
    }

    header.classList.remove("nav--menu-animate", "nav--menu-open", "nav--menu-entering");
    clearEnterTimers();
    resetMobileMore();
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Menu openen");
    document.body.classList.remove("nav-menu-open");
  }

  toggle.addEventListener("click", () => setOpen(!header.classList.contains("nav--menu-open")));

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  header.querySelectorAll(".nav__actions a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  moreToggle?.addEventListener("click", (e) => {
    if (!mobileMq.matches || !header.classList.contains("nav--menu-open")) return;
    e.preventDefault();
    e.stopPropagation();
    setSubOpen(true);
  });

  subBack?.addEventListener("click", () => setSubOpen(false));

  document.addEventListener("keydown", (e) => {
    if (!header.classList.contains("nav--menu-open")) return;
    if (e.key !== "Escape") return;
    if (header.classList.contains("nav--sub-open")) {
      setSubOpen(false);
      moreToggle?.focus();
      return;
    }
    setOpen(false);
    toggle.focus();
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    }, 80);
  });

  setOpen(false);
  document.body.classList.remove("nav-menu-open", "ccw-chat-open");

  window.addEventListener("pageshow", () => {
    setOpen(false);
    document.body.classList.remove("nav-menu-open", "ccw-chat-open");
  });
})();

(function initNavScrollHide() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  if (window.matchMedia("(max-width: 767px)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let lastY = window.scrollY;
  let ticking = false;
  const threshold = 6;
  const topReveal = 72;

  function update() {
    const y = window.scrollY;
    const delta = y - lastY;

    if (nav.classList.contains("nav--menu-open")) {
      nav.classList.remove("nav--scroll-hidden");
      lastY = y;
      ticking = false;
      return;
    }

    if (y <= topReveal) {
      nav.classList.remove("nav--scroll-hidden");
    } else if (delta > threshold) {
      nav.classList.add("nav--scroll-hidden");
    } else if (delta < -threshold) {
      nav.classList.remove("nav--scroll-hidden");
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    },
    { passive: true }
  );
})();

(function initHomeHeroNav() {
  const nav = document.querySelector(".nav");
  const hero = document.querySelector(".home-hero-spotlight");
  if (!nav || !hero) return;

  if (!window.matchMedia("(min-width: 768px)").matches) {
    if (nav.classList.contains("nav--on-hero")) nav.classList.remove("nav--on-hero");
    return;
  }

  function update() {
    if (nav.classList.contains("nav--menu-open")) {
      if (nav.classList.contains("nav--on-hero")) nav.classList.remove("nav--on-hero");
      return;
    }
    const heroBottom = hero.getBoundingClientRect().bottom;
    const onHero = heroBottom > 72;
    if (nav.classList.contains("nav--on-hero") !== onHero) {
      nav.classList.toggle("nav--on-hero", onHero);
    }
  }

  window.addEventListener("scroll", () => window.requestAnimationFrame(update), { passive: true });
  window.addEventListener("resize", () => window.requestAnimationFrame(update), { passive: true });
  new MutationObserver(() => update()).observe(nav, {
    attributes: true,
    attributeFilter: ["class"],
  });
  update();
})();

(function initNavMore() {
  const wrap = document.querySelector(".nav-more");
  const toggle = document.querySelector(".nav-more__toggle");
  const panel = document.getElementById("nav-more-panel");
  if (!wrap || !toggle || !panel) return;

  const desktopMq = window.matchMedia("(min-width: 768px)");

  function isDesktop() {
    return desktopMq.matches;
  }

  function setOpen(open) {
    const on = Boolean(open);
    wrap.classList.toggle("nav-more--open", on);
    toggle.setAttribute("aria-expanded", on ? "true" : "false");
    if (isDesktop()) {
      panel.hidden = false;
      return;
    }
    panel.hidden = !on;
  }

  function syncMode() {
    const header = document.querySelector(".nav");
    if (isDesktop()) {
      panel.hidden = false;
      wrap.classList.remove("nav-more--open");
      toggle.setAttribute("aria-expanded", "false");
      header?.classList.remove("nav--sub-open");
      const subBack = document.getElementById("nav-mobile-sub-back");
      if (subBack) subBack.hidden = true;
      return;
    }
    if (header?.classList.contains("nav--sub-open")) return;
    panel.hidden = true;
    wrap.classList.remove("nav-more--open");
    toggle.setAttribute("aria-expanded", "false");
  }

  syncMode();

  wrap.addEventListener("mouseenter", () => {
    if (!isDesktop()) return;
    setOpen(true);
  });

  wrap.addEventListener("mouseleave", () => {
    if (!isDesktop()) return;
    setOpen(false);
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("click", (e) => {
    if (!isDesktop() || wrap.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isDesktop()) setOpen(false);
  });

  desktopMq.addEventListener("change", syncMode);
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
    "sophie-hero-stage": [
      [{ text: "De eerste AI-chatbot/agent ", gradient: false }],
      [
        { text: "speciaal ontwikkeld", gradient: false },
        { text: " voor steden en gemeenten", gradient: false },
      ],
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
      const caret = el.querySelector(".typewriter__caret");
      if (caret) caret.insertAdjacentText("beforebegin", text[i]);
      else el.append(text[i]);
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
   * @param {{ delayMs?: number }} [options]
   */
  function mountTerminal(stage, rows, options = {}) {
    const start = () => {
      void runTerminalTyping(stage, rows);
    };
    if (options.delayMs) setTimeout(start, options.delayMs);
    else start();
  }

  Object.keys(configs).forEach((id) => {
    if (id === "sophie-modules-stage") return;
    const stage = document.getElementById(id);
    if (!stage) return;
    const delayMs =
      id === "sophie-hero-stage" && !reduced ? 720 : 0;
    mountTerminal(stage, configs[id], { delayMs });
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
    let source = "api";
    if (MAPBOX_TOKEN) return MAPBOX_TOKEN;
    const fromWindow = String(window.MAPBOX_PUBLIC_TOKEN || "").trim();
    if (fromWindow) {
      source = "window";      return fromWindow;
    }
    const metaEl = document.querySelector('meta[name="mapbox-public-token"]');
    const fromMeta = String(metaEl?.content || "").trim();
    if (fromMeta) {
      source = "meta";      return fromMeta;
    }
    if (!mapboxTokenPromise) {
      mapboxTokenPromise = fetch("/api/mapbox-token", {
        method: "GET",
        headers: { Accept: "application/json" },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => String(json?.token || "").trim())
        .catch(() => "");
    }
    const token = await mapboxTokenPromise;    return token;
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

      globeWrap.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });    } catch (e) {
      globeWrap.hidden = true;    }
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
    roleChoiceButtons.forEach((btn) => btn.classList.remove("contact-flow__choice--selected"));
    if (!visible) return;
    hideGemeenteSuggestions();
    resetContactFieldAria();
    field.value = "";
    syncMirror();
  }

  function setRoleChoiceSelected(choice) {
    roleChoiceButtons.forEach((btn) => {
      const val = String(btn.getAttribute("data-role-choice") || "").trim();
      btn.classList.toggle("contact-flow__choice--selected", val === choice);
    });
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
      prompt: "Ben je een gemeente of Developper?",
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
    const step = steps[stepIndex];    if (step.key === "municipality") {
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
      const selected = String(btn.getAttribute("data-role-choice") || "").trim();
      setRoleChoiceSelected(selected);
      field.value = selected;
      syncMirror();
      clearErr();
      window.setTimeout(() => {
        submitLine();
      }, 90);
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

(function initSophieCodeTyping() {
  const code = document.querySelector(".sophie-xai-card--logic code");
  if (!code) return;

  const fullText = code.textContent || "";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionScale = (() => {
    const page = document.querySelector(".page--sophie-xai");
    if (!page) return 1;
    const raw = getComputedStyle(page).getPropertyValue("--sophie-anim").trim();
    const n = parseFloat(raw);
    return n > 0 ? n : 1.55;
  })();

  if (reduced) return;

  code.textContent = "";

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function typeCode() {
    code.classList.add("sophie-xai-code--typing");

    for (const char of fullText) {
      code.textContent += char;
      const pause =
        (char === "\n" ? 115 : 14 + Math.random() * 24) * motionScale;
      await sleep(pause);
    }

    code.classList.remove("sophie-xai-code--typing");
  }

  const target = code.closest(".sophie-xai-card--logic") || code;
  let started = false;

  const io = new IntersectionObserver(
    (entries, observer) => {
      if (started || !entries[0]?.isIntersecting) return;
      started = true;
      observer.disconnect();
      void typeCode();
    },
    { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.22 }
  );

  io.observe(target);
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

(function initSophieEmbedTypewriter() {
  const codeEl = document.getElementById("sophie-embed-typewriter");
  const hintEl = document.getElementById("sophie-embed-hint");
  const card = document.querySelector(".sophie-xai-embed-card");
  if (!codeEl || !card) return;

  const hintText = hintEl?.textContent?.trim() || "Één regel embed — Sophie verschijnt op uw site.";
  const embedSegments = [
    {
      className: "sophie-xai-embed-card__muted",
      text: "<!DOCTYPE html>\n<html lang=\"nl\">\n<head>\n  <title>Gemeente</title>\n</head>\n<body>\n  ",
    },
    {
      className: "sophie-xai-embed-card__highlight",
      text:
        '<script src="https://widget.sophie.be/embed.js"\n          async\n          data-gemeente="uw-gemeente"></script>',
    },
    {
      className: "sophie-xai-embed-card__muted",
      text: "\n</body>\n</html>",
    },
  ];

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionScale = (() => {
    const page = document.querySelector(".page--sophie-xai");
    if (!page) return 1;
    const raw = getComputedStyle(page).getPropertyValue("--sophie-anim").trim();
    const n = parseFloat(raw);
    return n > 0 ? n : 1.55;
  })();
  const pre = codeEl.closest("pre");

  function prepareForTyping() {
    codeEl.innerHTML = "";
    card.classList.remove("sophie-xai-embed-card--ready");
  }

  function showHint() {
    if (!hintEl) return;
    hintEl.textContent = hintText;
    card.classList.add("sophie-xai-embed-card--ready");
  }

  function makeCaret() {
    const el = document.createElement("span");
    el.className = "typewriter__caret sophie-xai-embed-card__caret";
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  function charDelay() {
    return (12 + Math.random() * 16) * motionScale;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * @param {HTMLElement} el
   * @param {string} text
   * @param {HTMLElement} caret
   */
  async function typeInto(el, text, caret) {
    for (let i = 0; i < text.length; i++) {
      caret.insertAdjacentText("beforebegin", text[i]);
      await sleep(charDelay());
    }
  }

  function renderInstant() {
    codeEl.innerHTML = "";
    embedSegments.forEach((segment) => {
      const span = document.createElement("span");
      span.className = segment.className;
      span.textContent = segment.text;
      codeEl.appendChild(span);
    });
    showHint();
    if (pre) pre.setAttribute("aria-busy", "false");
  }

  async function runTyping() {
    if (pre) pre.setAttribute("aria-busy", "true");
    prepareForTyping();

    const spans = embedSegments.map((segment) => {
      const span = document.createElement("span");
      span.className = segment.className;
      codeEl.appendChild(span);
      return span;
    });

    let caret = makeCaret();
    spans[0].appendChild(caret);

    for (let i = 0; i < embedSegments.length; i++) {
      if (i > 0) {
        caret.remove();
        caret = makeCaret();
        spans[i].appendChild(caret);
      }
      await typeInto(spans[i], embedSegments[i].text, caret);
    }

    caret.remove();
    showHint();
    if (pre) pre.setAttribute("aria-busy", "false");
  }

  if (reduced) {
    renderInstant();
    return;
  }

  prepareForTyping();

  let started = false;
  const io = new IntersectionObserver(
    (entries, observer) => {
      if (started || !entries[0]?.isIntersecting) return;
      started = true;
      observer.disconnect();
      void runTyping();
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.18 }
  );
  io.observe(card);
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
      const caret = el.querySelector(".typewriter__caret");
      if (caret) {
        const existing = el.textContent?.replace(/\u2588?$/, "") || "";
        // Schrijf in één keer vóór de caret zodat die zichtbaar blijft tot de caller hem verwijdert.
        el.textContent = "";
        el.append(existing + text, caret);
      } else {
        el.textContent = text;
      }
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
      const caret = el.querySelector(".typewriter__caret");
      if (caret) caret.insertAdjacentText("beforebegin", text[i]);
      else el.append(text[i]);
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

(function initHeroVideo() {
  var video = document.querySelector('.about-xai-hero__video');
  if (!video) return;
  video.playbackRate = 0.4;
  video.addEventListener('canplay', function() { video.playbackRate = 0.4; });
})();

(function initSophieApiTabs() {
  var visual = document.querySelector(".sophie-xai-api__visual");
  if (!visual) return;

  var codeEl = visual.querySelector(".sophie-xai-code-card code");
  var preEl = visual.querySelector(".sophie-xai-code-card pre");
  var tabs = visual.querySelectorAll("[data-sophie-tab]");
  if (!codeEl || !tabs.length) return;

  var snippets = {
    javascript:
      'import Sophie from "@sophie/agent";\n\n' +
      "const agent = new Sophie({\n" +
      '  gemeente: "uw-gemeente",\n' +
      '  kanalen: ["web", "whatsapp"],\n' +
      "});\n\n" +
      "agent.route(vraag)\n" +
      "  .naarJuisteDienst()\n" +
      "  .metLokaalReglement();",
    html:
      '<!-- Sophie chatwidget op uw gemeentelijke website -->\n' +
      '<div id="sophie-chat"\n' +
      '     data-sophie-gemeente="uw-gemeente"\n' +
      '     data-sophie-taal="nl"></div>\n' +
      '<script src="https://widget.sophie.be/embed.js" async><\/script>',
    whatsapp:
      'import Sophie from "@sophie/agent";\n\n' +
      "const agent = new Sophie({\n" +
      '  gemeente: "uw-gemeente",\n' +
      '  kanalen: ["whatsapp"],\n' +
      "});\n\n" +
      "agent.verbindWhatsApp({\n" +
      '  webhook: "/api/sophie/whatsapp",\n' +
      '  welkom: "Hallo, ik ben Sophie — waarmee kan ik u helpen?",\n' +
      "});\n\n" +
      'agent.on("bericht", (vraag) => agent.route(vraag).naarJuisteDienst());',
  };

  function lockCodePanelHeight() {
    if (!preEl || !visual) return;

    var activeKey = "javascript";
    tabs.forEach(function (t) {
      if (t.classList.contains("is-active")) {
        activeKey = t.getAttribute("data-sophie-tab") || activeKey;
      }
    });

    var isMobile = window.matchMedia("(max-width: 767px)").matches;
    visual.style.minHeight = "";
    preEl.style.minHeight = "";

    if (!isMobile) {
      codeEl.textContent = snippets[activeKey] || snippets.javascript;
      return;
    }

    var maxVisualHeight = 0;
    var maxPreHeight = 0;

    Object.keys(snippets).forEach(function (key) {
      codeEl.textContent = snippets[key];
      maxPreHeight = Math.max(maxPreHeight, preEl.scrollHeight);
      maxVisualHeight = Math.max(maxVisualHeight, visual.getBoundingClientRect().height);
    });

    preEl.style.minHeight = maxPreHeight + "px";
    visual.style.minHeight = Math.ceil(maxVisualHeight) + "px";
    codeEl.textContent = snippets[activeKey] || snippets.javascript;
  }

  function activateTab(tab) {
    var key = tab.getAttribute("data-sophie-tab");
    if (!key || !snippets[key]) return;

    tabs.forEach(function (t) {
      var isActive = t === tab;
      t.classList.toggle("is-active", isActive);
      t.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (preEl) {
      preEl.classList.add("is-updating");
      preEl.setAttribute("aria-labelledby", tab.id);
    }

    window.setTimeout(function () {
      codeEl.textContent = snippets[key];
      if (preEl) preEl.classList.remove("is-updating");
    }, 120);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activateTab(tab);
    });
  });

  lockCodePanelHeight();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(lockCodePanelHeight);
  }
  window.addEventListener("resize", lockCodePanelHeight);
})();

(function initSophieShowcaseGlobe() {
  const root = document.getElementById("sophie-showcase-globe");
  if (!root) return;

  const GLOBE_START = {
    center: [-42, 26],
    zoom: 1.42,
    pitch: 52,
    bearing: -18,
  };

  const ZOOM_OUT = {
    center: [3.58, 50.96],
    zoom: 7.65,
    pitch: 44,
    bearing: -10,
  };

  /** Gent → uitzoomen → Gavere → De Pinte → Pittem */
  const ROUTE = [
    { name: "Gent", lng: 3.7174, lat: 51.0543 },
    { name: "Gavere", lng: 3.6619, lat: 50.9289 },
    { name: "De Pinte", lng: 3.6475, lat: 50.9934 },
    { name: "Pittem", lng: 3.3278, lat: 50.9917 },
  ];

  let map = null;
  let mapboxAssetsPromise = null;
  let mapboxTokenPromise = null;
  let started = false;
  let tourRunning = false;
  let tourActive = false;
  const motionScale = (() => {
    const page = document.querySelector(".page--sophie-xai");
    if (!page) return 1;
    const raw = getComputedStyle(page).getPropertyValue("--sophie-anim").trim();
    const n = parseFloat(raw);
    return n > 0 ? n : 1.55;
  })();

  function motionMs(base, reducedBase) {
    return reducedBase != null && arguments.length > 1
      ? reducedBase
      : Math.round(base * motionScale);
  }

  function loadMapboxAssets() {
    if (window.mapboxgl) return Promise.resolve();
    if (!mapboxAssetsPromise) {
      mapboxAssetsPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('link[href*="mapbox-gl.css"]');
        if (existing) {
          const wait = () => {
            if (window.mapboxgl) resolve();
            else window.setTimeout(wait, 30);
          };
          wait();
          return;
        }
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.11.0/mapbox-gl.css";
        document.head.appendChild(link);
        const script = document.createElement("script");
        script.src = "https://api.mapbox.com/mapbox-gl-js/v3.11.0/mapbox-gl.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Mapbox laden mislukt"));
        document.head.appendChild(script);
      });
    }
    return mapboxAssetsPromise;
  }

  async function getMapboxToken() {
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

  function disableMapInteractions(instance) {
    try {
      instance.scrollZoom.disable();
      instance.boxZoom.disable();
      instance.dragRotate.disable();
      instance.dragPan.disable();
      instance.keyboard.disable();
      instance.doubleClickZoom.disable();
      if (instance.touchZoomRotate) instance.touchZoomRotate.disable();
    } catch (e) {
      /* ignore */
    }
  }

  function showFallback(message) {
    root.innerHTML =
      '<p class="sophie-xai-globe__fallback" role="status">' + message + "</p>";
  }

  function triggerResize() {
    if (!map) return;
    try {
      map.resize();
    } catch (e) {
      /* ignore */
    }
  }

  function applySpaceFog(instance) {
    instance.setFog({
      range: [0.5, 10],
      "horizon-blend": 0.1,
      color: "rgb(186, 210, 235)",
      "high-color": "rgb(54, 118, 235)",
      "space-color": "rgb(8, 10, 28)",
      "star-intensity": 0.55,
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function waitMoveEnd(instance) {
    return new Promise((resolve) => {
      function done() {
        if (instance.isMoving && instance.isMoving()) {
          instance.once("moveend", done);
          return;
        }
        resolve();
      }
      instance.once("moveend", done);
    });
  }

  function flyToView(instance, opts, reduced) {
    const duration =
      opts.duration != null ? opts.duration : motionMs(7200, reduced ? 800 : null);
    instance.flyTo({
      center: opts.center,
      zoom: opts.zoom,
      pitch: opts.pitch != null ? opts.pitch : 50,
      bearing: opts.bearing != null ? opts.bearing : GLOBE_START.bearing,
      duration,
      curve: 1.35,
      essential: true,
    });
    return waitMoveEnd(instance);
  }

  function flyToCity(instance, target, legIndex, reduced, options) {
    const o = options || {};
    const duration =
      o.duration != null ? o.duration : motionMs(6800, reduced ? 1100 : null);
    instance.flyTo({
      center: [target.lng, target.lat],
      zoom: o.zoom != null ? o.zoom : 13.15 + (legIndex % 3) * 0.05,
      pitch: o.pitch != null ? o.pitch : 54 + (legIndex % 2),
      bearing: o.bearing != null ? o.bearing : -18 + (legIndex * 14) % 48,
      duration,
      curve: 1.35,
      essential: true,
    });
    return waitMoveEnd(instance);
  }

  async function runTour(reduced) {
    if (!map || !tourActive || tourRunning) return;
    tourRunning = true;

    try {
      await flyToCity(map, ROUTE[0], 0, reduced, {
        zoom: 13.2,
        pitch: 56,
        duration: reduced ? 1200 : motionMs(9000),
      });
      if (!tourActive) return;
      await sleep(reduced ? 450 : motionMs(1800));

      await flyToView(map, ZOOM_OUT, reduced);
      if (!tourActive) return;
      await sleep(reduced ? 450 : motionMs(1600));

      for (let i = 1; i < ROUTE.length; i++) {
        await flyToCity(map, ROUTE[i], i, reduced, {
          duration: reduced ? 1000 : motionMs(6400),
        });
        if (!tourActive) return;
        await sleep(reduced ? 380 : motionMs(1500));
      }

      await flyToView(map, GLOBE_START, reduced);
      if (!tourActive) return;
      await sleep(reduced ? 650 : motionMs(2400));
    } finally {
      tourRunning = false;
    }

    if (tourActive) {
      window.setTimeout(() => {
        void runTour(reduced);
      }, reduced ? 500 : motionMs(700));
    }
  }

  function stopTour() {
    tourActive = false;
  }

  async function initMap() {
    if (started) return;
    started = true;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      await loadMapboxAssets();
    } catch (e) {
      showFallback("De wereldbol kan niet geladen worden. Controleer je netwerkverbinding.");
      return;
    }

    const token = await getMapboxToken();
    if (!token) {
      showFallback("De wereldbol kan niet geladen worden. Mapbox token ontbreekt.");
      return;
    }

    mapboxgl.accessToken = token;

    await new Promise((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
    });

    map = new mapboxgl.Map({
      container: root,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: GLOBE_START.center,
      zoom: GLOBE_START.zoom,
      pitch: GLOBE_START.pitch,
      bearing: GLOBE_START.bearing,
      projection: "globe",
      antialias: true,
      attributionControl: false,
      failIfMajorPerformanceCaveat: false,
    });

    root._sophieGlobeMap = map;
    disableMapInteractions(map);

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => triggerResize());
      ro.observe(root);
      const card = root.closest(".sophie-xai-card--globe");
      if (card) ro.observe(card);
    }

    window.addEventListener("resize", triggerResize, { passive: true });
    window.addEventListener("orientationchange", triggerResize, { passive: true });
    window.setTimeout(triggerResize, 120);
    window.setTimeout(triggerResize, 420);

    await new Promise((resolve) => {
      if (map.loaded()) resolve();
      else map.once("load", resolve);
    });

    triggerResize();
    applySpaceFog(map);

    if (reduced) {
      map.jumpTo({
        center: [ROUTE[0].lng, ROUTE[0].lat],
        zoom: 12.8,
        pitch: 52,
        bearing: -14,
      });
      return;
    }

    tourActive = true;
    void runTour(reduced);
  }

  const card = root.closest(".sophie-xai-card--globe");
  if (!card) {
    void initMap();
    return;
  }

  const io = new IntersectionObserver(
    (entries, observer) => {
      if (!entries[0]?.isIntersecting) {
        stopTour();
        return;
      }
      observer.disconnect();
      void initMap();
    },
    { root: null, rootMargin: "0px 0px -6% 0px", threshold: 0.12 }
  );

  io.observe(card);
})();

(function initSophieFaqAccordion() {
  const root = document.querySelector("[data-sophie-faq]");
  if (!root) return;

  const items = root.querySelectorAll(".sophie-xai-faq__item");

  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
})();

(function initSophieModuleExpand() {
  const grid = document.querySelector(".sophie-xai-module-grid");
  if (!grid) return;

  const mq = window.matchMedia("(max-width: 767px)");
  const modules = grid.querySelectorAll(".sophie-xai-module");

  function syncVisualA11y(module) {
    const visual = module.querySelector(".sophie-xai-module__visual");
    if (!visual) return;

    if (!mq.matches) {
      visual.removeAttribute("role");
      visual.removeAttribute("tabindex");
      visual.removeAttribute("aria-expanded");
      return;
    }

    visual.setAttribute("role", "button");
    visual.setAttribute("tabindex", "0");
    visual.setAttribute(
      "aria-expanded",
      module.classList.contains("is-expanded") ? "true" : "false"
    );
  }

  function collapseAll(except) {
    modules.forEach((module) => {
      if (module === except) return;
      module.classList.remove("is-expanded");
      syncVisualA11y(module);
    });
  }

  modules.forEach((module) => {
    const visual = module.querySelector(".sophie-xai-module__visual");
    if (!visual) return;

    function toggleModule(event) {
      if (!mq.matches) return;
      if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
      if (event.type === "keydown") event.preventDefault();
      if (event.target !== visual && !visual.contains(event.target)) return;

      const willExpand = !module.classList.contains("is-expanded");
      if (willExpand) {
        collapseAll(module);
        module.classList.add("is-expanded");
      } else {
        module.classList.remove("is-expanded");
      }
      syncVisualA11y(module);
    }

    visual.addEventListener("click", toggleModule);
    visual.addEventListener("keydown", toggleModule);

    syncVisualA11y(module);
  });

  mq.addEventListener("change", () => {
    if (mq.matches) {
      modules.forEach(syncVisualA11y);
      return;
    }
    modules.forEach((module) => {
      module.classList.remove("is-expanded");
      syncVisualA11y(module);
    });
  });
})();
