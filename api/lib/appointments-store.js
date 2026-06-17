const GITHUB_API = "https://api.github.com";
const GITHUB_PATH = "appointments.json";

function getGithubConfig() {
  const token = process.env.GITHUB_DATA_TOKEN;
  const repo = process.env.GITHUB_DATA_REPO;
  if (!token || !repo) return null;
  return { token, repo };
}

function getMemoryStore() {
  if (!global.__sophieAppointments) global.__sophieAppointments = [];
  return global.__sophieAppointments;
}

function normalizeRecord(input) {
  const now = new Date().toISOString();
  return {
    id: input.id || `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    naam: String(input.naam || "").trim(),
    email: input.email ? String(input.email).trim() : "",
    telefoon: input.telefoon ? String(input.telefoon).trim() : "",
    datum: input.datum ? String(input.datum).trim() : "",
    tijdstip: input.tijdstip ? String(input.tijdstip).trim() : "",
    onderwerp: String(input.onderwerp || "").trim() || "Algemeen",
    bron: String(input.bron || "website").trim() || "website",
    bericht: input.bericht ? String(input.bericht).trim() : "",
    gemeente: input.gemeente ? String(input.gemeente).trim() : "",
    rol: input.rol ? String(input.rol).trim() : "",
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    aangemaakt: input.aangemaakt || input.created_at || now,
    created_at: input.created_at || input.aangemaakt || now,
  };
}

function sortAppointments(list) {
  return [...list].sort((a, b) => {
    const aTime = a.created_at || a.aangemaakt || "";
    const bTime = b.created_at || b.aangemaakt || "";
    return bTime.localeCompare(aTime);
  });
}

async function ghRead(config) {
  const res = await fetch(
    `${GITHUB_API}/repos/${config.repo}/contents/${GITHUB_PATH}`,
    { headers: { Authorization: `token ${config.token}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (res.status === 404) return { list: [], sha: null };
  if (!res.ok) throw new Error(`GitHub read mislukt: ${res.status}`);
  const json = await res.json();
  const raw = Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { list: JSON.parse(raw) || [], sha: json.sha };
}

async function ghWrite(config, list, sha) {
  const body = {
    message: `afspraak ${new Date().toISOString().slice(0, 10)}`,
    content: Buffer.from(JSON.stringify(list)).toString("base64"),
  };
  if (sha) body.sha = sha;
  const res = await fetch(
    `${GITHUB_API}/repos/${config.repo}/contents/${GITHUB_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`GitHub write mislukt: ${res.status}`);
}

async function saveAppointment(input) {
  const record = normalizeRecord(input);
  const config = getGithubConfig();

  if (config) {
    const { list, sha } = await ghRead(config);
    list.unshift(record);
    await ghWrite(config, list, sha);
    return record;
  }

  getMemoryStore().unshift(record);
  return record;
}

async function listAppointments() {
  const config = getGithubConfig();

  if (config) {
    const { list } = await ghRead(config);
    return sortAppointments(list);
  }

  return sortAppointments(getMemoryStore());
}

module.exports = { saveAppointment, listAppointments, normalizeRecord };
