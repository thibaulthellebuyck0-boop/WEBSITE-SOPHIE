#!/usr/bin/env node
/**
 * Add chatbot-gemeente internal links to nav mega menus and footers.
 * Usage: node scripts/patch-seo-links.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const visibility = JSON.parse(
  fs.readFileSync(path.join(ROOT, "seo", "page-visibility.json"), "utf8")
);

if (!visibility.chatbotGemeente?.online) {
  console.log("chatbot-gemeente offline — skipped patch-seo-links.js");
  process.exit(0);
}

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".git" || ent.name === "embed") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (ent.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function patch(html, file) {
  let out = html;
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const depth = rel.split("/").length - 1;
  const prefix = depth === 0 ? "" : "../".repeat(depth);
  const chatbotHref = `${prefix}chatbot-gemeente.html`;

  if (!out.includes(chatbotHref) && out.includes('footer__heading">Pagina')) {
    const footerLine = `            <li><a href="${chatbotHref}">Chatbot gemeente</a></li>\n`;
    if (out.includes('href="sophie.html">AI voor gemeenten</a></li>')) {
      out = out.replace(
        /(<li><a href="(?:\.\.\/)?sophie\.html">AI voor gemeenten<\/a><\/li>\n)/,
        `$1${footerLine}`
      );
    } else if (out.includes('href="../sophie.html">AI voor gemeenten</a></li>')) {
      out = out.replace(
        /(<li><a href="\.\.\/sophie\.html">AI voor gemeenten<\/a><\/li>\n)/,
        `$1${footerLine}`
      );
    }
  }

  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (file.endsWith("chatbot-gemeente.html")) continue;
  const before = fs.readFileSync(file, "utf8");
  const after = patch(before, file);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed += 1;
  }
}

console.log(`Patched SEO links in ${changed} HTML file(s)`);
