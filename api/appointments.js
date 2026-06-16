const ADMIN_TOKEN = "Sophie2026!";

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");

  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = req.query.token || req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Ongeautoriseerd." });
  }

  const appointments = global.__sophieAppointments || [];
  const sorted = [...appointments].sort((a, b) => a.datum.localeCompare(b.datum) || a.tijdstip.localeCompare(b.tijdstip));
  return res.status(200).json({ appointments: sorted });
};
