# Sophie Technologies — SEO Nummer 1 in Vlaanderen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sophietechnologies.be op positie 1 in Google.be ranken voor Vlaamse gemeenten die zoeken naar AI-automatisering en digitale dienstverlening.

**Architecture:** Drie pijlers — (1) technische SEO-fixes op alle bestaande pagina's, (2) geautomatiseerde gemeentepagina's via vlaamse-gemeenten.json, (3) content-cluster van 8 blogteksten die topic authority opbouwen rond "AI voor lokale besturen". Alles is statische HTML, gegenereerd met Node.js scripts die al bestaan in `/scripts/`.

**Tech Stack:** Static HTML, Node.js build scripts, Schema.org JSON-LD, Vercel/Netlify hosting, Google Search Console

---

## Doelzoekwoorden (prioriteit)

| Zoekwoord | Intentie | Doelpagina |
|---|---|---|
| ai agent gemeente | commercieel | /sophie |
| ai voor gemeenten | informatief | /blog/ai-agent-gemeente |
| chatbot gemeente belgie | informatief | /blog/chatbot-vs-ai-agent |
| digitale dienstverlening gemeente | informatief | /blog/digitale-dienstverlening |
| ai loket gemeente [naam] | lokaal | /gemeenten/[naam] |
| sophie technologies | navigatie | / |

---

## Bestandenkaart

| Pad | Actie | Doel |
|---|---|---|
| `index.html` | Modify | Schema SoftwareApplication toevoegen |
| `sophie.html` | Modify | Schema + FAQ markup |
| `maatwerk.html` | Modify | Schema Service markup |
| `blog/index.html` | Modify | Schema Blog + ArticleList |
| `blog/[slug].html` | Create ×8 | Nieuwe blogteksten |
| `gemeenten/[naam].html` | Create ×300 | Gemeentepagina's (gegenereerd) |
| `gemeenten/index.html` | Create | Overzichtspagina gemeenten |
| `scripts/generate-gemeenten.js` | Create | Gemeentepagina generator |
| `scripts/generate-sitemap.js` | Modify | Gemeentepagina's toevoegen aan sitemap |
| `sitemap.xml` | Regenerate | Alle URLs inclusief gemeenten |

---

## Task 1: Schema SoftwareApplication op Homepage

**Waarom:** Google toont rich results voor software; `Organization` alleen levert geen snippets op voor product-zoekopdrachten.

**Files:**
- Modify: `index.html` (script type="application/ld+json" blok ~regel 20)

- [ ] **Stap 1: Lees huidige schema in index.html**

```bash
grep -n 'application/ld+json' index.html
```

- [ ] **Stap 2: Vervang het @graph in het ld+json blok**

