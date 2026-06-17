#!/usr/bin/env node
/**
 * Regenerate sitemap.xml from seo/site.js + gemeenten list.
 * Usage: node scripts/generate-sitemap.js
 */
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { slugifyGemeente } = require("./slugify-gemeente");

async function main() {
  const sitePath = pathToFileURL(path.join(__dirname, "..", "seo", "site.js")).href;
  const { SITEMAP_PAGES, SITE_URL } = await import(sitePath);

  const gemeentenPath = path.join(__dirname, "..", "vlaamse-gemeenten.json");
  const gemeenten = JSON.parse(fs.readFileSync(gemeentenPath, "utf8"));
  const gemeentePages = gemeenten.map((naam) => ({
    path: `/gemeenten/${slugifyGemeente(naam)}`,
    priority: "0.6",
    changefreq: "monthly",
  }));

  const allPages = [
    ...SITEMAP_PAGES,
    { path: "/gemeenten", priority: "0.7", changefreq: "weekly" },
    ...gemeentePages,
  ];

  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = allPages
    .map(
      (p) => `  <url>
    <loc>${SITE_URL}${p.path === "/" ? "/" : p.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  const out = path.join(__dirname, "..", "sitemap.xml");
  fs.writeFileSync(out, xml, "utf8");
  console.log(`Wrote ${out} (${allPages.length} URLs)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
