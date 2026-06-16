const https = require("https");

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY niet ingesteld." });

  var body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  var text = String(body.text || "").trim().slice(0, 4096);
  if (!text) return res.status(400).json({ error: "Geen tekst opgegeven." });

  var bodyStr = JSON.stringify({
    model: "tts-1",
    input: text,
    voice: "shimmer",
    response_format: "mp3",
  });

  var options = {
    hostname: "api.openai.com",
    path: "/v1/audio/speech",
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr),
    },
  };

  var ttsReq = https.request(options, function (ttsRes) {
    if (ttsRes.statusCode !== 200) {
      var chunks = [];
      ttsRes.on("data", function (c) { chunks.push(c); });
      ttsRes.on("end", function () {
        try {
          var err = JSON.parse(Buffer.concat(chunks).toString());
          res.status(ttsRes.statusCode).json({ error: (err.error && err.error.message) || "TTS fout" });
        } catch (e) {
          res.status(ttsRes.statusCode).json({ error: "TTS fout " + ttsRes.statusCode });
        }
      });
      return;
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    ttsRes.pipe(res);
  });

  ttsReq.on("error", function (err) {
    res.status(500).json({ error: String(err.message || err) });
  });

  ttsReq.write(bodyStr);
  ttsReq.end();
};
