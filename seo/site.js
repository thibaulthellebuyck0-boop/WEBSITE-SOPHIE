/** Canonical site URL and sitemap page list (used by scripts/generate-sitemap.js). */
export const SITE_URL = "https://www.sophietechnologies.be";
export const SITE_NAME = "Sophie Technologies";
export const OG_IMAGE = `${SITE_URL}/assets/og-sophie.jpg`;

export const SITEMAP_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/sophie", priority: "0.95", changefreq: "weekly" },
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
];
