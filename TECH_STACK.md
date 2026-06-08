# ApplyAI Mobile — Tech Stack
> Version: 1.2 | Last updated: Jun 8, 2026
> Every package: actual installed version, status, purpose, why chosen.
> Source of truth: package.json. This doc must always match.

---

## STATUS LEGEND

| Symbol | Meaning |
|--------|---------|
| ✅ Active | Installed and in use |
| ⬜ Planned | Will be added on specific day |
| ⏸ On Hold | Decided to build later |
| ❌ Rejected | Evaluated and decided against |

---

## CORE FRAMEWORK

| Package | Installed Version | Status | Day Added | Purpose |
|---------|-----------------|--------|-----------|---------|
| expo | ~56.0.9 | ✅ Active | Day 1 | Managed workflow, OTA updates, build tooling |
| react-native | 0.85.3 | ✅ Active | Day 1 | Core mobile framework (via Expo SDK 56) |
| react | 19.2.3 | ✅ Active | Day 1 | UI library |
| typescript | ~6.0.3 | ✅ Active | Day 1 | Type safety across all files |
| expo-status-bar | ~56.0.4 | ✅ Active | Day 1 | Status bar styling |
| expo-dev-client | ~56.0.19 | ✅ Active | Day 1 | Required for @react-native-google-signin |
| babel-preset-expo | ^56.0.14 | ✅ Active | Day 1 | Babel config for Expo + Reanimated plugin |

---

## NAVIGATION

| Package | Installed Version | Status | Day Added | Purpose |
|---------|-----------------|--------|-----------|---------|
| @react-navigation/native | ^7.2.5 | ✅ Active | Day 1 | Navigation core library |
| @react-navigation/native-stack | ^7.16.0 | ✅ Active | Day 1 | Stack navigator (push/pop screens) |
| @react-navigation/bottom-tabs | ^7.16.2 | ✅ Active | Day 1 | Bottom tab bar (5 main tabs) |
| react-native-screens | 4.25.2 | ✅ Active | Day 1 | Native screen optimization (required by React Nav) |
| react-native-safe-area-context | ~5.7.0 | ✅ Active | Day 1 | Safe area insets (notch/status bar handling) |

---

## STATE MANAGEMENT

| Package | Installed Version | Status | Day Added | Purpose |
|---------|-----------------|--------|-----------|---------|
| @reduxjs/toolkit | ^2.12.0 | ✅ Active | Day 1 | Redux state: createSlice, createAsyncThunk |
| react-redux | ^9.3.0 | ✅ Active | Day 1 | React bindings: useSelector, useDispatch |

---

## HTTP + AUTH

| Package | Installed Version | Status | Day Added | Purpose |
|---------|-----------------|--------|-----------|---------|
| axios | ^1.17.0 | ✅ Active | Day 1 | HTTP client with JWT interceptor |
| expo-secure-store | ~56.0.4 | ✅ Active | Day 1 | Encrypted JWT storage (device keychain) |
| @react-native-google-signin/google-signin | ^16.1.2 | ✅ Active | Day 2 | Google OAuth — triggers account picker, returns ID token |

---

## UI + ANIMATION

| Package | Installed Version | Status | Day Added | Purpose |
|---------|-----------------|--------|-----------|---------|
| expo-linear-gradient | ~56.0.4 | ✅ Active | Day 1 | Gradient backgrounds (Sign-In screen, cards) |
| @expo/vector-icons | ^15.0.2 | ✅ Active | Day 1 | Icons (Ionicons) — tab bar + buttons |
| react-native-reanimated | 4.3.1 | ✅ Active | Day 1 | Smooth animations (score gauge, transitions) |
| react-native-gesture-handler | ~2.31.1 | ✅ Active | Day 1 | Gesture support (required by React Navigation) |

---

## OTA UPDATES + BUILD

| Package | Installed Version | Status | Day Added | Purpose |
|---------|-----------------|--------|-----------|---------|
| expo-updates | ~56.0.18 | ✅ Active | Day 1 | OTA JS updates — existing users get updates on app open |

