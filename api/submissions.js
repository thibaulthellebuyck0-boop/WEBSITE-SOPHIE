const { createClient } = require("@supabase/supabase-js");

/**
 * Vercel levert `req.body` soms als object, soms als string of Buffer.
 */
function parseRequestBody(req) {
  const b = req.body;
  if (b == null) return null;
  if (typeof b === "object" && !Buffer.isBuffer(b)) return b;
  const s = Buffer.isBuffer(b) ? b.toString("utf8") : String(b);
  return JSON.parse(s || "{}");
}

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.headers["x-real-ip"] || "";
}

function validateContact(payload) {
  if (!payload || typeof payload !== "object") return "Ongeldige payload.";
  const role = payload.role;
  if (role !== "gemeente" && role !== "ontwikkelaar") return "Ongeldige rol.";
  if (typeof payload.firstName !== "string" || !payload.firstName.trim()) return "Voornaam ontbreekt.";
  if (typeof payload.lastName !== "string" || !payload.lastName.trim()) return "Achternaam ontbreekt.";
  if (typeof payload.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim()))
    return "Ongeldig e-mailadres.";
  if (typeof payload.message !== "string" || !payload.message.trim()) return "Bericht ontbreekt.";
  if (role === "gemeente") {
    if (typeof payload.municipality !== "string" || !payload.municipality.trim()) return "Gemeente ontbreekt.";
  }
  return null;
}

function validateRecruit(payload) {
  if (!payload || typeof payload !== "object") return "Ongeldige payload.";
  const keys = ["firstName", "lastName", "email", "stack", "experience", "motivation"];
  for (const k of keys) {
    if (typeof payload[k] !== "string" || !payload[k].trim()) return `Veld ${k} ontbreekt.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) return "Ongeldig e-mailadres.";
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(503).json({ error: "Server is niet geconfigureerd (Supabase-omgeving ontbreekt)." });
  }

  let body;
  try {
    body = parseRequestBody(req);
  } catch {
    return res.status(400).json({ error: "Ongeldige JSON." });
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Lege of ongeldige aanvraag." });
  }

  if (body.website != null && String(body.website).trim() !== "") {
    return res.status(400).json({ error: "Bad request" });
  }

  const form = body.form;
  const payload = body.payload;
  if (form !== "contact" && form !== "recruit") {
    return res.status(400).json({ error: "Ongeldig formulier." });
  }

  const err = form === "contact" ? validateContact(payload) : validateRecruit(payload);
  if (err) return res.status(400).json({ error: err });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const source_ip = getClientIp(req) || null;

  const { error } = await supabase.from("submissions").insert({
    form,
    payload,
    source_ip,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return res.status(500).json({ error: "Opslaan mislukt. Probeer later opnieuw." });
  }

  return res.status(201).json({ ok: true });
};
