#!/usr/bin/env node
/**
 * Generate /gemeenten landing pages for local SEO.
 * Usage: node scripts/generate-gemeenten.js
 */
const fs = require("fs");
const path = require("path");
const { slugifyGemeente } = require("./slugify-gemeente");

const SITE_URL = "https://www.sophietechnologies.be";
const ROOT = path.join(__dirname, "..");
const INPUT = path.join(ROOT, "vlaamse-gemeenten.json");
const OUTPUT = path.join(ROOT, "gemeenten");
const visibility = JSON.parse(
  fs.readFileSync(path.join(ROOT, "seo", "page-visibility.json"), "utf8")
);

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function navBlock() {
  const fixitLink = visibility.fixit.online
    ? `        <a class="nav-item nav-pill-target" href="../fixit.html">FixIt</a>\n`
    : "";
  const blogCard = visibility.blog.online
    ? `              <a class="nav-mega__card nav-more__link" href="/blog" role="menuitem">
                <span class="nav-mega__card-title">Blog</span>
                <span class="nav-mega__card-desc">Kennis over AI voor lokale besturen.</span>
              </a>
`
    : "";

  return `  <header class="nav" id="top">
    <div class="nav__inner">
      <a class="nav__logo" href="../index.html" aria-label="Sophie home">Sophie</a>
      <button
        class="nav__menu"
        type="button"
        id="nav-menu-toggle"
        aria-expanded="false"
        aria-controls="nav-primary"
        aria-label="Menu openen"
      >
        <svg class="nav__menu-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
          <rect class="nav__menu-icon-frame" x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path class="nav__menu-icon-rail" d="M9 5.5v13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <path class="nav__menu-icon-close" d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <nav class="nav__links" id="nav-primary" aria-label="Hoofdnavigatie">
        <span class="nav__pill" aria-hidden="true"></span>
        <a class="nav-item nav-pill-target" href="../index.html">Home</a>
        <a class="nav-item nav-pill-target" href="../sophie.html">Sophie</a>
        <a class="nav-item nav-pill-target" href="../maatwerk.html">Maatwerk</a>
${fixitLink}        <a class="nav-item nav-pill-target" href="../over-ons.html">Over ons</a>
        <div class="nav-more nav-pill-target">
          <button
            type="button"
            class="nav-item nav-more__toggle"
            id="nav-more-toggle"
            aria-expanded="false"
            aria-controls="nav-more-panel"
            aria-haspopup="true"
          >
            Verder
          </button>
          <div class="nav-more__panel nav-mega" id="nav-more-panel" role="menu" hidden>
            <button type="button" class="nav-mobile-sub__back" id="nav-mobile-sub-back" hidden>
              <span class="nav-mobile-sub__back-icon" aria-hidden="true">‹</span>
              Terug
            </button>
            <div class="nav-mega__grid">
${blogCard}              <a class="nav-mega__card nav-more__link" href="../contact.html" role="menuitem">
                <span class="nav-mega__card-title">Contact</span>
                <span class="nav-mega__card-desc">Plan een gesprek of stel uw vraag.</span>
              </a>
            </div>
          </div>
        </div>
        <div class="nav__actions">
${visibility.login.online ? `          <a class="nav__cta nav__cta--ghost" href="../login.html">Log in</a>\n` : ""}          <a class="nav__cta nav__cta--primary" href="../contact.html">Begin vandaag</a>
        </div>
      </nav>
    </div>
  </header>`;
}

function footerBlock() {
  const blogFooter = visibility.blog.online
    ? `            <li><a href="/blog">Blog</a></li>\n`
    : "";

  return `  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__top">
        <div class="footer__brand">
          <a class="footer__logo" href="../index.html">Sophie</a>
          <p class="footer__mission">
            AI-assistent voor gemeenten en steden — duidelijke antwoorden, slimme doorverwijzing, altijd bereikbaar.
          </p>
          <div class="footer__cta-row">
            <a class="footer__btn footer__btn--primary" href="../contact.html">Pilootgemeente worden?</a>
            <a class="footer__btn footer__btn--secondary" href="../mee-bouwen.html">Wil je meebouwen?</a>
          </div>
        </div>
        <nav class="footer__nav" aria-labelledby="footer-nav-heading">
          <h2 id="footer-nav-heading" class="footer__heading">Pagina&rsquo;s</h2>
          <ul>
            <li><a href="../index.html">Home</a></li>
            <li><a href="../over-ons.html">Over ons</a></li>
            <li><a href="../sophie.html">AI voor gemeenten</a></li>
            <li><a href="index.html">AI per gemeente</a></li>
            <li><a href="../maatwerk.html">Maatwerk</a></li>
${blogFooter}            <li><a href="../contact.html">Contact</a></li>
            <li><a href="../privacy.html">Privacy</a></li>
          </ul>
        </nav>
      </div>
      <div class="footer__bottom">
        <p class="footer__legal">&copy; <span id="year"></span> Sophie. Alle rechten voorbehouden.</p>
      </div>
    </div>
  </footer>`;
}

