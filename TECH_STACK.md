# ApplyAI Mobile — Tech Stack
> Version: 1.0 | Last updated: Jun 6, 2026
> Every package: status, version, purpose, why chosen.

---

## STATUS LEGEND

| Symbol | Meaning |
|--------|---------|
| ✅ Active | In use now |
| ⬜ Planned | Will be added on specific day |
| ⏸ On Hold | Decided to build later |
| ❌ Rejected | Evaluated and decided against |

---

## CORE FRAMEWORK

| Package | Version | Status | Day | Purpose | Notes |
|---------|---------|--------|-----|---------|-------|
| react-native | 0.85.3 | ✅ Active | Day 1 | Core framework | Via Expo SDK 56 |
| expo | ~56.0.9 | ✅ Active | Day 1 | Managed workflow | OTA updates, no ejecting needed Phase 1 |
| react | 19.2.3 | ✅ Active | Day 1 | UI library | React 19 |
| typescript | ~6.0.3 | ✅ Active | Day 1 | Type safety | All files .tsx/.ts, no .js |
| expo-status-bar | ~56.0.4 | ✅ Active | Day 1 | Status bar control | Expo managed |

---

## NAVIGATION

| Package | Version | Status | Day | Purpose | Notes |
|---------|---------|--------|-----|---------|-------|
| @react-navigation/native | ^7.0 | ⬜ Day 1 | — | Navigation core | v7 — latest |
| @react-navigation/native-stack | ^7.0 | ⬜ Day 1 | — | Stack navigator | Screens that push/pop |
| @react-navigation/bottom-tabs | ^7.0 | ⬜ Day 1 | — | Bottom tab bar | Main 5-tab nav |
| react-native-screens | ~3.34 | ⬜ Day 1 | — | Native screen optimization | Required by React Nav |
| react-native-safe-area-context | 4.12.0 | ⬜ Day 1 | — | Safe area insets | Required by React Nav |

---

## STATE MANAGEMENT

| Package | Version | Status | Day | Purpose | Notes |
|---------|---------|--------|-----|---------|-------|
| @reduxjs/toolkit | ^2.3 | ⬜ Day 1 | — | Redux state management | createSlice, createAsyncThunk |
| react-redux | ^9.1 | ⬜ Day 1 | — | React-Redux bindings | useSelector, useDispatch |

---

## HTTP + AUTH

| Package | Version | Status | Day | Purpose | Notes |
|---------|---------|--------|-----|---------|-------|
| axios | ^1.7 | ⬜ Day 1 | — | HTTP client | Interceptors for JWT |
| expo-secure-store | ~14.0 | ⬜ Day 1 | — | Secure JWT storage | Device keychain/keystore |
| @react-native-google-signin/google-signin | ^13.0 | ⬜ Day 2 | — | Google OAuth trigger | Needs google-services.json |

---

## UI COMPONENTS

| Package | Version | Status | Day | Purpose | Notes |
|---------|---------|--------|-----|---------|-------|
| expo-linear-gradient | ~14.0 | ⬜ Day 1 | — | Gradient backgrounds | Onboarding, cards |
| @expo/vector-icons | ^14.0 | ⬜ Day 1 | — | Icons (Ionicons, etc.) | Tab bar + button icons |
| react-native-reanimated | ~3.16 | ⬜ Day 1 | — | Smooth animations | Score gauge animation |
| react-native-gesture-handler | ~2.20 | ⬜ Day 1 | — | Gesture support | Required by React Nav + swiper |

---

## FILE HANDLING

| Package | Version | Status | Day | Purpose | Notes |
|---------|---------|--------|-----|---------|-------|
| expo-document-picker | ~12.0 | ⬜ Day 4 | — | Pick PDF from phone | File type + size validation |

---

## AUDIO RECORDING

| Package | Version | Status | Day | Purpose | Notes |
|---------|---------|--------|-----|---------|-------|
| expo-av | ~15.0 | ⬜ Day 11 | — | Audio recording for interview | Records voice answers as M4A |

---

## UTILITIES

| Package | Version | Status | Day | Purpose | Notes |
|---------|---------|--------|-----|---------|-------|
| expo-clipboard | ~7.0 | ⬜ Day 8 | — | Copy cover letter to clipboard | Cover letter screen |
| dayjs | ^1.11 | ⬜ Day 1 | — | Date formatting | "Applied 3 days ago" |

---

## ON HOLD

| Package | Status | Planned For | Reason on Hold |
|---------|--------|-------------|---------------|
| Lottie React Native | ⏸ Phase 2 | Interview character animation | Not needed for Phase 1 MVP |
| RevenueCat | ⏸ Phase 1 launch | In-app subscriptions | Add before public launch |
| Firebase SDK (notifications) | ⏸ Phase 1 later | Push notifications | After core features done |
| expo-camera | ⏸ Phase 3 | Video interview | Voice-only for Phase 1 |
| react-native-vision-camera | ⏸ Phase 3 | Video interview | Overkill for Phase 1 |

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

## package.json — CURRENT DEPENDENCIES

```json
{
  "name": "applyai-mobile",
  "dependencies": {
    "expo": "~56.0.9",
    "expo-status-bar": "~56.0.4",
    "react": "19.2.3",
    "react-native": "0.85.3",
    "typescript": "~6.0.3",
    "@react-navigation/native": "^7.0.14",
    "@react-navigation/native-stack": "^7.2.0",
    "@react-navigation/bottom-tabs": "^7.2.0",
    "react-native-screens": "~4.4.0",
    "react-native-safe-area-context": "4.12.0",
    "@reduxjs/toolkit": "^2.3.0",
    "react-redux": "^9.1.0",
    "axios": "^1.7.9",
    "expo-secure-store": "~14.0.0",
    "@react-native-google-signin/google-signin": "^13.0.0",
    "expo-linear-gradient": "~14.0.0",
    "@expo/vector-icons": "^14.0.2",
    "react-native-reanimated": "~3.16.1",
    "react-native-gesture-handler": "~2.20.2",
    "expo-document-picker": "~12.0.2",
    "expo-clipboard": "~7.0.0",
    "dayjs": "^1.11.13"
  }
}
```

_Update this section every time a package is added, removed, or version changes._

---

## CHANGE LOG

| Version | Date | Change | Reason |
|---------|------|--------|--------|
| 1.0 | Jun 6, 2026 | Initial tech stack defined | Project start |