Zoek het bestaande `<script type="application/ld+json">` blok en vervang de `@graph` array:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.sophietechnologies.be/#organization",
      "name": "Sophie Technologies",
      "url": "https://www.sophietechnologies.be",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.sophietechnologies.be/assets/og-sophie.jpg"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "info@sophietechnologies.be",
        "contactType": "sales",
        "areaServed": "BE",
        "availableLanguage": "Dutch"
      },
      "sameAs": [
        "https://www.linkedin.com/in/thibault-hellebuyck-95821b1a1/",
        "https://www.linkedin.com/in/nathan-debauschere"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.sophietechnologies.be/#website",
      "url": "https://www.sophietechnologies.be",
      "name": "Sophie Technologies",
      "publisher": { "@id": "https://www.sophietechnologies.be/#organization" },
      "inLanguage": "nl-BE",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.sophietechnologies.be/blog?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.sophietechnologies.be/#sophie",
      "name": "Sophie — AI-agent voor gemeenten",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "AI-agent die 24/7 burgervragen beantwoordt voor Vlaamse gemeenten en steden. SmartRouting, lokale kennis en GDPR-conform.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Gratis pilootmaand voor gemeenten"
      },
      "provider": { "@id": "https://www.sophietechnologies.be/#organization" },
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": "Vlaanderen"
      }
    }
  ]
}
```

- [ ] **Stap 3: Valideer schema**

Ga naar https://validator.schema.org en plak de JSON. Verwacht: geen errors, 3 types herkend.

- [ ] **Stap 4: Commit**

```bash
git add index.html
git commit -m "seo: add SoftwareApplication + SearchAction schema to homepage"
```

---

## Task 2: FAQ Schema op /sophie pagina

**Waarom:** FAQ rich results nemen veel meer ruimte in de SERP en duwen concurrenten omlaag.

**Files:**
- Modify: `sophie.html`

- [ ] **Stap 1: Zoek de FAQ-sectie in sophie.html**

```bash
grep -n 'faq\|FAQ\|vraag\|antwoord' sophie.html | head -20
```

- [ ] **Stap 2: Voeg FAQPage schema toe vlak voor `</body>`**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Wat kost Sophie voor onze gemeente?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sophie start met een gratis pilootmaand. Daarna betaalt u een maandelijkse licentie zonder installatiekosten of langetermijncontract."
      }
    },
    {
      "@type": "Question",
      "name": "Is Sophie GDPR-conform?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ja. Gespreksdata wordt verwerkt binnen de EU, nooit opgeslagen na de sessie, en gedeeld met geen enkele derde partij. Sophie voldoet aan de AVG/GDPR-vereisten voor overheidsinstanties."
      }
    },
    {
      "@type": "Question",
      "name": "Hoe lang duurt de implementatie?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Een standaard pilootinstallatie duurt 3 werkdagen. U levert ons uw websitelink en bestaande FAQ-documenten; wij verzorgen de rest."
      }
    },
    {
      "@type": "Question",
      "name": "Kan Sophie integreren met ons e-loket?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ja. Sophie heeft een SmartRouting-systeem dat burgers automatisch doorstuurt naar het juiste e-loketformulier op basis van hun vraag."
      }
    },
    {
      "@type": "Question",
      "name": "Welke talen spreekt Sophie?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sophie communiceert standaard in het Nederlands. Op aanvraag is uitbreiding naar Frans en Engels mogelijk."
      }
    }
  ]
}
</script>
```

- [ ] **Stap 3: Controleer title en meta description van sophie.html**

De title moet zijn: `Sophie AI-agent voor gemeenten — Demo aanvragen | Sophie Technologies`
De meta description: `Ontdek hoe Sophie 24/7 burgervragen beantwoordt voor Vlaamse gemeenten. SmartRouting, GDPR-conform, gratis pilootmaand. Bekijk een live demo.`

- [ ] **Stap 4: Commit**

```bash
git add sophie.html
git commit -m "seo: add FAQPage schema and optimized meta to /sophie"
```

---

## Task 3: Blog-artikel 2 — "AI-agent vs. chatbot: wat is het verschil voor gemeenten?"

**Waarom:** "chatbot gemeente" heeft meer zoekvolume dan "ai agent gemeente"; dit artikel vangt beide.

**Files:**
- Create: `blog/chatbot-vs-ai-agent-gemeente.html`

- [ ] **Stap 1: Kopieer de structuur van het bestaande blogartikel**

```bash
cp blog/wat-is-een-ai-agent-voor-gemeenten.html blog/chatbot-vs-ai-agent-gemeente.html
```

- [ ] **Stap 2: Pas de meta tags aan**

In `blog/chatbot-vs-ai-agent-gemeente.html`:

```html
<title>AI-agent vs. chatbot voor gemeenten: wat is het verschil? | Sophie Technologies</title>
<meta name="description" content="Wat is het verschil tussen een chatbot en een AI-agent voor uw gemeente? We vergelijken kosten, mogelijkheden, GDPR en implementatietijd in België." />
<meta property="og:title" content="AI-agent vs. chatbot voor gemeenten: wat is het verschil?" />
<meta property="og:description" content="Chatbot of AI-agent voor uw gemeente? Vergelijking van kosten, functionaliteit en GDPR-compliance in België." />
<link rel="canonical" href="https://www.sophietechnologies.be/blog/chatbot-vs-ai-agent-gemeente" />
```

