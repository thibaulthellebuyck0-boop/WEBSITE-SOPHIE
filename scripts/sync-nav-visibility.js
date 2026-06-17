#!/usr/bin/env node
/**
 * Sync nav/footer links and noindex tags with seo/page-visibility.json.
 * Usage: node scripts/sync-nav-visibility.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const visibility = JSON.parse(
  fs.readFileSync(path.join(ROOT, "seo", "page-visibility.json"), "utf8")
);

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".git" || ent.name === "embed") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (ent.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function stripNavGemeenten(html) {
  return html.replace(
    /\n\s*<a class="nav-mega__card nav-more__link" href="(?:\.\.\/)?(?:gemeenten\/|index\.html)" role="menuitem">\s*\n\s*<span class="nav-mega__card-title">Gemeenten<\/span>\s*\n\s*<span class="nav-mega__card-desc">[^<]*<\/span>\s*\n\s*<\/a>/g,
    ""
  );
}

function stripNavChatbotGemeente(html) {
  return html.replace(
    /\n\s*<a class="nav-mega__card nav-more__link" href="(?:\.\.\/)?chatbot-gemeente\.html"[^>]*>\s*\n\s*<span class="nav-mega__card-title">Chatbot gemeente<\/span>\s*\n\s*<span class="nav-mega__card-desc">[^<]*<\/span>\s*\n\s*<\/a>/g,
    ""
  );
}

function stripFooterHidden(html) {
  return html
    .replace(/\n\s*<li><a href="(?:\.\.\/)?fixit\.html">FixIt<\/a><\/li>/g, "")
    .replace(/\n\s*<li><a href="(?:\.\.\/)?login\.html">Log in<\/a><\/li>/g, "")
    .replace(/\n\s*<li><a href="(?:\.\.\/)?studio\.html">Sophie Studio<\/a><\/li>/g, "")
    .replace(/\n\s*<li><a href="(?:\.\.\/)?chatbot-gemeente\.html">Chatbot gemeente<\/a><\/li>/g, "");
}

function replaceChatbotGemeenteLinks(html) {
  return html
    .replace(/href="\.\.\/chatbot-gemeente\.html"/g, 'href="../sophie.html"')
    .replace(/href="chatbot-gemeente\.html"/g, 'href="sophie.html"');
}

function stripOfflineNav(html) {
  let out = html;

  if (!visibility.fixit.online) {
    out = out.replace(
      /\n\s*<a class="nav-item nav-pill-target" href="(?:\.\.\/)?fixit\.html">FixIt<\/a>/g,
      ""
    );
  }

  if (!visibility.blog.online) {
    out = out.replace(
      /\n\s*<a class="nav-mega__card nav-more__link" href="(?:\.\.\/)?(?:\/blog\/?|blog\/?)" role="menuitem">\s*\n\s*<span class="nav-mega__card-title">Blog<\/span>\s*\n\s*<span class="nav-mega__card-desc">[^<]*<\/span>\s*\n\s*<\/a>/g,
      ""
    );
    out = out.replace(
      /\n\s*<li><a href="(?:\.\.\/)?(?:\/blog\/?|blog\/?)">Blog<\/a><\/li>/g,
      ""
    );
  }

  if (!visibility.login.online) {
    out = out.replace(
      /\n\s*<a class="nav__cta nav__cta--ghost" href="(?:\.\.\/)?login\.html">Log in<\/a>/g,
      ""
    );
  }

  if (!visibility.chatbotGemeente?.online) {
    out = stripNavChatbotGemeente(out);
    out = replaceChatbotGemeenteLinks(out);
  }

  return stripFooterHidden(stripNavGemeenten(out));
}

function addNoindexIfOffline(file, html) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const isFixit = rel === "fixit.html";
  const isBlog = rel.startsWith("blog/");
  const isLogin = rel === "login.html";
  const isChatbotGemeente = rel === "chatbot-gemeente.html";
  const offline =
    (isFixit && !visibility.fixit.online) ||
    (isBlog && !visibility.blog.online) ||
    (isLogin && !visibility.login.online) ||
    (isChatbotGemeente && !visibility.chatbotGemeente?.online);
  if (!offline) return html;

  const tag = '<meta name="robots" content="noindex, nofollow" />';
  if (html.includes(tag)) return html;
  return html.replace(/<meta name="viewport"[^>]*\s*\/>/, (m) => `${m}\n  ${tag}`);
}

function patchIndexSearchAction(html) {
  if (visibility.blog.online) return html;
  return html.replace(
    /,\s*"potentialAction":\s*\{\s*"@type":\s*"SearchAction",[\s\S]*?"query-input":\s*"required name=search_term_string"\s*\}/,
    ""
  );
}

let changed = 0;
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, "utf8");
  let after = stripOfflineNav(before);
  after = addNoindexIfOffline(file, after);
  if (path.basename(file) === "index.html" && path.dirname(file) === ROOT) {
    after = patchIndexSearchAction(after);
  }
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed += 1;
  }
}

console.log(`Updated ${changed} HTML file(s) from page-visibility.json`);
