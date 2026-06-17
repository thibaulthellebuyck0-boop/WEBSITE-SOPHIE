/** URL slug for a Belgian municipality name (shared by generators). */
function slugifyGemeente(naam) {
  return naam
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

module.exports = { slugifyGemeente };