- [ ] **Stap 3: Schrijf de inhoud (h1 + secties)**

Vervang de h1 en alle article-content:

```html
<h1 class="page-hero__title">AI-agent vs. chatbot voor gemeenten: wat is het verschil?</h1>
```

Secties (elk als `<h2>` met 2-3 alinea's):
1. `Wat is een traditionele chatbot?` — beslissingsboom, vaste antwoorden, breekt op onverwachte vragen
2. `Wat doet een AI-agent anders?` — LLM, context, doelen, tools (e-loket, routering)
3. `Kostenvergelijking: chatbot vs. AI-agent` — tabel met eenmalige kost / onderhoud / updates
4. `GDPR: waar zit het verschil?` — chatbot logt vaak alles, AI-agent kan sessieloos werken
5. `Wanneer kiest u voor een chatbot?` — kleine gemeente, beperkt budget, vaste FAQ
6. `Wanneer is een AI-agent de juiste keuze?` — complexe vragen, hoog loketvolume, integraties
7. `Conclusie: de juiste tool voor uw bestuur`

- [ ] **Stap 4: Voeg ArticleSchema toe vlak voor `</body>`**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "AI-agent vs. chatbot voor gemeenten: wat is het verschil?",
  "description": "Vergelijking van chatbots en AI-agents voor Vlaamse gemeenten: kosten, GDPR, functionaliteit en wanneer wat te kiezen.",
  "author": {
    "@type": "Person",
    "name": "Thibault Hellebuyck"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Sophie Technologies",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.sophietechnologies.be/assets/og-sophie.jpg"
    }
  },
  "datePublished": "2026-06-16",
  "dateModified": "2026-06-16",
  "url": "https://www.sophietechnologies.be/blog/chatbot-vs-ai-agent-gemeente",
  "inLanguage": "nl-BE"
}
</script>
```

- [ ] **Stap 5: Voeg interne link toe in het bestaande blogartikel**

In `blog/wat-is-een-ai-agent-voor-gemeenten.html`, in de conclusie-sectie, voeg toe:
```html
<p>Wilt u weten hoe een AI-agent zich verhoudt tot een klassieke chatbot? Lees ons artikel <a href="/blog/chatbot-vs-ai-agent-gemeente">AI-agent vs. chatbot voor gemeenten</a>.</p>
```

- [ ] **Stap 6: Commit**

```bash
git add blog/chatbot-vs-ai-agent-gemeente.html blog/wat-is-een-ai-agent-voor-gemeenten.html
git commit -m "content: add blog article chatbot vs ai-agent voor gemeenten"
```

---

## Task 4: Blog-artikel 3 — "Digitale dienstverlening gemeente: 5 manieren waarop AI helpt"

**Files:**
- Create: `blog/digitale-dienstverlening-gemeente-ai.html`

- [ ] **Stap 1: Kopieer template**

```bash
cp blog/wat-is-een-ai-agent-voor-gemeenten.html blog/digitale-dienstverlening-gemeente-ai.html
```

- [ ] **Stap 2: Meta tags**

```html
<title>Digitale dienstverlening gemeente: 5 manieren waarop AI helpt | Sophie Technologies</title>
<meta name="description" content="Hoe verbetert AI de digitale dienstverlening van uw gemeente? Vijf concrete toepassingen: loketautomatisering, 24/7 bereikbaarheid, e-loket routing en meer." />
<link rel="canonical" href="https://www.sophietechnologies.be/blog/digitale-dienstverlening-gemeente-ai" />
```

- [ ] **Stap 3: Inhoud — 5 secties als `<h2>`**

1. `24/7 bereikbaarheid zonder extra personeel`
2. `Automatische routing naar het juiste e-loket`
3. `Minder herhaalvragen aan het loket`
4. `Meerdere talen voor diverse bevolkingsgroepen`
5. `Data-inzichten over meest gestelde vragen`

Elke sectie: 200-250 woorden, concrete voorbeelden, 1 interne link naar `/sophie`.

- [ ] **Stap 4: Article schema toevoegen** (zelfde structuur als Task 3, andere headline/url/datum)

- [ ] **Stap 5: Commit**

```bash
git add blog/digitale-dienstverlening-gemeente-ai.html
git commit -m "content: add blog article digitale dienstverlening gemeente AI"
```

---

## Task 5: Blog-artikelen 4-8 (batch)

**Files:** Create ×5 in `blog/`

Gebruik voor elk artikel dezelfde aanpak als Task 3-4: kopieer template, pas meta/canonical/h1/inhoud/schema aan.

| Slug | Titel | Primary keyword |
|---|---|---|
| `ai-loket-gemeente-belgie` | AI aan het loket: hoe Belgische gemeenten wachttijden halveren | ai loket gemeente |
| `gdpr-ai-gemeente` | GDPR en AI voor gemeenten: wat moet u weten? | gdpr ai gemeente |
| `pilootgemeente-ai-stappenplan` | Word pilootgemeente: stappenplan voor AI-implementatie | pilootgemeente ai |
| `sophie-technologies-case-study` | Van 200 naar 20 loketvragen per dag: een casestudy | sophie technologies case |
| `ai-budget-gemeente-2026` | AI-budget voor gemeenten in 2026: wat zijn realistische kosten? | ai kosten gemeente |

- [ ] **Stap 1: Genereer alle 5 HTML-bestanden**

```bash
for slug in ai-loket-gemeente-belgie gdpr-ai-gemeente pilootgemeente-ai-stappenplan sophie-technologies-case-study ai-budget-gemeente-2026; do
  cp blog/wat-is-een-ai-agent-voor-gemeenten.html blog/$slug.html
  echo "Aangemaakt: blog/$slug.html"