function jsonAttr(value) {
  return JSON.stringify(value).slice(1, -1);
}

function generatePage(naam) {
  const slug = slugifyGemeente(naam);
  const safe = escapeHtml(naam);
  const title = `Chatbot voor ${naam} — AI-agent gemeente | Sophie`;
  const description = `Chatbot en AI-agent voor de gemeente ${naam}. Sophie beantwoordt 24/7 vragen over afval, loketten en vergunningen — GDPR-conform, gratis pilootmaand.`;
  const canonical = `${SITE_URL}/gemeenten/${slug}`;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="description" content="${escapeHtml(description)}" />
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="nl_BE" />
  <meta property="og:site_name" content="Sophie Technologies" />
  <meta property="og:title" content="Chatbot voor ${safe}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE_URL}/assets/og-sophie.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="stylesheet" href="../styles.css?v=20260616-gemeenten" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "${SITE_URL}/#organization",
        "name": "Sophie Technologies",
        "url": "${SITE_URL}"
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "${SITE_URL}/" },
          { "@type": "ListItem", "position": 2, "name": "Gemeenten", "item": "${SITE_URL}/gemeenten" },
          { "@type": "ListItem", "position": 3, "name": "${jsonAttr(naam)}", "item": "${canonical}" }
        ]
      },
      {
        "@type": "WebPage",
        "name": "${escapeHtml(title)}",
        "description": "${escapeHtml(description)}",
        "url": "${canonical}",
        "about": {
          "@type": "GovernmentOrganization",
          "name": "Gemeente ${safe}"
        },
        "provider": { "@id": "${SITE_URL}/#organization" },
        "inLanguage": "nl-BE"
      },
      {
        "@type": "SoftwareApplication",
        "name": "Sophie — chatbot voor ${safe}",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "${escapeHtml(description)}",
        "url": "${canonical}",
        "provider": { "@id": "${SITE_URL}/#organization" },
        "areaServed": { "@type": "City", "name": "${jsonAttr(naam)}" }
      }
    ]
  }
  </script>
</head>
<body>
${navBlock()}

  <main class="page page--gemeente">
    <div class="about-shell">
      <header class="page-hero page-hero--blog">
        <p class="eyebrow">Gemeente ${safe}</p>
        <h1 class="page-hero__title">Chatbot voor ${safe}</h1>
        <p class="page-hero__lead">
          Sophie is de chatbot en AI-agent die 24/7 burgervragen beantwoordt voor ${safe} — met lokale kennis,
          SmartRouting naar uw loket en GDPR als uitgangspunt.
        </p>
        <div class="home-hero__actions">
          <a class="btn btn--primary" href="../contact.html">Gratis demo voor ${safe}</a>
          <a class="btn btn--ghost" href="../sophie.html">Ontdek Sophie</a>
        </div>
      </header>

      <article class="blog-article reveal">
        <h2>Wat kan de chatbot doen voor ${safe}?</h2>
        <p>
          De gemeente ${safe} ontvangt dagelijks herhaalvragen over openingsuren, afval, vergunningen en loketten.
          Sophie, de chatbot en AI-agent van Sophie Technologies, beantwoordt deze vragen automatisch — ook buiten kantooruren en in
          het weekend.
        </p>
        <p>
          Burgers krijgen een helder antwoord in het Nederlands. Complexere dossiers worden doorgestuurd naar de juiste
          dienst via <a href="../sophie.html">SmartRouting naar uw e-loket</a>.
        </p>

        <h2>Implementatie in ${safe}</h2>
        <p>
          We starten met een gratis pilootmaand. U levert uw bestaande FAQ-pagina&rsquo;s en websitelink; wij zorgen
          voor configuratie en embed op uw site. Na de piloot beslist uw bestuur of u verder gaat — zonder
          langetermijncontract.
        </p>
        <p>
          Lees meer over <a href="../sophie.html">chatbots voor gemeenten en overheden</a>
          als u wilt weten hoe zo&rsquo;n traject in de praktijk verloopt.
        </p>

        <h2>GDPR en vertrouwen</h2>
        <p>
          Sophie is ontworpen voor Belgische overheidsinstanties. We bespreken graag dataverwerking, bewaartermijnen en
          controle door uw medewerkers. Meer achtergrond vindt u op onze
          <a href="../sophie.html">Sophie-productpagina</a>.
        </p>
      </article>

      <aside class="blog-article__cta reveal" aria-label="Volgende stap">
        <p class="blog-article__cta-kicker">Pilootgemeente ${safe}</p>
        <h2>Test Sophie één maand kosteloos</h2>
        <p>Ontdek hoe een AI-agent past bij uw loketten en burgers — zonder lang traject vooraf.</p>
        <a class="btn btn--primary" href="../contact.html">Plan een gesprek</a>
      </aside>
    </div>
  </main>

