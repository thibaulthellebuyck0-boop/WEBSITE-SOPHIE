# Sophie — marketing site + formulieren (mini-CMS)

Statische HTML/CSS/JS. Formulierinzendingen gaan naar **Supabase** via een **Vercel** serverless route (`POST /api/submissions`).

## Supabase

1. Maak een project op [supabase.com](https://supabase.com).
2. Open **SQL Editor** en voer het script uit: [`migrations/001_submissions.sql`](migrations/001_submissions.sql).
3. Kopieer onder **Project Settings → API**:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (geheim, nooit in de frontend) → `SUPABASE_SERVICE_ROLE_KEY`

## Vercel

1. Importeer deze repo in [Vercel](https://vercel.com) (root = projectmap met `package.json` en `api/`).
2. **Environment variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy. De site en `/api/submissions` draaien op hetzelfde domein → geen CORS-problemen.

### Eigen domein (DNS)

1. In Vercel: **Project → Settings → Domains** → voeg `www.jouwdomein.be` en `jouwdomein.be` toe.
2. Vercel toont de exacte **CNAME** / **A**-records; kopieer die in het DNS-paneel van je domeinregistrar.
3. Wacht tot de status “Valid” is (vaak enkele minuten tot uren).

## Inzendingen bekijken (CMS)

Open in Supabase **Table Editor** → `public.submissions`. Sorteer op `created_at`.

## Lokaal ontwikkelen

- **Alleen HTML:** `python3 -m http.server` (zoals `serve.sh`) — `/api/submissions` bestaat dan niet; je krijgt een duidelijke fout over `data-api-base` of Vercel.
- **Tegen productie-API testen:** zet op `<html>` van `contact.html` / `mee-bouwen.html`:

  `data-api-base="https://jouw-deployment.vercel.app"`

  (zonder slash aan het eind). Zie ook `getFormApiBase()` in [`main.js`](main.js).

## “Verzenden mislukt” / geen rijen in Supabase

1. Site echt via **Vercel** openen (zelfde project als `api/`), niet alleen losse HTML-bestanden of `file://`.
2. In Vercel: **Environment variables** `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` gezet en opnieuw gedeployed.
3. SQL uit [`migrations/001_submissions.sql`](migrations/001_submissions.sql) in Supabase uitgevoerd.
4. Bij deploy: **Root directory** is de repo-root (waar `api/` en `package.json` staan); geen “output directory” die `api/` weglaat.

## Netlify (alternatief)

Zet de handler onder `netlify/functions/submissions.js` (zelfde logica als [`api/submissions.js`](api/submissions.js)), met dezelfde omgevingsvariabelen. Pas `submitToCms` aan of gebruik Netlify’s redirect zodat `/.netlify/functions/submissions` bereikbaar is als `/api/submissions`.