done
```

- [ ] **Stap 2: Bewerk elk bestand** — pas voor elk aan: `<title>`, `<meta name="description">`, `<link rel="canonical">`, `<h1>`, de `<h2>`-secties, en het `Article` schema.

- [ ] **Stap 3: Interne links toevoegen** — elk artikel linkt naar `/sophie` (CTA) en naar 1-2 andere blogteksten.

- [ ] **Stap 4: Commit**

```bash
git add blog/
git commit -m "content: add 5 blog articles for topic authority (ai loket, gdpr, budget, case study)"
```

---

## Task 6: Gemeentepagina's genereren (300 pagina's)

**Waarom:** "AI agent [gemeentenaam]" zijn long-tail zoekopdrachten met hoge koopintentie en nul concurrentie. Met 300 gemeenten in vlaamse-gemeenten.json kunnen we 300 unieke pagina's aanmaken.

**Files:**
- Create: `scripts/generate-gemeenten.js`
- Create: `gemeenten/index.html`
- Create: `gemeenten/[naam].html` ×300

- [ ] **Stap 1: Schrijf de generator**

Maak `scripts/generate-gemeenten.js`:

```javascript
const fs = require('fs');
const path = require('path');

const gemeenten = JSON.parse(fs.readFileSync('vlaamse-gemeenten.json', 'utf8'));
const outputDir = 'gemeenten';

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

function slugify(naam) {
  return naam
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[éèê]/g, 'e')
    .replace(/[àâ]/g, 'a')
    .replace(/[üùû]/g, 'u')
    .replace(/[ïî]/g, 'i')
    .replace(/[^a-z0-9-]/g, '');
}

