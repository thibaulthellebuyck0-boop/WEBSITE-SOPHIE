const https = require("https");

const VOICE_SYSTEM_PROMPT =
  "Je bent Sophie, de digitale assistent van Sophie Technologies. " +
  "ANTWOORD ALTIJD IN MAXIMAAL 1-2 KORTE ZINNEN. Nooit langer. Geen opsommingen, geen markdown, geen bullets.\n\n" +
  "Sophie Technologies bouwt AI-agents voor Belgische gemeenten en steden. " +
  "Founders: Thibault Hellebuyck (CEO), Nathan Debauschere (Head of Sales) en Simon (mede-founder).\n" +
  "Modules: SmartRouting, Afspraken boeken, FixIt defecten melden, Community, Direct contact. Ook via WhatsApp.\n" +
  "Pricing: €699/maand klein, €899/maand +10K inwoners, op maat +20K. Geen implementatiekosten. Gratis pilootmaand voor 25 gemeenten.\n\n" +
  "Je bent de DEMOVERSIE op de Sophie Technologies website — NIET gekoppeld aan een gemeente. " +
  "Als iemand een gemeentevraag stelt: erken het kort, leg uit dat Sophie dat WEL kan bij hun gemeente, en verwijs terug naar Sophie Technologies. " +
  "Spreek vlot, enthousiast en hartelijk. Geen titels, geen links, geen lange lijstjes — gewoon een kort, vriendelijk antwoord.";

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).end();

  var apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({ error: "OPENAI_API_KEY niet ingesteld op de server." });
  }

  var body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  var incoming = Array.isArray(body.messages) ? body.messages : [];
  var nonSystem = incoming.filter(function(m) { return m.role !== "system"; }).slice(-6);
  var messages = [{ role: "system", content: VOICE_SYSTEM_PROMPT }].concat(nonSystem);

  var bodyStr = JSON.stringify({
    model: "gpt-4o-mini",
    messages: messages,
    max_tokens: 120,
    temperature: 0.75,
    stream: true,
  });

  /* Stream SSE naar client */
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");

  var options = {
    hostname: "api.openai.com",
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr),
    },
  };

  var openaiReq = https.request(options, function(openaiRes) {
    if (openaiRes.statusCode !== 200) {
      var chunks = [];
      openaiRes.on("data", function(c) { chunks.push(c); });
      openaiRes.on("end", function() {
        try {
          var err = JSON.parse(Buffer.concat(chunks).toString());
          res.write("data: " + JSON.stringify({ error: (err.error && err.error.message) || "OpenAI fout" }) + "\n\n");
        } catch(e) {
          res.write("data: " + JSON.stringify({ error: "OpenAI fout " + openaiRes.statusCode }) + "\n\n");
        }
        res.end();
      });
      return;
    }

    /* Pipe OpenAI SSE direct door naar client */
    openaiRes.on("data", function(chunk) {
      res.write(chunk);
    });
    openaiRes.on("end", function() {
      res.end();
    });
  });

  openaiReq.on("error", function(err) {
    try {
      res.write("data: " + JSON.stringify({ error: String(err.message || err) }) + "\n\n");
      res.end();
    } catch(e) {}
  });

  req.on("close", function() {
    openaiReq.destroy();
  });

  openaiReq.write(bodyStr);
  openaiReq.end();
};
