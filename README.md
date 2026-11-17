# Aghour Web (PWA) — أجهور الكبرى

The iPhone (and any browser) version of the Aghour village app: a Progressive Web App on the same
Rails API as the Android app (`/api/v1/`). iPhone users install it from Safari with
Share → "Add to Home Screen" (the app shows a guide).

Stack: React 18, Vite 5, Tailwind 3, `vite-plugin-pwa` (Workbox). Works on Node 18
(`serialize-javascript` is pinned in `overrides` because v7 needs Node 20).

## Run

```bash
cp .env.example .env         # VITE_API_URL, must end with /api/v1/
npm install
npm run dev                  # http://localhost:5173 (no service worker in dev)
npm run build && npm run preview   # production build + service worker on :4173
```

### On the Android emulator

```bash
~/Android/Sdk/emulator/emulator -avd Medium_Phone_API_37.0 &
~/Android/Sdk/platform-tools/adb reverse tcp:4173 tcp:4173   # emulator localhost → this machine
```

Open `http://localhost:4173` in the emulator's Chrome. Using `localhost` (not `10.0.2.2`) matters:
service workers and install only run in a secure context, and localhost counts as one.
A real install (WebAPK) needs a public HTTPS deploy.

### Against a local API (signed-in flows)

```bash
# backend repo: Postgres in Docker on 5434, Rails on 3000
docker compose up -d db && bin/rails db:prepare && bin/rails s -p 3000
# this repo: a build that talks to it
VITE_API_URL=http://localhost:3000/api/v1/ npx vite build --outDir /tmp/aghour-local --emptyOutDir
npx vite preview --outDir /tmp/aghour-local --port 4175
```

Register a throwaway user in the app. To test plans locally, enable the flag in the dev database only:
`bin/rails runner 'FeatureFlag.find_by!(key: "plans").update!(enabled: true)'`.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes on every push to `main`:
https://village-platform.github.io/pwa/

- Built with `BASE_PATH=/pwa/` (a project site lives under the repo name). All public files go
  through `asset()` / `import.meta.env.BASE_URL`, and the router uses it as `basename`.
- Pages has no rewrites, so the workflow copies `index.html` to `404.html`: a deep link such as
  `/pwa/firms/12` loads the app (with HTTP status 404, which browsers and iOS ignore).
- Pages sends `Cache-Control: max-age=600` for every file and it cannot be changed. The service worker
  still updates: browsers check `sw.js` past the HTTP cache, and new builds take over on next launch.
- Custom domain later (e.g. `app.dorfsys.com`): add it under Settings → Pages, a CNAME record at
  Cloudflare, and the repository variable `BASE_PATH=/`. Then set the backend's `CORS_ORIGINS`.

## v1 scope (same behaviour as the Android app for guests and normal users)

- **Everyone:** Welcome (first launch), Home (greeting, bell, categories, cover banner, featured firms,
  latest news, pull to refresh), Explore, Firm, News, Article, Notifications, Settings, install guide,
  offline reading.
- **Guests:** Login / Register (return to the screen that asked), guest inbox via `X-Installation-Id`
  (empty until web push registers the device), Plans when the `plans` flag is on.
- **Signed in:** profile with subscription card, My firms, add / edit / delete a firm (location by GPS,
  Google Maps link or numbers), owner controls on the firm page, add / edit / delete an article,
  Plans → Pay → Payments (behind the `plans` flag), change password, delete account, logout.

Not in v1: super-admin category and plan editors (use the server's `/admin` dashboard), web push.

## Design notes

- **No API changes.** Same endpoints, params and bodies as `AghourApi.kt`; the shipped Android app is untouched.
- **Auth:** bearer JWT in `localStorage` (guest token when signed out, like Android's `AuthInterceptor`;
  a 401 on the user token signs out). Trade-off: readable by any script on the origin (XSS), unlike an
  httpOnly cookie. Cookie auth (same-site `app.`/`api.` subdomains, or a Vercel `/api` rewrite) needs
  backend work and is the planned follow-up.
- **Feature flags:** `GET app_config` on start and on return to the foreground, at most every 5 minutes,
  last answer kept; fails closed like Android's `FeatureFlags.kt`.
- **CORS:** production answers `Access-Control-Allow-Origin: *` (`CORS_ORIGINS` unset). Set it to the
  PWA's origin once deployed.
- **Offline:** the app shell is precached; `categories`, `firms`, `articles` GETs are NetworkFirst
  (3 s timeout, 7-day cache); category icons are CacheFirst (the server versions them with `?v=`).
- **Tokens:** colours in `src/index.css` mirror `ui/theme/Theme.kt`; Cairo font and logos are copied
  from the Android app.
- **Deep links:** `/firms/:id`, `/news/:id`, `/explore?category=:id` match the server's
  `Notifications::Destination` screens.
- **Pitfalls found in testing:** never return a value from a `useEffect` arrow (newer Chrome's
  `scrollTo` returns a Promise, which React treats as a cleanup and crashes on); navigate with
  `flushSync` before clearing the session, because `useSyncExternalStore` re-renders synchronously.

## Next: web push on iOS (16.4+, installed app only)

The backend sends with FCM HTTP v1 (topics + conditions). The Firebase JS SDK supports Safari web
push, so the plan is: Firebase web app config + VAPID key, `firebase-messaging-sw.js`,
`PUT devices/:installation_id` with `platform: "web"` (backend: add `"web"` to `Device::PLATFORMS`,
an additive change), and a `webpush.fcm_options.link` in `Fcm::Message`. To verify first: that
topic subscription (legacy Instance ID API, removed 2027-09-29) accepts web tokens.