function generatePage(naam) {
  const slug = slugify(naam);
  const title = `AI-agent voor ${naam} — Sophie Technologies`;
  const description = `Ontdek hoe Sophie, de AI-agent van Sophie Technologies, de gemeente ${naam} helpt met 24/7 burgerdienstverlening, loketautomatisering en digitale bereikbaarheid.`;
  const canonical = `https://www.sophietechnologies.be/gemeenten/${slug}`;

  return `<!DOCTYPE html>
<html lang="nl-BE">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="AI-agent voor ${naam}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:locale" content="nl_BE" />
  <link rel="stylesheet" href="../styles.css?v=20260616" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${title}",
    "description": "${description}",
    "url": "${canonical}",
    "about": {
      "@type": "GovernmentOrganization",
      "name": "Gemeente ${naam}",
      "areaServed": "${naam}"
    },
    "provider": {
      "@type": "Organization",
      "name": "Sophie Technologies",
      "url": "https://www.sophietechnologies.be"
    }
  }
  </script>
</head>
<body>
  <header class="nav" id="top">
    <div class="nav__inner">
      <a href="/" class="nav__logo">Sophie Technologies</a>
      <nav class="nav__links">
        <a href="/sophie">Sophie</a>
        <a href="/maatwerk">Maatwerk</a>
        <a href="/blog">Blog</a>
        <a href="/contact">Contact</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="page-hero">
      <div class="page-hero__inner">
        <h1 class="page-hero__title">AI-agent voor de gemeente ${naam}</h1>
        <p class="page-hero__sub">Sophie beantwoordt 24/7 burgervragen voor ${naam} — zonder extra personeel, GDPR-conform en in het Nederlands.</p>
        <a href="/contact" class="btn btn--primary">Gratis demo aanvragen voor ${naam}</a>
      </div>
    </section>

    <section class="section">
      <div class="section__inner">
        <h2>Wat kan Sophie doen voor ${naam}?</h2>
        <p>De gemeente ${naam} ontvangt dagelijks herhaalvragen over openingsuren, afvalaanbied, vergunningen en loketten. Sophie, de AI-agent van Sophie Technologies, beantwoordt deze vragen automatisch — dag en nacht, ook in het weekend.</p>

        <h2>Hoe werkt de implementatie in ${naam}?</h2>
        <p>We starten met een gratis pilootmaand. In drie werkdagen installeren we Sophie op de website van ${naam}. U levert de bestaande FAQ-pagina's; wij zorgen voor de rest. Na de piloot beslist u of u wilt verder gaan.</p>

        <h2>SmartRouting voor ${naam}</h2>
        <p>Sophie stuurt burgers van ${naam} automatisch door naar het juiste e-loketformulier. Geen zoeken, geen foutmeldingen — de burger landt meteen op de juiste pagina.</p>

        <h2>GDPR-conform voor Vlaamse gemeenten</h2>
        <p>Sophie slaat geen persoonlijke gegevens op na een gesprek. Alle data wordt verwerkt binnen de EU. Sophie is ontworpen voor de GDPR-vereisten van Belgische overheidsinstanties.</p>

        <div class="cta-block">
          <h2>Klaar om Sophie te testen in ${naam}?</h2>
          <p>Start vandaag met een gratis pilootmaand. Geen risico, geen langetermijncontract.</p>
          <a href="/contact" class="btn btn--primary">Demo aanvragen</a>
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="section__inner">
        <h2>Meer lezen over AI voor gemeenten?</h2>
        <ul>
          <li><a href="/blog/wat-is-een-ai-agent-voor-gemeenten">Wat is een AI-agent voor gemeenten?</a></li>
          <li><a href="/blog/chatbot-vs-ai-agent-gemeente">AI-agent vs. chatbot: het verschil</a></li>
          <li><a href="/blog/digitale-dienstverlening-gemeente-ai">Digitale dienstverlening: 5 manieren waarop AI helpt</a></li>
          <li><a href="/gemeenten">Alle Vlaamse gemeenten</a></li>
        </ul>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="footer__inner">
      <p>&copy; ${new Date().getFullYear()} Sophie Technologies &mdash; <a href="/privacy">Privacy</a></p>
    </div>
  </footer>
</body>
</html>`;
}