${footerBlock()}

  <script src="../main.js?v=20260616-gemeenten"></script>
</body>
</html>`;
}

function generateIndex(gemeenten) {
  const sorted = [...gemeenten].sort((a, b) => a.localeCompare(b, "nl"));
  const listItems = sorted
    .map((naam) => {
      const slug = slugifyGemeente(naam);
      return `          <li><a href="${slug}.html">${escapeHtml(naam)}</a></li>`;
    })
    .join("\n");

  const title = "Chatbot voor Vlaamse gemeenten — Overzicht | Sophie";
  const description =
    "Chatbot en AI-agent voor alle Vlaamse gemeenten en steden. Bekijk per gemeente hoe Sophie uw lokaal bestuur helpt met 24/7 burgerdienstverlening.";
  const canonical = `${SITE_URL}/gemeenten`;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="description" content="${description}" />
  <title>${title}</title>
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="nl_BE" />
  <meta property="og:site_name" content="Sophie Technologies" />
  <meta property="og:title" content="Chatbot voor elke Vlaamse gemeente" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE_URL}/assets/og-sophie.jpg" />
  <link rel="stylesheet" href="../styles.css?v=20260616-gemeenten" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Chatbot voor Vlaamse gemeenten",
    "description": "${description}",
    "url": "${canonical}",
    "numberOfItems": ${sorted.length},
    "inLanguage": "nl-BE"
  }
  </script>
</head>
<body>
${navBlock()}

  <main class="page page--gemeente">
    <div class="about-shell">
      <header class="page-hero page-hero--blog">
        <p class="eyebrow">Lokale SEO</p>
        <h1 class="page-hero__title">AI-agent voor elke Vlaamse gemeente</h1>
        <p class="page-hero__lead">
          Kies uw gemeente om te ontdekken hoe Sophie 24/7 burgerdienstverlening ondersteunt — met SmartRouting,
          lokale kennis en een gratis pilootmaand.
        </p>
      </header>

      <section class="gemeente-index reveal" aria-label="Alle gemeenten">
        <p class="gemeente-index__count">${sorted.length} gemeenten in Vlaanderen</p>
        <ul class="gemeente-index__list">
${listItems}
        </ul>
      </section>
    </div>
  </main>

${footerBlock()}

  <script src="../main.js?v=20260616-gemeenten"></script>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error("Missing", INPUT);
    process.exit(1);
  }

  const gemeenten = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  if (!Array.isArray(gemeenten) || !gemeenten.length) {
    console.error("Empty gemeenten list");
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

  let count = 0;
  for (const naam of gemeenten) {
    const slug = slugifyGemeente(naam);
    fs.writeFileSync(path.join(OUTPUT, `${slug}.html`), generatePage(naam), "utf8");
    count++;
  }

  fs.writeFileSync(path.join(OUTPUT, "index.html"), generateIndex(gemeenten), "utf8");
  console.log(`Aangemaakt: ${count} gemeentepagina's + 1 overzicht`);
}

main();
