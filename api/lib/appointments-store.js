const KV_KEY = "sophie:appointments";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = require("@upstash/redis");
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

function getMemoryStore() {
  if (!global.__sophieAppointments) global.__sophieAppointments = [];
  return global.__sophieAppointments;
}

function normalizeRecord(input) {
  const now = new Date().toISOString();
  return {
    id: input.id || `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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

async function saveAppointment(input) {
  const record = normalizeRecord(input);
  const redis = getRedis();

  if (redis) {
    const existing = await redis.get(KV_KEY);
    const list = Array.isArray(existing) ? existing : [];
    list.unshift(record);
    await redis.set(KV_KEY, list);
    return record;
  }

  getMemoryStore().unshift(record);
  return record;
}

async function listAppointments() {
  const redis = getRedis();

  if (redis) {
    const list = await redis.get(KV_KEY);
    return Array.isArray(list) ? sortAppointments(list) : [];
  }

  return sortAppointments(getMemoryStore());
}

module.exports = {
  saveAppointment,
  listAppointments,
  normalizeRecord,
};