### How OTA works:
- Push code to `main` → GitHub Action runs `eas update --channel preview`
- Users open app → update detected → `UpdatePrompt.tsx` appears → tap to apply
- No reinstall needed — only new JS bundle is downloaded

---

## FILE HANDLING

| Package | Installed Version | Status | Day Added | Purpose |
|---------|-----------------|--------|-----------|---------|
| expo-document-picker | ~56.0.x | ✅ Active | Day 4 | Pick PDF/DOCX from phone storage for resume upload |

---

## AUDIO RECORDING

| Package | Installed Version | Status | Day Added | Purpose |
|---------|-----------------|--------|-----------|---------|
| expo-av | ^16.0.8 | ✅ Installed | Day 11 | Record voice answers for mock interview (Audio.Recording) |

---

## UTILITIES

| Package | Installed Version | Status | Day Added | Purpose |
|---------|-----------------|--------|-----------|---------|
| expo-clipboard | ⬜ Not yet | ⬜ Day 8 | — | Copy cover letter text to clipboard |
| dayjs | ^1.11.21 | ✅ Active | Day 1 | Date formatting ("Applied 3 days ago") |

---

## ON HOLD

| Package | Status | Planned For | Reason on Hold |
|---------|--------|-------------|---------------|
| Lottie React Native | ⏸ Phase 2 | Interview character animation | Not needed for Phase 1 MVP |
| RevenueCat | ⏸ Phase 1 launch | In-app subscriptions | Add before public Play Store launch |
| Firebase SDK (notifications) | ⏸ Phase 2 | Push notifications | After core features done |
| expo-camera | ⏸ Phase 3 | Video interview | Voice-only for Phase 1 |

---

## REJECTED

| Package | Rejected On | Reason |
|---------|------------|--------|
| Context API (for state) | Jun 2026 | Too verbose for 5 feature slices — Redux Toolkit cleaner (ADR-F002) |
| fetch (built-in) | Jun 2026 | No interceptor support — Axios chosen for JWT injection (ADR-F003) |
| AsyncStorage (for JWT) | Jun 2026 | Unencrypted — SecureStore used for credentials (ADR-F004) |
| React Navigation v6 | Jun 2026 | v7 is current, use latest |
| Zustand | Jun 2026 | Redux Toolkit preferred — team familiar, DevTools support |

---

## package.json — ACTUAL INSTALLED DEPENDENCIES

```json
{
  "dependencies": {
    "expo": "~56.0.9",
    "expo-status-bar": "~56.0.4",
    "expo-dev-client": "~56.0.19",
    "expo-updates": "~56.0.18",
    "expo-secure-store": "~56.0.4",
    "expo-linear-gradient": "~56.0.4",
    "react": "19.2.3",
    "react-native": "0.85.3",
    "@react-navigation/native": "^7.2.5",
    "@react-navigation/native-stack": "^7.16.0",
    "@react-navigation/bottom-tabs": "^7.16.2",
    "react-native-screens": "4.25.2",
    "react-native-safe-area-context": "~5.7.0",
    "@reduxjs/toolkit": "^2.12.0",
    "react-redux": "^9.3.0",
    "axios": "^1.17.0",
    "@react-native-google-signin/google-signin": "^16.1.2",
    "expo-linear-gradient": "~56.0.4",
    "@expo/vector-icons": "^15.0.2",
    "react-native-reanimated": "4.3.1",
    "react-native-gesture-handler": "~2.31.1",
    "dayjs": "^1.11.21"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "babel-preset-expo": "^56.0.14",
    "typescript": "~6.0.3"
  }
}
```

_This section must match package.json exactly. Update on every `npm install`._

---

## CHANGE LOG

| Version | Date | Change | Reason |
|---------|------|--------|--------|
| 1.0 | Jun 6, 2026 | Initial tech stack defined | Project start |
| 1.1 | Jun 6, 2026 | Fixed all package versions to match actual package.json; marked all Day 1–2 packages ✅ Active; added expo-updates, expo-dev-client, babel-preset-expo | Version audit |
