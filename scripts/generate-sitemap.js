#!/usr/bin/env node
/**
 * Regenerate sitemap.xml from seo/site.js page list.
 * Usage: node scripts/generate-sitemap.js
 */
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://www.sophietechnologies.be";
const PAGES = [
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

const lastmod = new Date().toISOString().slice(0, 10);
const urls = PAGES.map(
  (p) => `  <url>
    <loc>${SITE_URL}${p.path === "/" ? "/" : p.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const out = path.join(__dirname, "..", "sitemap.xml");
fs.writeFileSync(out, xml, "utf8");
console.log("Wrote", out);
