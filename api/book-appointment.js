const { saveAppointment } = require("./lib/appointments-store");

function isAvailable(dateStr, time) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const [h] = time.split(":").map(Number);
  if (day >= 1 && day <= 5) {
    return (h >= 8 && h < 12) || (h >= 16 && h < 20);
  }
  if (day === 0 || day === 6) {
    return h >= 9 && h < 12;
  }
  return false;
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body;
  try {
    const b = req.body;
    body = typeof b === "string" ? JSON.parse(b) : b;
  } catch {
    return res.status(400).json({ error: "Ongeldige JSON." });
  }

  const { naam, email, telefoon, datum, tijdstip, onderwerp, bron, bericht, gemeente, rol } = body || {};
  const cleanNaam = String(naam || "").trim();
  const cleanEmail = String(email || "").trim();
  const cleanPhone = String(telefoon || "").trim();
  const cleanDatum = String(datum || "").trim();
  const cleanTijd = String(tijdstip || "").trim();

  if (!cleanNaam) {
    return res.status(400).json({ error: "Naam is verplicht." });
  }
  if (!cleanEmail && !cleanPhone) {
    return res.status(400).json({ error: "E-mail of telefoon is verplicht." });
  }
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: "Ongeldig e-mailadres." });
  }
  if (cleanDatum && cleanTijd && !isAvailable(cleanDatum, cleanTijd)) {
    return res.status(400).json({ error: "Dit tijdstip valt buiten de beschikbaarheid." });
  }

  let afspraak;
  try {
    afspraak = await saveAppointment({
      naam: cleanNaam,
      email: cleanEmail,
      telefoon: cleanPhone,
      datum: cleanDatum,
      tijdstip: cleanTijd,
      onderwerp: String(onderwerp || "").trim() || "Algemeen gesprek",
      bron: String(bron || "website").trim() || "website",
      bericht: String(bericht || "").trim(),
      gemeente: String(gemeente || "").trim(),
      rol: String(rol || "").trim(),
      payload: body || {},
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Opslaan mislukt." });
  }

  return res.status(201).json({ ok: true, afspraak });
};
