#!/usr/bin/env node
/**
 * Sync footer contact people across pages with contact block.
 * Usage: node scripts/patch-footer-contacts.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const SAM_BLOCK = `            <li class="footer__person">
              <span class="footer__person-name">Sam Lambrechts</span>
              <span class="footer__person-role">Developer</span>
              <div class="footer__person-contact">
                <a class="footer__social" href="mailto:samlambrechts1@hotmail.com">
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                    <path
                      d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a1.5 1.5 0 01-1.572 0L1.5 8.67z"
                    />
                    <path
                      d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"
                    />
                  </svg>
                  E-mail
                </a>
              </div>
            </li>
`;

const OLD_SIMON_BLOCK =
  /<li class="footer__person">\s*<span class="footer__person-name">Simon Lambrechts<\/span>\s*<span class="footer__person-role">Developer<\/span>\s*<\/li>/g;

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".git" || ent.name === "embed") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (ent.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function patch(html) {
  if (!html.includes("footer__contact-block")) return html;

  let out = html.replace(/Founder &amp; CEO/g, "Founder &amp; CTO");
  out = out.replace(OLD_SIMON_BLOCK, SAM_BLOCK.trim());

  if (!out.includes("Sam Lambrechts")) {
    out = out.replace(
      /(<\/div>\s*<\/li>\s*)(<li class="footer__person">\s*<span class="footer__person-name">Nathan Debauschere<\/span>)/,
      `$1${SAM_BLOCK}$2`
    );
  }

  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, "utf8");
  const after = patch(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed += 1;
  }
}

console.log(`Updated footer contacts in ${changed} file(s)`);
