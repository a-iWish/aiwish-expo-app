# Demo Day Deployment Guide

Goal: visitors at the booth use the app two ways —
1. **Demo iPhones on the table** — real native app, built via Xcode (free Apple ID, rebuilt demo week since free builds expire after 7 days).
2. **Visitors' own phones** — scan a printed QR code → web version of the app opens in their browser (hosted on Vercel, permanent URL).

Both talk to the backend through an **always-on ngrok tunnel running on the college machine itself** — no laptop in the serving path:

```
College machine (always on)
  ├─ aiwish_api container      backend :8000
  └─ aiwish_tunnel container   ngrok (outbound TLS :443) → permanent static domain
                                  │
                                  ├─ on start: re-syncs Vercel env
                                  │  EXPO_PUBLIC_API_URL + triggers web redeploy
                                  ↓
                    https://<your-domain>.ngrok-free.app   ← NEVER changes
                                  ↑ internet
                    Any phone, anywhere (cellular or Wi-Fi)
```

Why ngrok (not cloudflared): the college firewall blocks outbound port 7844
(TCP **and** UDP), which is the only port cloudflared can use. ngrok connects
out over standard TLS on port 443, which is open.

Key properties:
- **The public API URL is permanent** (ngrok free static domain). Tunnel restarts, machine reboots, API deploys — the URL never changes, so nothing ever goes stale.
- The tunnel survives API deploys — `deploy_prod.sh` does not touch it.
- On every tunnel start it re-syncs `EXPO_PUBLIC_API_URL` on Vercel and triggers a web redeploy — a self-healing safety net, normally a no-op.
- **Vercel is the single source of truth for the API URL.** The web build gets it automatically; native iPhone builds pull it with `vercel env pull` before building.
- The app sends an `ngrok-skip-browser-warning` header on every API request (see `src/services/httpClient.ts`) — required on ngrok's free tier, harmless otherwise.
- The backend allows all CORS origins and headers — no backend changes needed.

---

## Part 0 — One-time installs on the Mac (do these THIS WEEK, not demo morning)

### 0.1 Install Xcode (REQUIRED for iPhone builds — huge download, start now)

1. Open the **App Store** on the Mac → search **Xcode** → Install (~12 GB, can take hours).
2. After install, open Xcode once and accept the license.
3. Point the command line tools at it:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -runFirstLaunch
   ```
4. Verify: `xcodebuild -version` should print an Xcode version.

### 0.2 Add your Apple ID to Xcode (free account is fine)

1. Xcode → **Settings → Accounts** → `+` → **Apple ID** → sign in.
2. No paid developer program needed. (Free = builds expire after 7 days, which is why we rebuild demo week.)

### 0.3 Install the Vercel CLI and link the project

(Do this after Part 1 creates the Vercel project.)

```bash
npm i -g vercel
cd ~/Documents/aiWish/aiwish-expo-app
vercel login          # opens browser
vercel link           # pick your Hobby scope → the aiwish-expo-app project
```

This lets the Mac pull the current API URL from Vercel before native builds
(`vercel env pull`). Make sure `.env.local` is gitignored in this repo.

---

## Part 1 — Accounts setup (one-time)

### 1.1 Vercel project

1. vercel.com → sign in → in your **Hobby** scope (NOT a work team): **Add New… → Project** → import **a-iWish/aiwish-expo-app** (the repo must be public — private org repos need Vercel Pro).
2. Configure:
   - **Framework Preset**: `Other`
   - **Build Command**: `npx expo export --platform web`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - Env var `EXPO_PUBLIC_API_URL`: any placeholder (the tunnel syncs the real one). Leave it **non-sensitive** so `vercel env pull` can read it back.
3. **Deploy**. Your permanent web URL appears, e.g. `https://aiwish-expo-app.vercel.app`.

Every `git push` to `main` auto-deploys. The repo must contain `vercel.json` (SPA rewrite) so page refreshes don't 404.

### 1.2 Vercel values for the tunnel

1. **Token** — avatar → Account Settings → **Tokens** → Create. Scope it to the `aiwish-expo-app` **project**, expiry ≥ project end. Copy immediately (shown once).
2. **Project ID** — project → Settings → **General** → the `prj_…` value.
3. **Deploy hook** — project → Settings → **Git** → Deploy Hooks → Create (`tunnel-url`, branch `main`) → copy the URL.

### 1.3 ngrok account + permanent domain

