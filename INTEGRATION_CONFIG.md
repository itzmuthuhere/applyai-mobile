# ApplyAI Mobile — Integration & Config
> Version: 1.1 | Last updated: Jun 6, 2026
> Backend URL, env vars, Firebase setup, Android config, build config.

---

## BACKEND CONNECTION

| Item | Value |
|------|-------|
| Production URL | `https://applyai-backend-production-3b67.up.railway.app` |
| Local backend | `http://10.0.2.2:8080` (Android emulator → localhost) |
| Health check | `GET /health` → should return `{ "status": "UP" }` |
| Auth endpoint | `POST /api/auth/google` |

**How URL is set:**
- `.env` file → `EXPO_PUBLIC_API_URL=https://...`
- `src/api/apiClient.ts` → `baseURL: process.env.EXPO_PUBLIC_API_URL`

---

## ENVIRONMENT VARIABLES

### .env (local — NOT committed to git)

```
EXPO_PUBLIC_API_URL=https://applyai-backend-production-3b67.up.railway.app
EXPO_PUBLIC_ENV=development
```

### .env.example (committed to git — template only)

```
EXPO_PUBLIC_API_URL=your_backend_url_here
EXPO_PUBLIC_ENV=development
```

**Rule:** `EXPO_PUBLIC_*` prefix makes vars accessible in React Native code via `process.env`.

---

## FIREBASE SETUP (for Google Sign-In)

### What you need:
1. Firebase Console → your project → Project Settings → Add App → Android
2. Android package name: `com.applyai.mobile`
3. Download `google-services.json` → place in `D:\applyai-mobile\` root
4. **Do NOT commit** `google-services.json` (add to .gitignore)

### What firebase-admin does (backend):
- Verifies the ID token that the mobile app sends
- Already configured in backend (ACTION_REQUIRED_001 done)

### Firebase packages needed in mobile:
- `@react-native-google-signin/google-signin` — triggers Google account picker
- `expo-dev-client` — needed if using non-Expo Firebase packages

---

## ANDROID SETUP

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20.13.1 ✅ | Already installed |
| npm | 10.5.2 ✅ | Already installed |
| Git | 2.45.1 ✅ | Already installed |
| Expo CLI | latest | `npm install -g expo-cli` |
| Android Studio | latest | https://developer.android.com/studio |

### Android Studio Setup Steps

```
1. Download and install Android Studio
2. Open Android Studio → More Actions → SDK Manager
3. SDK Platforms tab → Install: Android 15 (API 35)
4. SDK Tools tab → Install:
   - Android SDK Build-Tools (latest)
   - Android Emulator
   - Android SDK Platform-Tools

5. Set environment variables:
   ANDROID_HOME = C:\Users\muthu raja\AppData\Local\Android\Sdk
   Add to PATH:
     %ANDROID_HOME%\platform-tools
     %ANDROID_HOME%\emulator

6. Create Virtual Device:
   More Actions → Virtual Device Manager → Create Device
   → Pixel 8 → API 35 → Finish
```

### Verify Android is working

```powershell
adb --version           # Should print ADB version
adb devices             # Shows running emulators
```

---

## RUNNING THE APP

### Option A — Physical Android Phone (recommended for development)

```
1. Install Expo Go from Google Play Store on your Android phone
2. Make sure phone and laptop are on the SAME WiFi network
3. cd D:\applyai-mobile
4. npx expo start
5. Scan QR code shown in terminal with Expo Go app
```

### Option B — Android Emulator

```
1. Open Android Studio → Virtual Device Manager → Start Pixel 8 emulator
2. cd D:\applyai-mobile
3. npx expo start
4. Press 'a' in terminal → app loads on emulator
```

### Option C — Local backend testing

```
# When testing against local backend instead of Railway:
# Edit .env:
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080    ← Android emulator → localhost
# or
EXPO_PUBLIC_API_URL=http://[YOUR_LAPTOP_IP]:8080   ← physical phone
```

---

## EAS BUILD — APK GENERATION

| Profile | Output | Use |
|---------|--------|-----|
| `preview` | `.apk` | Internal testing — share with friends |
| `production` | `.aab` | Google Play Store submission |

**Build time:** ~12 minutes (runs in EAS cloud, not your machine).

```powershell
# Trigger from terminal
eas build --platform android --profile preview

# Trigger from GitHub Actions (preferred)
# → GitHub → Actions → "Build APK + Update Download Page" → Run workflow
```

Builds appear at: https://expo.dev/accounts/itzmuthuhere/projects/applyai-mobile/builds

---

## NETLIFY — APK DOWNLOAD PAGE

| Item | Value |
|------|-------|
| URL | https://illustrious-kleicha-2dee8f.netlify.app |
| Source | `docs/index.html` in this repo |
| Publish dir | `docs` (set in Netlify UI + `netlify.toml`) |
| Auto-deploy | Yes — every push to `main` → Netlify redeploys in ~10 sec |
| Purpose | Friends download APK from here to test the app |

Friends open this URL → tap "Download APK" → install on Android → done.

---

## GITHUB ACTIONS — CI/CD

| Workflow | File | Trigger | What it does |
|----------|------|---------|-------------|
| OTA Update | `.github/workflows/ota-update.yml` | Push to `main` (src/ changes) | `eas update` → existing users get JS update on next app open |
| Build APK | `.github/workflows/build-apk.yml` | Manual (workflow_dispatch) | `eas build` → extracts APK URL → commits to `docs/index.html` → Netlify redeploys |

### Required GitHub Secret:

| Secret | Purpose | Status |
|--------|---------|--------|
| `EXPO_TOKEN` | EAS authentication in CI | ⬜ PENDING — see `actions/ACTION_REQUIRED_001.md` |

Add at: https://github.com/itzmuthuhere/applyai-mobile/settings/secrets/actions

### OTA Update Rules:
- **What OTA CAN update:** All JS/TS code, styles, API calls, Redux logic
- **What OTA CANNOT update:** New native packages, app.json changes, new Expo plugins
- If a native change is needed → must trigger a full APK build via `build-apk.yml`

---

## .gitignore ADDITIONS

These must be in `.gitignore`:
```
.env
google-services.json
GoogleService-Info.plist
node_modules/
.expo/
dist/
```

---

## CHANGE LOG

| Version | Date | Change | Reason |
|---------|------|--------|--------|
| 1.0 | Jun 6, 2026 | Initial config documented | Project start |
| 1.1 | Jun 6, 2026 | Added EAS Build, Netlify, GitHub Actions sections | Distribution setup complete |
