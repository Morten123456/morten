# Mini Slot Lead Funnel

Et gamificeret mini-slot som først engagerer brugeren og derefter indsamler e-mail som lead. 100% uden pengeværdi og designet som marketing-/lead-generator. Efter registrering sendes data til HubSpot CRM (via Private App Token).

## Stack
- Frontend: HTML, CSS, Vanilla JS (Canvas)
- Backend: Python 3 / Flask REST API
- Database: SQLite (SQLAlchemy ORM)
- Integration: HubSpot CRM v3 (Private App Token)
- Hosting: Replit (statisk + webserver)

## Kom hurtigt i gang (lokalt)
1. Krav: Python 3.11+ og pip
2. Installer afhængigheder:
   ```bash
   python3 -m pip install -r requirements.txt
   ```
3. Start app:
   ```bash
   python3 main.py
   ```
4. Åbn `http://localhost:8000` (forside) og `http://localhost:8000/admin` (admin UI)

## Environment variabler
Sæt disse som miljøvariabler (Replit Secrets i prod):

- `HUBSPOT_PRIVATE_APP_TOKEN`: HubSpot Private App Token. Tom i dev (mockes).
- `APP_ENV`: `dev` eller `prod`. I `dev` mockes HubSpot-kald.
- `DAILY_SPIN_LIMIT`: Antal spins pr. dag efter e-mail (default 3).
- `FREE_ANON_SPINS_PER_DAY`: Gratis anonyme spins pr. dag pr. IP (default 1).
- `ORIGIN_ALLOWED`: Tilladt CORS origin, fx `*` eller `https://dit-domæne`.
- `ADMIN_TOKEN`: Token til admin-endpoints (CSV og liste). Default `changeme-admin-token`.
- `IP_HASH_SALT`: Salt til IP-hash (skift i prod!).
- `FEATURE_CREATE_DEAL`: `true/false`. Opret HubSpot deal ved "grand"-tier.
- `DEAL_PIPELINE_ID` / `DEAL_STAGE_ID`: Påkrævet hvis `FEATURE_CREATE_DEAL=true`.

## Endpoints
- `GET /healthz` – Health-check.
- `POST /api/slot/spin_anon` – Opret anonymt spin (ingen email). Returnerer `reels`, `is_win`, `tier`, `anon_uuid`.
- `POST /api/leads/register_from_spin` – Link e-mail til anonymt spin og upsert i HubSpot. Body:
  ```json
  { "anon_uuid": "...", "email": "user@example.com", "name": "", "consent": true }
  ```
  Returnerer bl.a. `spins_left` og evt. `reward_code` ved vinder-tier.
- `POST /api/slot/spin` – Spin for registreret lead. Body: `{ "email": "user@example.com" }`. Respekterer daglig limit.
- `GET /api/admin/leads` – Liste leads. Kræver `Authorization: Bearer ADMIN_TOKEN`.
- `GET /api/admin/export.csv` – Eksporter CSV. Kræver `Authorization: Bearer ADMIN_TOKEN`.

## Rate-limit & Anti-Misbrug
- IP-hash = `SHA256(remote_addr + user_agent + salt)`.
- 1 gratis anonymt spin pr. dag pr. IP (konfigurerbart).
- Efter e-mail: `DAILY_SPIN_LIMIT` pr. dag pr. email.
- Ved overskridelse: HTTP 429 og JSON `{ "error": "limit_reached", "next_reset_ts": <epoch> }`.

## HubSpot-integration
- Auth: `Authorization: Bearer <HUBSPOT_PRIVATE_APP_TOKEN>`.
- Dev (`APP_ENV=dev`): Kald mockes og returnerer mock-id'er.
- Prod: 
  - Upsert Contact (search by email, ellers create). Properties: `email`, `firstname`, `lastname`, `slot_signup`, `marketing_consent`.
  - Create Note associeret til contact: fx `Slot win unlocked (tier: grand)`.
  - (Valgfrit) Create Deal ved grand-tier hvis `FEATURE_CREATE_DEAL=true`.

## Admin-panel
- UI på `/admin` (statisk side) med input til `ADMIN_TOKEN`.
- Hent leads og eksporter CSV.

## Data-modeller
- `Lead`: `email`, `name`, `consent`, `hubspot_contact_id`, `created_at`, `deleted_at`, `last_seen_at`.
- `Spin`: `anon_uuid`, `lead_id`, `ip_hash`, `is_win`, `tier`, `reels_json`, `reward_code_id`, `seed_used`, `created_at`.
- `RewardCode`: `code`, `type`, `is_claimed`, `claimed_by`, `claimed_at`, `created_at`.

## Gameplay & Fairness
- 3×3 grid; midterlinje afgør resultatet.
- Symboler og vægte: cherry 35%, lemon 30%, bar 20%, seven 10%, diamond 5%.
- Gevinster: diamond×3=grand, seven×3=large, bar×3=medium, lemon×3=small, cherry×3=micro.
- Random seed logges i `Spin.seed_used` for revision.

## Deployment i Replit
1. Opret ny Replit (Python + Flask).
2. Upload/clone repo.
3. Tilføj secrets under Tools → Secrets (env vars ovenfor).
4. Kør `pip install -r requirements.txt` i shell.
5. Sæt run-kommando til `python3 main.py` og eksponer port 8000.
6. Test endpoints via browser, curl eller Postman.

## Privacy & GDPR
- E-mail gemmes kun ved samtykke (`consent=true`).
- Ingen pengeværdi. Klart privacy-tekst i UI.

## Test (eksempler)
```bash
curl -s http://localhost:8000/healthz
curl -s -X POST http://localhost:8000/api/slot/spin_anon | jq
curl -s -X POST http://localhost:8000/api/leads/register_from_spin \
  -H 'Content-Type: application/json' \
  -d '{"anon_uuid":"...","email":"test@example.com","consent":true}' | jq
curl -s -X POST http://localhost:8000/api/slot/spin \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com"}' | jq
curl -s -H 'Authorization: Bearer changeme-admin-token' http://localhost:8000/api/admin/leads | jq
```

## White-label
- Udskift farver i `static/styles.css` og logo/tekster i `static/index.html`.
- CORS-origin pr. partner via `ORIGIN_ALLOWED`.
