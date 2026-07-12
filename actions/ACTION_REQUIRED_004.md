# ACTION REQUIRED 004 — Google Cloud Console + Railway CORS (web app login)
> Blocks: Phase 1 verification — signing in on the web app
> Estimated time: 10 minutes
> Status: ⬜ PENDING

---

## WHY THIS IS NEEDED

The web app (`feature/web-app` branch, `expo start --web`) now has a Google Identity
Services (GIS) login path for browsers — `@react-native-google-signin/google-signin`
has zero web support, so web uses Google's JS SDK instead (`src/utils/googleWebAuth.ts`).
It reuses the SAME OAuth client id already used as `webClientId` for the native app
(`966711636721-o7k3vn52bimi3j9mtdgttalckc8v13a6.apps.googleusercontent.com`) and
already allow-listed on the backend — **no backend code change needed** — but GIS
requires the calling page's origin to be explicitly registered on that client, and
the browser also needs the backend's CORS policy to actually permit the request.

Without this, the web app's "Continue with Google" button will fail with a GIS
origin-mismatch error, and even a successful token exchange would be blocked by the
browser's CORS preflight against the Railway backend.

---

## EXACT STEPS

### Step 1 — Add web origins to the existing OAuth client (5 min)
1. Go to **https://console.cloud.google.com/apis/credentials**
2. Find the OAuth 2.0 Client ID ending in `...c8v13a6.apps.googleusercontent.com`
   (type should be "Web application" — if it's a different type, tell Claude, a new
   client id will be needed instead of reusing this one)
3. Click it to edit → under **Authorized JavaScript origins**, add:
   ```
   http://localhost:8090
   ```
4. Once the web app is deployed to Vercel, come back and add that domain too
   (e.g. `https://applyai-web.vercel.app` and any custom domain)
5. Save

### Step 2 — Allow the web origin in Railway CORS (3 min)
1. Open **https://railway.app** → the backend service → **Variables** tab
2. Add or update:
   ```
   CORS_ALLOWED_ORIGINS = http://localhost:8090
   ```
   (comma-separate if other origins are already set — check current value first,
   don't overwrite an existing list)
3. Once deployed to Vercel, add that domain to the same comma-separated list
4. Railway auto-redeploys

### Step 3 — Verify (2 min)
1. Run the web app locally (`expo start --web` in `applyai-mobile`, or via the
   `applyai-web` launch config)
2. Open http://localhost:8090, click "Continue with Google"
3. Confirm the Google account picker appears and sign-in completes without a
   console CORS or origin-mismatch error

---

## WHEN DONE

Tell Claude: **"ACTION_REQUIRED_004 done, continue web app Phase 1"**

---

## WHAT GETS UNBLOCKED

- ✅ Web app sign-in (Phase 1) — actually verifiable end-to-end
- ✅ Every subsequent phase, since nothing past the login screen can be tested
  until this works
