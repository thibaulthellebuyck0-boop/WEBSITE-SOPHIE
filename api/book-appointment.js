const nodemailer = require("nodemailer");

const ADMIN_EMAIL = "thibault.hellebuyck0@gmail.com";

// In-memory store (lokaal/demo). In productie: gebruik Supabase.
if (!global.__sophieAppointments) global.__sophieAppointments = [];

function isAvailable(dateStr, time) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=zon,1=ma,...,6=zat
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

  const { naam, email, datum, tijdstip, onderwerp } = body || {};

  if (!naam || !email || !datum || !tijdstip) {
    return res.status(400).json({ error: "Naam, e-mail, datum en tijdstip zijn verplicht." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Ongeldig e-mailadres." });
  }
  if (!isAvailable(datum, tijdstip)) {
    return res.status(400).json({ error: "Dit tijdstip valt buiten de beschikbaarheid." });
  }

  const afspraak = {
    id: Date.now(),
    naam: String(naam).trim(),
    email: String(email).trim(),
    datum: String(datum).trim(),
    tijdstip: String(tijdstip).trim(),
    onderwerp: String(onderwerp || "").trim() || "Algemeen gesprek",
    aangemaakt: new Date().toISOString(),
  };

  global.__sophieAppointments.push(afspraak);

  // E-mail versturen indien SMTP geconfigureerd
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });
      const datumFormatted = new Date(datum).toLocaleDateString("nl-BE", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      await transporter.sendMail({
        from: `"Sophie Technologies" <${gmailUser}>`,
        to: ADMIN_EMAIL,
        subject: `📅 Nieuwe afspraak: ${afspraak.naam} — ${datumFormatted} ${tijdstip}`,
        html: `
          <h2>Nieuwe afspraak via sophie.be</h2>
          <table>
            <tr><td><b>Naam:</b></td><td>${afspraak.naam}</td></tr>
            <tr><td><b>E-mail:</b></td><td>${afspraak.email}</td></tr>
            <tr><td><b>Datum:</b></td><td>${datumFormatted}</td></tr>
            <tr><td><b>Tijdstip:</b></td><td>${afspraak.tijdstip}</td></tr>
            <tr><td><b>Onderwerp:</b></td><td>${afspraak.onderwerp}</td></tr>
          </table>
        `,
      });
    } catch (err) {
      console.error("E-mail mislukt:", err.message);
    }
  }

  return res.status(201).json({ ok: true, afspraak });
};
