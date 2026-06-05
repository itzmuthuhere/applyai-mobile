# ApplyAI Mobile — Integration & Config
> Version: 1.0 | Last updated: Jun 6, 2026
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

## BUILD FOR PRODUCTION (EAS Build)

For generating an APK to share or upload to Play Store:

```
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview   ← generates APK for testing
eas build -p android --profile production ← generates AAB for Play Store
```

**Note:** Do this only after all features are complete (Day 12).

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
