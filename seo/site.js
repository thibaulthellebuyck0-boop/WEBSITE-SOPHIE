import pageVisibility from "./page-visibility.json" with { type: "json" };

/** Canonical site URL and sitemap page list (used by scripts/generate-sitemap.js). */
export const SITE_URL = "https://www.sophietechnologies.be";
export const SITE_NAME = "Sophie Technologies";
export const OG_IMAGE = `${SITE_URL}/assets/og-sophie.jpg`;

export const PAGE_VISIBILITY = pageVisibility;

const ALL_SITEMAP_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/chatbot-gemeente", priority: "0.98", changefreq: "weekly" },
  { path: "/sophie", priority: "0.95", changefreq: "weekly" },
  { path: "/fixit", priority: "0.9", changefreq: "monthly" },
  { path: "/maatwerk", priority: "0.9", changefreq: "monthly" },
  { path: "/contact", priority: "0.8", changefreq: "monthly" },
  { path: "/over-ons", priority: "0.7", changefreq: "monthly" },
  { path: "/mee-bouwen", priority: "0.5", changefreq: "monthly" },
  { path: "/blog", priority: "0.75", changefreq: "weekly" },
  {
    path: "/blog/wat-is-een-ai-agent-voor-gemeenten",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/chatbot-vs-ai-agent-gemeente",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/digitale-dienstverlening-gemeente-ai",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/ai-loket-gemeente-belgie",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/gdpr-ai-gemeente",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/pilootgemeente-ai-stappenplan",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/sophie-technologies-case-study",
    priority: "0.8",
    changefreq: "monthly",
  },
  {
    path: "/blog/ai-budget-gemeente-2026",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/whatsapp-ai-gemeente",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/smart-routing-e-loket",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/ai-voor-kleine-gemeenten",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/meertalige-ai-gemeente",
    priority: "0.85",
    changefreq: "monthly",
  },
  {
    path: "/blog/ai-meldingen-gemeente-fixit",
    priority: "0.85",
    changefreq: "monthly",
  },
  { path: "/privacy", priority: "0.4", changefreq: "yearly" },
];

function isSitemapPathOnline(pathname) {
  if (!PAGE_VISIBILITY.fixit.online && pathname === "/fixit") return false;
  if (!PAGE_VISIBILITY.blog.online && (pathname === "/blog" || pathname.startsWith("/blog/"))) {
    return false;
  }
  if (!PAGE_VISIBILITY.chatbotGemeente.online && pathname === "/chatbot-gemeente") {
    return false;
  }
  return true;
}

export const SITEMAP_PAGES = ALL_SITEMAP_PAGES.filter((page) => isSitemapPathOnline(page.path));
