const { saveAppointment } = require("./lib/appointments-store");
const { sendNotificationEmail, escapeHtml } = require("./lib/notify");

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

  if (form === "contact") {
    const roleLabel = payload.role === "gemeente" ? "Gemeente" : "Ontwikkelaar";
    try {
      await saveAppointment({
        naam: `${payload.firstName.trim()} ${payload.lastName.trim()}`,
        email: payload.email.trim(),
        telefoon: payload.phone?.trim() || "",
        datum: "",
        tijdstip: "",
        onderwerp: `Contactformulier — ${roleLabel}`,
        bericht: payload.message.trim(),
        gemeente: payload.role === "gemeente" ? payload.municipality?.trim() || "" : "",
        rol: payload.role,
        bron: "contact",
        payload,
      });
    } catch (e) {
      console.error("Appointment store (contact):", e);
      return res.status(500).json({ error: "Opslaan mislukt. Probeer later opnieuw." });
    }

    const roleLabel = payload.role === "gemeente" ? "Gemeente" : "Ontwikkelaar";
    await sendNotificationEmail({
      subject: `📬 Nieuw contactformulier — ${roleLabel}`,
      html: `
        <h2 style="margin:0 0 16px">Nieuw bericht via sophietechnologies.be</h2>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:15px">
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:140px">Naam</td><td style="padding:8px 12px">${escapeHtml(payload.firstName)} ${escapeHtml(payload.lastName)}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">E-mail</td><td style="padding:8px 12px">${escapeHtml(payload.email)}</td></tr>
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Rol</td><td style="padding:8px 12px">${escapeHtml(roleLabel)}</td></tr>
          ${payload.role === "gemeente" ? `<tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Gemeente</td><td style="padding:8px 12px">${escapeHtml(payload.municipality || "")}</td></tr>` : ""}
          ${payload.phone ? `<tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600">Telefoon</td><td style="padding:8px 12px">${escapeHtml(payload.phone)}</td></tr>` : ""}
          <tr><td style="padding:8px 12px;background:#f3f4f6;font-weight:600;vertical-align:top">Bericht</td><td style="padding:8px 12px;white-space:pre-wrap">${escapeHtml(payload.message)}</td></tr>
        </table>
      `,
      text: `Nieuw contactformulier\n\nNaam: ${payload.firstName} ${payload.lastName}\nE-mail: ${payload.email}\nRol: ${roleLabel}${payload.role === "gemeente" ? `\nGemeente: ${payload.municipality || ""}` : ""}\nBericht:\n${payload.message}`,
    }).catch((e) => console.error("E-mail notificatie mislukt:", e));
  }

  return res.status(201).json({ ok: true });
};