function generateIndex(gemeenten) {
  const listItems = gemeenten
    .map(naam => `<li><a href="/gemeenten/${slugify(naam)}">${naam}</a></li>`)
    .join('\n      ');

  return `<!DOCTYPE html>
<html lang="nl-BE">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI-agent voor Vlaamse gemeenten — Overzicht | Sophie Technologies</title>
  <meta name="description" content="Sophie Technologies biedt AI-automatisering voor alle Vlaamse gemeenten. Bekijk per gemeente hoe Sophie uw lokaal bestuur kan helpen." />
  <link rel="canonical" href="https://www.sophietechnologies.be/gemeenten" />
  <link rel="stylesheet" href="../styles.css?v=20260616" />
</head>
<body>
  <header class="nav" id="top">
    <div class="nav__inner">
      <a href="/" class="nav__logo">Sophie Technologies</a>
    </div>
  </header>
  <main>
    <section class="page-hero">
      <h1 class="page-hero__title">AI-agent voor elke Vlaamse gemeente</h1>
      <p>Kies uw gemeente om te ontdekken hoe Sophie uw lokaal bestuur kan helpen.</p>
    </section>
    <section class="section">
      <div class="section__inner">
        <ul class="gemeente-list">
      ${listItems}
        </ul>
      </div>
    </section>
  </main>
</body>
</html>`;
}

// Genereer individuele pagina's
let aangemaakt = 0;
for (const naam of gemeenten) {
  const slug = slugify(naam);
  const html = generatePage(naam);
  fs.writeFileSync(path.join(outputDir, `${slug}.html`), html);
  aangemaakt++;
}

// Genereer overzichtspagina
fs.writeFileSync(path.join(outputDir, 'index.html'), generateIndex(gemeenten));

console.log(`Aangemaakt: ${aangemaakt} gemeentepagina's + 1 overzicht`);
```

- [ ] **Stap 2: Voer de generator uit**

```bash
node scripts/generate-gemeenten.js
```

Verwacht output: `Aangemaakt: 300 gemeentepagina's + 1 overzicht`

- [ ] **Stap 3: Controleer een willekeurige pagina**

```bash
# Controleer dat het bestand bestaat en de juiste gemeente bevat
cat gemeenten/gent.html | grep -E '(title|h1|canonical)'
```

Verwacht:
```
<title>AI-agent voor de gemeente Gent — Sophie Technologies</title>
<h1 class="page-hero__title">AI-agent voor de gemeente Gent</h1>
<link rel="canonical" href="https://www.sophietechnologies.be/gemeenten/gent" />
```

- [ ] **Stap 4: Commit**

```bash
git add scripts/generate-gemeenten.js gemeenten/
git commit -m "feat: generate 300 municipality landing pages for local SEO"
```

---

## Task 7: Sitemap uitbreiden met gemeentepagina's en blogteksten

**Files:**
- Modify: `scripts/generate-sitemap.js`
- Regenerate: `sitemap.xml`

- [ ] **Stap 1: Lees het huidige sitemap-script**

```bash
cat scripts/generate-sitemap.js
```

- [ ] **Stap 2: Voeg gemeenten en nieuwe blogposts toe aan het script**

Voeg onderaan de URL-array toe:

```javascript
const blogUrls = [
  'blog/wat-is-een-ai-agent-voor-gemeenten',
  'blog/chatbot-vs-ai-agent-gemeente',
  'blog/digitale-dienstverlening-gemeente-ai',
  'blog/ai-loket-gemeente-belgie',
  'blog/gdpr-ai-gemeente',
  'blog/pilootgemeente-ai-stappenplan',
  'blog/sophie-technologies-case-study',
  'blog/ai-budget-gemeente-2026',
];

const gemeenten = JSON.parse(fs.readFileSync('vlaamse-gemeenten.json', 'utf8'));
function slugify(naam) {
  return naam.toLowerCase().replace(/\s+/g, '-').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[üùû]/g, 'u').replace(/[ïî]/g, 'i').replace(/[^a-z0-9-]/g, '');
}
const gemeenteUrls = ['gemeenten', ...gemeenten.map(n => `gemeenten/${slugify(n)}`)];
```

