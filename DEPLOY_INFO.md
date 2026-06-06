# ApplyAI Mobile — Deploy & Infrastructure Info
> Version: 1.0 | Last updated: Jun 6, 2026
> Keep this file updated. Use it every time you work on the mobile app.
> This is the frontend equivalent of the backend's ApplyAI_Server_Info.md.

---

## APP IDENTITY

| Item | Value |
|------|-------|
| App name | ApplyAI |
| Bundle ID (Android) | com.applyai.mobile |
| Bundle ID (iOS) | com.applyai.mobile |
| Expo slug | applyai-mobile |
| Expo owner | itzmuthuhere |
| Expo project ID | 718062db-5b8d-4a4c-830e-6d638d123b89 |
| Current version | 1.0.0 |
| Runtime version policy | appVersion |

---

## REPOSITORIES

| Repo | URL | Purpose |
|------|-----|---------|
| applyai-mobile | https://github.com/itzmuthuhere/applyai-mobile | React Native app (this repo) |
| applyai-backend | https://github.com/itzmuthuhere/applyai-backend | Spring Boot backend |

---

## NETLIFY — DOWNLOAD PAGE ✅ ACTIVE

| Item | Value |
|------|-------|
| Platform | Netlify (free tier) |
| Site name | illustrious-kleicha-2dee8f |
| Live URL | https://illustrious-kleicha-2dee8f.netlify.app |
| Source | `docs/` folder in this repo |
| Auto-deploy | Yes — every push to `main` triggers Netlify redeploy (~10 sec) |
| Publish directory | `docs` (set in Netlify UI + netlify.toml) |
| Purpose | Friends download APK from this page to test the app |

### What lives at the Netlify URL:
- Branded download page (`docs/index.html`)
- "Download APK" button → links to latest EAS-built APK
- Install instructions for Android
- Auto-updates whenever `build-apk.yml` GitHub Action runs

---

## EAS BUILD — APK GENERATION

| Item | Value |
|------|-------|
| Platform | Expo Application Services (EAS Build) |
| EAS CLI version | 20.1.0+ |
| Expo account | itzmuthuhere |
| Build profile (testing) | `preview` → outputs `.apk` file |
| Build profile (production) | `production` → outputs `.aab` for Play Store |
| Build time | ~12 minutes (runs in EAS cloud) |
| Config file | `eas.json` |

### Build profiles (eas.json):
```json
{
  "preview":    { "distribution": "internal", "android": { "buildType": "apk" } },
  "production": { "android": { "buildType": "app-bundle" } }
}
```

### How to trigger a build manually (terminal):
```powershell
cd D:\applyai-mobile
eas build --platform android --profile preview
```

### How to trigger a build automatically:
GitHub → Actions tab → "Build APK + Update Download Page" → Run workflow

---

## GITHUB ACTIONS — AUTOMATION

| Workflow | File | Trigger | What it does |
|----------|------|---------|-------------|
| OTA Update | `.github/workflows/ota-update.yml` | Push to `main` (src/ changes) | Runs `eas update` → existing users get new JS on next app open |
| Build APK | `.github/workflows/build-apk.yml` | Manual (workflow_dispatch) | Runs `eas build` → updates `docs/index.html` APK URL → Netlify redeploys |

### Required GitHub Secrets:
| Secret | Value | Status | Where to add |
|--------|-------|--------|-------------|
| `EXPO_TOKEN` | Personal access token from expo.dev | ⬜ **PENDING — see ACTION_REQUIRED_001** | https://github.com/itzmuthuhere/applyai-mobile/settings/secrets/actions |

---

## EXPO OTA UPDATES — HOW EXISTING USERS GET UPDATES

When you push JS/TS code changes:
1. GitHub Action (`ota-update.yml`) triggers automatically
2. Runs `eas update --channel preview`
3. User opens app → update detected → `UpdatePrompt.tsx` shows "Update available"
4. User taps Update → latest JS bundle loads → no reinstall needed

**What OTA can update:** All JS/TS code, styles, screen logic, API calls
**What OTA CANNOT update:** Native packages, app.json changes, new expo plugins → needs new APK build

---

## LOCAL DEVELOPMENT

### Prerequisites:
```
Node.js 20.13.1 ✅
npm 10.5.2 ✅
EAS CLI 20.1.0 ✅
Expo Go app on Android phone ✅ (for Expo Go testing)
```

### Run locally:
```powershell
cd D:\applyai-mobile
npx expo start        # Start dev server
# Scan QR code in Expo Go app on your phone
# OR press 'a' to open on Android emulator
```

### Environment variables (.env — NOT committed):
```
EXPO_PUBLIC_API_URL=https://applyai-backend-production-3b67.up.railway.app
EXPO_PUBLIC_ENV=development
```

---

## FIREBASE — GOOGLE SIGN-IN

| Item | Value |
|------|-------|
| Firebase project | (your Firebase project) |
| Android package | com.applyai.mobile |
| Web client ID | 966711636721-o7k3vn52bimi3j9mtdgttalckc8v13a6.apps.googleusercontent.com |
| Config file | `google-services.json` (root, NOT committed to git) |
| iOS URL scheme | com.googleusercontent.apps.966711636721-o7k3vn52bimi3j9mtdgttalckc8v13a6 |

---

## BACKEND CONNECTION

| Item | Value |
|------|-------|
| Production URL | https://applyai-backend-production-3b67.up.railway.app |
| Health check | https://applyai-backend-production-3b67.up.railway.app/health |
| Local backend (emulator) | http://10.0.2.2:8080 |
| Local backend (physical phone) | http://[YOUR_LAPTOP_IP]:8080 |
| Set in | `.env` → `EXPO_PUBLIC_API_URL` |

---

## RELEASE HISTORY

| Version | Build Date | APK URL | Notes |
|---------|-----------|---------|-------|
| — | — | — | First build not yet triggered — waiting for EXPO_TOKEN secret |

_Update this table every time a new APK is built._

---

## HOW TO USE THIS FILE IN CLAUDE SESSIONS

Paste this at the start of any mobile conversation:
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- GitHub: https://github.com/itzmuthuhere/applyai-mobile
- Download page: https://illustrious-kleicha-2dee8f.netlify.app
- Expo account: itzmuthuhere (project ID: 718062db-5b8d-4a4c-830e-6d638d123b89)
- Push to main → OTA update sent to existing users automatically
- Build APK via GitHub Actions → Netlify download page auto-updates
```

---

## CHANGE LOG

| Version | Date | Change | Reason |
|---------|------|--------|--------|
| 1.0 | Jun 6, 2026 | Initial deploy info documented | Netlify + EAS setup complete |