1. Sign up free: <https://dashboard.ngrok.com/signup>.
2. Claim your **free static domain** (Dashboard → Domains) — e.g. `aiwish.ngrok-free.app`. This is the permanent public API URL.
3. Copy your **Authtoken** (Dashboard → Getting Started → Your Authtoken).

### 1.4 Print the QR code

The QR encodes the permanent **Vercel** URL — print once, works forever:
```bash
npx qrcode-terminal "https://aiwish-expo-app.vercel.app"
```

### 1.5 Test the web version NOW

Open the Vercel URL on a phone browser. Check every screen renders acceptably on web and fix glitches this week, not on demo day.

---

## Part 2 — College machine: start the always-on tunnel (one-time, ~5 minutes)

The tunnel ships as a Docker service in the **aiwish-api** repo (`tunnel/` + `Dockerfile.tunnel`).

```bash
ssh cs602@10.10.248.101          # via VPN
cd ~/aiwish-api
git pull origin main
cp .env.tunnel.example .env.tunnel
nano .env.tunnel                 # fill: NGROK_AUTHTOKEN, NGROK_DOMAIN, VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_DEPLOY_HOOK
sudo docker compose up -d --build
sudo docker logs -f aiwish_tunnel
```

In the logs, expect:
```
  PUBLIC API URL: https://<your-domain>.ngrok-free.app
  Vercel env synced + redeploy triggered.
...
t=... lvl=info msg="started tunnel" ... url=https://<your-domain>.ngrok-free.app
```

Sanity check from your phone **on cellular** (Wi-Fi off):
`https://<your-domain>.ngrok-free.app/v1/products?limit=3` → JSON (you may see an ngrok warning page in the browser — that's expected; the app itself skips it via a header).

From now on the tunnel auto-starts on boot, restarts if it dies, and the URL never changes.

---

## Part 3 — iPhone demo phones prep (one-time per phone)

1. On each iPhone: **Settings → Privacy & Security → Developer Mode → On** (phone restarts; the toggle only appears after the first build attempt — that's normal, do the build and it will prompt).
2. Connect the iPhone to the Mac with a cable → tap **Trust This Computer**.
3. Build — pull the API URL first:
   ```bash
   cd ~/Documents/aiWish/aiwish-expo-app
   vercel env pull .env.local --environment production
   npx expo run:ios --device --configuration Release
   ```
   - `.env.local` overrides `.env`, so the build uses the same URL as the web app.
   - First build is slow (10–20 min); later ones are much faster.
   - After install, if iOS blocks the app: **Settings → General → VPN & Device Management** → trust your developer certificate.
4. Repeat the run command for each phone.

`--configuration Release` matters: no dev menu, no yellow warnings, feels like a real app.

> Free Apple ID builds **stop launching after 7 days**. Rebuild all demo phones within the last 7 days before the presentation. Since the API URL is permanent, rebuilds are only ever about the 7-day expiry — never about a changed URL.

---

## Part 4 — DEMO DAY MORNING RUNBOOK (~5 min)

**□ 1. Verify from your phone on cellular:**
- `https://<your-domain>.ngrok-free.app/v1/products?limit=3` → JSON
- the Vercel URL → products load in the web app
- the app on each demo iPhone → products load

**□ 2. Put the printed QR on the table.** Done.

If anything fails, see troubleshooting — but there are no morning setup steps: everything is already running.

---

## Troubleshooting during the demo

| Symptom | Fix |
|---|---|
| Web app loads but no data | SSH in, `sudo docker ps` — are `aiwish_api` and `aiwish_tunnel` up? `sudo docker logs --tail=50 aiwish_tunnel`. Restart if needed: `sudo docker restart aiwish_tunnel` (URL stays the same). |
| ngrok auth/domain error in tunnel logs | Check `NGROK_AUTHTOKEN` / `NGROK_DOMAIN` in `.env.tunnel`, then `sudo docker compose up -d --force-recreate tunnel`. |
| College machine rebooted | Wait for boot — Docker `restart: always` brings API + tunnel back automatically with the same URL. |
| iPhone app won't open ("Untrusted Developer") | Settings → General → VPN & Device Management → trust cert. |
| iPhone app expired (7 days) | Rebuild: `npx expo run:ios --device --configuration Release`. |
| ngrok itself is down (rare) | Fallback chain from the Mac: `ssh -L 0.0.0.0:8000:localhost:8000 cs602@10.10.248.101` + `cloudflared tunnel --url http://localhost:8000`, paste the temp URL into Vercel env + redeploy. (Won't help iPhones — point visitors at the QR.) |