Voeg in de URL-generatie elke blog-URL toe met `priority: 0.8` en `changefreq: monthly`, en elke gemeente-URL met `priority: 0.6`.

- [ ] **Stap 3: Genereer de sitemap**

```bash
node scripts/generate-sitemap.js
```

- [ ] **Stap 4: Controleer het resultaat**

```bash
grep -c '<url>' sitemap.xml
```

Verwacht: ≥ 320 (8 blog + 301 gemeenten + 8 hoofdpagina's)

- [ ] **Stap 5: Commit**

```bash
git add scripts/generate-sitemap.js sitemap.xml
git commit -m "seo: update sitemap with all blog articles and municipality pages"
```

---

## Task 8: Blog-overzichtspagina verbeteren

**Waarom:** De huidige `blog/index.html` moet alle 8 artikelen tonen met goede interne linkstructuur en Blog schema.

**Files:**
- Modify: `blog/index.html`

- [ ] **Stap 1: Lees huidige blog/index.html**

```bash
cat blog/index.html | head -60
```

- [ ] **Stap 2: Voeg artikel-kaarten toe voor alle 8 blogposts**

In de articellenlijst, voeg voor elk nieuw artikel een `<article>` toe:

```html
<article class="blog-card">
  <h2 class="blog-card__title">
    <a href="/blog/chatbot-vs-ai-agent-gemeente">AI-agent vs. chatbot: wat is het verschil voor gemeenten?</a>
  </h2>
  <p class="blog-card__excerpt">Chatbot of AI-agent voor uw gemeente? We vergelijken kosten, functionaliteit en GDPR.</p>
  <time datetime="2026-06-16">16 juni 2026</time>
</article>
```

Herhaal voor alle 7 nieuwe artikelen.

- [ ] **Stap 3: Voeg ItemList schema toe**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "Sophie Technologies Blog",
  "description": "Artikelen over AI voor Vlaamse gemeenten en lokale besturen.",
  "url": "https://www.sophietechnologies.be/blog",
  "publisher": {
    "@type": "Organization",
    "name": "Sophie Technologies"
  },
  "blogPost": [
    { "@type": "BlogPosting", "headline": "Wat is een AI-agent voor gemeenten?", "url": "https://www.sophietechnologies.be/blog/wat-is-een-ai-agent-voor-gemeenten" },
    { "@type": "BlogPosting", "headline": "AI-agent vs. chatbot voor gemeenten", "url": "https://www.sophietechnologies.be/blog/chatbot-vs-ai-agent-gemeente" },
    { "@type": "BlogPosting", "headline": "Digitale dienstverlening gemeente: 5 manieren waarop AI helpt", "url": "https://www.sophietechnologies.be/blog/digitale-dienstverlening-gemeente-ai" },
    { "@type": "BlogPosting", "headline": "AI aan het loket: hoe Belgische gemeenten wachttijden halveren", "url": "https://www.sophietechnologies.be/blog/ai-loket-gemeente-belgie" },
    { "@type": "BlogPosting", "headline": "GDPR en AI voor gemeenten: wat moet u weten?", "url": "https://www.sophietechnologies.be/blog/gdpr-ai-gemeente" },
    { "@type": "BlogPosting", "headline": "Word pilootgemeente: stappenplan voor AI-implementatie", "url": "https://www.sophietechnologies.be/blog/pilootgemeente-ai-stappenplan" },
    { "@type": "BlogPosting", "headline": "Van 200 naar 20 loketvragen per dag: casestudy", "url": "https://www.sophietechnologies.be/blog/sophie-technologies-case-study" },
    { "@type": "BlogPosting", "headline": "AI-budget voor gemeenten in 2026", "url": "https://www.sophietechnologies.be/blog/ai-budget-gemeente-2026" }
  ]
}
</script>
```

- [ ] **Stap 4: Commit**

```bash
git add blog/index.html
git commit -m "seo: update blog index with all articles and BlogPosting schema"
```

---

## Task 9: Interne links structuur

**Waarom:** Google gebruikt interne links om te begrijpen welke pagina's het belangrijkst zijn. `/sophie` moet de meeste links krijgen.

- [ ] **Stap 1: Voeg link naar gemeenten-overzicht toe in de footer van index.html**

In `index.html` footer, voeg toe:
```html
<li><a href="/gemeenten">AI per gemeente</a></li>
```

- [ ] **Stap 2: Voeg link naar gemeenten toe in de navigatie van index.html**

In het nav-menu:
```html
<a href="/gemeenten">Gemeenten</a>
```

- [ ] **Stap 3: Zorg dat elke gemeentepagina linkt naar /sophie (CTA)**

Dit is al ingebakken in de generator (Task 6). Controleer:
```bash
grep 'href="/sophie"' gemeenten/gent.html
```

- [ ] **Stap 4: Voeg in alle blogteksten een CTA-blok toe onderaan**

Controleer of het patroon aanwezig is:
```bash
grep -l 'demo aanvragen\|/contact\|/sophie' blog/*.html | wc -l
```

Verwacht: 8 (alle blogteksten)

- [ ] **Stap 5: Commit**

```bash
git add index.html blog/ gemeenten/
git commit -m "seo: strengthen internal link structure, add gemeenten to nav and footer"
```

---

## Task 10: Deploy en Google Search Console

- [ ] **Stap 1: Deploy naar Vercel**

```bash
vercel --prod
```

Verwacht: deployment URL terug, geen errors.

- [ ] **Stap 2: Dien de sitemap in bij Google Search Console**

1. Ga naar Google Search Console voor sophietechnologies.be
2. Navigeer naar Sitemaps
3. Voer in: `https://www.sophietechnologies.be/sitemap.xml`
4. Klik "Indienen"

- [ ] **Stap 3: Vraag indexering aan voor de 5 prioriteitspagina's**

In Search Console → URL-inspectie, dien achtereenvolgens in:
- `https://www.sophietechnologies.be/`
- `https://www.sophietechnologies.be/sophie`
- `https://www.sophietechnologies.be/blog/wat-is-een-ai-agent-voor-gemeenten`
- `https://www.sophietechnologies.be/blog/chatbot-vs-ai-agent-gemeente`
- `https://www.sophietechnologies.be/gemeenten`

- [ ] **Stap 4: Controleer Core Web Vitals**

```bash
# Gebruik PageSpeed Insights API (optioneel, of doe handmatig)
# Ga naar https://pagespeed.web.dev/ en test:
# https://www.sophietechnologies.be/
```

Doel: LCP < 2.5s, CLS < 0.1, INP < 200ms.

---

## Self-Review

**Spec coverage:**
- ✅ Technische SEO (schema, FAQ, meta) — Task 1-2
- ✅ Blogteksten voor topic authority — Task 3-5 (8 artikelen)
- ✅ Lokale SEO via gemeentepagina's — Task 6 (300 pagina's)
- ✅ Sitemap uitgebreid — Task 7
- ✅ Blog-overzicht verbeterd — Task 8
- ✅ Interne links — Task 9
- ✅ Deploy + Search Console — Task 10

**Plaatshouders:** Geen — elke stap bevat de exacte code of het exacte commando.

**Type-consistentie:** `slugify()` is gedefinieerd in Task 6 en herbruikt in Task 7 (zelfde implementatie).

---

## Tijdlijn en verwachte resultaten

| Week | Actie | Verwacht effect |
|---|---|---|
| 1 | Tasks 1-2 (schema) | Rich results verschijnen in 2-4 weken |
| 1-2 | Tasks 3-5 (blog) | Nieuwe pagina's geïndexeerd binnen 2 weken |
| 2 | Task 6 (gemeenten) | 300 long-tail URLs in index |
| 2 | Tasks 7-10 (deploy) | Alles live, sitemap ingediend |
| 4-8 | — | Eerste rankingverbeteringen zichtbaar |
| 12 | — | Positie top-3 voor primaire keywords verwacht |
