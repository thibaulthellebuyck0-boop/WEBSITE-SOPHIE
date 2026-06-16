const https = require("https");

const VOICE_PROMPT =
  "Je bent Sophie, de vriendelijke stem van Sophie Technologies. Dit is een live gesproken conversatie — houd antwoorden kort: maximaal 2 zinnen.\n\n" +
  "Sophie Technologies bouwt AI-agents voor Belgische gemeenten en steden.\n" +
  "Founders: Thibault Hellebuyck (CEO), Nathan Debauschere (Head of Sales) en Simon (mede-founder).\n\n" +
  "Modules: SmartRouting (basis), afspraken boeken, FixIt defecten melden, community polls, direct contact via e-mail. Ook via WhatsApp.\n\n" +
  "Pricing: €699/maand voor kleine gemeenten, €899/maand voor +10K inwoners, op maat voor +20K. Geen implementatiekosten. Eerste jaar op voorhand betalen, daarna per kwartaal opzegbaar. Gratis pilootmaand voor 25 innovatieve gemeenten.\n\n" +
  "Je bent de DEMOVERSIE voor de Sophie Technologies website — niet gekoppeld aan een gemeente. Als iemand een gemeentevraag stelt, leg je kort uit dat Sophie dat WEL kan als ze bij hun gemeente wordt ingezet, maar dat je nu hier bent om Sophie Technologies zelf voor te stellen.\n\n" +
  "Spreek vlot, enthousiast en in maximaal 2 korte zinnen. Geen opsommingen.";

function httpsPost(url, headers, bodyObj) {
  return new Promise(function (resolve, reject) {
    var parsed;
    try { parsed = new URL(url); } catch (e) { return reject(e); }
    var bodyStr = JSON.stringify(bodyObj);
    var options = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ""),
      method: "POST",
      headers: Object.assign({}, headers, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(bodyStr),
      }),
    };
    var req = https.request(options, function (res) {
      var chunks = [];
      res.on("data", function (c) { chunks.push(c); });
      res.on("end", function () {
        resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString("utf8") });
      });
    });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY niet ingesteld." });

  try {
    var result = await httpsPost(
      "https://api.openai.com/v1/realtime/sessions",
      { Authorization: "Bearer " + apiKey },
      {
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "shimmer",
        instructions: VOICE_PROMPT,
        turn_detection: { type: "server_vad", silence_duration_ms: 600 },
        input_audio_transcription: { model: "whisper-1" },
      }
    );

    var data;
    try { data = JSON.parse(result.text); } catch (e) {
      return res.status(500).json({ error: "Ongeldige respons van OpenAI: " + result.text.slice(0, 200) });
    }

    if (result.status !== 200) {
      return res.status(result.status).json({
        error: (data && data.error && data.error.message) || ("OpenAI fout " + result.status),
      });
    }

    if (!data.client_secret || !data.client_secret.value) {
      return res.status(500).json({ error: "Geen client_secret in respons.", raw: JSON.stringify(data).slice(0, 300) });
    }

    return res.status(200).json({ client_secret: data.client_secret.value });
  } catch (err) {
    return res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
};
