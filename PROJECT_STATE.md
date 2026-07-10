# ApplyAI Mobile — Project State
> This is the SINGLE SOURCE OF TRUTH for the current frontend codebase state.
> Read this first every session. Update before ending every session.
> If this file contradicts code on disk, trust the code — then fix this file.

---

## KNOWLEDGE BASE FILES

| File | Purpose | Read When |
|------|---------|-----------|
| `CLAUDE.md` | Master instructions, session protocols, code rules | Every session |
| `PROJECT_STATE.md` | Live codebase state | Every session |
| `BUILD_LOG.md` | Session accountability | Every session |
| `ARCHITECTURE.md` | Navigation tree, Redux store, component hierarchy | Building screens, design questions |
| `SCREEN_SPEC.md` | Every screen's props, state, API calls, navigation | Building/testing screens |
| `API_INTEGRATION.md` | Every API call the frontend makes | API/integration work |
| `FUNCTIONAL_FLOW.md` | End-to-end UI user flows | Understanding what app does |
| `TECH_STACK.md` | All packages, status, decisions | Adding packages, tech questions |
| `INTEGRATION_CONFIG.md` | Backend URL, env vars, auth setup | Infra/config questions |

---

## CURRENT BUILD PHASE

**Phase:** 1 — Core Screens (Days 1–12) + Theming
**Active Day:** Phase 1 complete — theming layer added Jun 24, 2026
**Last Session:** Jun 24, 2026
**Overall Status:** Phase 1 complete. Centralized theme system (dark mode + 5 accent colors) added across all 41 screens. TypeScript clean (0 screen errors). 328 tests passing.

---

## SCREEN STATUS

| Screen | Day | Status | Version | Tested |
|--------|-----|--------|---------|--------|
| App shell + navigation setup | 1 | ✅ Complete | v1.0 | ⬜ Pending emulator |
| Splash / Onboarding screen | 1 | ✅ Complete | v1.0 | ⬜ Pending emulator |
| Google Sign-In screen | 2 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Home / Dashboard screen | 3 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Resume List screen | 4 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Resume Upload screen | 4 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Resume Detail / Score screen | 5 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Job Feed screen | 6 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Job Detail screen | 6 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Match Score screen | 7 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Tailor Resume screen | 8 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Cover Letter screen | 8 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Applications List screen | 9 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Application Detail screen | 9 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Interview Start screen | 10 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Interview Question screen | 11 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Interview Report screen | 10 | ✅ Complete | v1.0 | ⬜ Pending device test |
| Profile / Settings screen | 3 | ✅ Complete | v1.0 | ⬜ Pending device test |

---

## FILES THAT EXIST

### Root
- `package.json` ✅
- `app.json` ✅ (name: ApplyAI, package: com.applyai.mobile)
- `babel.config.js` ✅ (babel-preset-expo + reanimated plugin)
- `.env` ✅ (EXPO_PUBLIC_API_URL set)
- `tsconfig.json` ✅
- `App.tsx` ✅ (GestureHandlerRootView → SafeAreaProvider → Redux Provider → AppNavigator)
- `index.ts` ✅

### Source Structure (built)
```
src/
├── api/
│   └── apiClient.ts          ✅ Axios + JWT interceptor + 401 handler
├── navigation/
│   ├── AppNavigator.tsx       ✅ Root: bootstraps JWT → routes Auth or Main
│   ├── AuthNavigator.tsx      ✅ Stack: Onboarding → GoogleSignIn
│   ├── MainNavigator.tsx      ✅ Bottom tabs + HomeStack (Home → Profile)
│   └── types.ts               ✅ All TS navigation param types (HomeStackParamList added)
├── screens/
│   ├── auth/
│   │   ├── SplashScreen.tsx   ✅ Blue branded splash
│   │   ├── OnboardingScreen.tsx ✅ "Get Started" → GoogleSignIn
│   │   └── GoogleSignInScreen.tsx ✅ Full UI + Google Sign-In flow (Day 2)
│   ├── home/
│   │   ├── HomeScreen.tsx     ✅ Full dashboard (stats, quick actions, empty state, avatar → Profile)
│   │   └── ProfileScreen.tsx  ✅ User info, plan badge, job prefs, sign-out button
│   ├── resume/
│   │   ├── ResumeListScreen.tsx ✅ Full — FlatList, FAB, skeleton, empty/error states
│   │   ├── ResumeUploadScreen.tsx ✅ Full — doc picker, multipart upload, validation
│   │   ├── ResumeDetailScreen.tsx ✅ Full — score ring, skills chips, strengths/improvements, AI analyze flow
│   │   ├── TailorResumeScreen.tsx ✅ Placeholder
│   │   └── CoverLetterScreen.tsx ✅ Placeholder
│   ├── jobs/
│   │   ├── JobFeedScreen.tsx  ✅ Full — FlatList, infinite scroll, salary formatting, skeleton/empty/error
│   │   ├── JobDetailScreen.tsx ✅ Full — job meta, action row, description, View Posting link
│   │   └── MatchScoreScreen.tsx ✅ Full — resume picker, score ring, strengths/gaps/recommendation, Redux cache
│   ├── applications/
│   │   ├── ApplicationsListScreen.tsx ✅ Placeholder
│   │   └── ApplicationDetailScreen.tsx ✅ Placeholder
│   └── interview/
│       ├── InterviewStartScreen.tsx ✅ Placeholder
│       ├── InterviewQuestionScreen.tsx ✅ Placeholder
│       └── InterviewReportScreen.tsx ✅ Placeholder
├── store/
│   ├── index.ts               ✅ configureStore with all slices (incl. themeReducer)
│   └── slices/
│       ├── authSlice.ts       ✅ jwt, user, isLoading, error
│       ├── resumeSlice.ts     ✅ list, selected, isUploading, isAnalyzing
│       ├── jobSlice.ts        ✅ feed, matchScores, pagination
│       ├── applicationSlice.ts ✅ list, selected
│       ├── interviewSlice.ts  ✅ currentSession, history
│       └── themeSlice.ts      ✅ mode (light/dark), accent (blue/purple/green/orange/pink); actions: setMode, setAccent, toggleMode
├── theme/
│   ├── themes.ts              ✅ buildTheme(mode, accent) → AppColors; ACCENT_PRESETS; 5 accent presets
│   └── ThemeContext.tsx       ✅ ThemeProvider (Redux + SecureStore persistence); useTheme() → AppColors; useThemeSettings() → {colors, isDark, mode, accent}
├── types/
│   └── api.types.ts           ✅ All API response interfaces
├── constants/
│   └── index.ts               ✅ ROUTES, COLORS, API_ENDPOINTS, SECURE_STORE_KEYS
└── utils/
    └── auth.ts                ✅ saveJwt / getJwt / clearJwt (SecureStore)
```

_Update this tree every time a new file is added._

---

## NAVIGATION STRUCTURE

```
Root Stack
├── Auth Stack (shown when no JWT)
│   ├── SplashScreen
│   ├── OnboardingScreen
│   └── GoogleSignInScreen
│
└── Main Tab Navigator (shown when JWT exists)
    ├── Tab: Home
    │   ├── HomeScreen (Dashboard)
    │   └── ProfileScreen (push from avatar)
    ├── Tab: Jobs
    │   ├── JobFeedScreen
    │   ├── JobDetailScreen
    │   ├── MatchScoreScreen
    │   ├── TailorResumeScreen
    │   └── CoverLetterScreen
    ├── Tab: Resume
    │   ├── ResumeListScreen
    │   ├── ResumeUploadScreen
    │   └── ResumeDetailScreen
    ├── Tab: Applications
    │   ├── ApplicationsListScreen
    │   └── ApplicationDetailScreen
    └── Tab: Interview
        ├── InterviewStartScreen
        ├── InterviewQuestionScreen
        └── InterviewReportScreen
```

_Update whenever a screen is added, removed, or renamed._

---

## ENVIRONMENT VARIABLES

| Variable | Purpose | Status |
|----------|---------|--------|
| `EXPO_PUBLIC_API_URL` | Backend base URL | ⬜ Set in .env |
| `EXPO_PUBLIC_ENV` | development / production | ⬜ Set in .env |

---

## DEPENDENCY MAP

Before building any screen, ALL dependencies must be ✅:

```
Day 1 (Setup + Nav shell)      → No dependencies
Day 2 (Google Sign-In)         → Day 1 ✅ + Backend Day 3 ✅ (auth endpoints)
Day 3 (Home + Profile)         → Day 2 ✅ (user object in Redux)
Day 4 (Resume List + Upload)   → Day 3 ✅ + Backend Day 4 ✅ (resume upload endpoints)
Day 5 (Resume Score screen)    → Day 4 ✅ + Backend Day 5 ✅ (AI parse/score endpoints)
Day 6 (Job Feed + Detail)      → Day 5 ✅ + Backend Day 6 ✅ (job feed endpoints)
Day 7 (Match Score screen)     → Day 6 ✅ + Backend Day 7 ✅ (match score endpoint)
Day 8 (Tailor + Cover Letter)  → Day 7 ✅ + Backend Day 8 ✅ (tailor/CL endpoints)
Day 9 (Applications)           → Day 8 ✅ + Backend Day 9 ✅ (application endpoints)
Day 10 (Interview Start+Report)→ Day 9 ✅ + Backend Day 10 ✅ (interview endpoints)
Day 11 (Interview Answer)      → Day 10 ✅ + Backend Day 11 ✅ (answer eval endpoint)
Day 12 (E2E polish)            → All above ✅
```

---

## KNOWN ISSUES / BUGS

```
[BUG-001] | Login (FCM) | FIXED | Opened Jun 11, 2026 — Fixed Jun 11, 2026
Symptom: Render crash on login — "No Firebase App '[DEFAULT]' has been created"
Screen/File: AppNavigator → src/hooks/useFcmDeepLink.ts:62
Reproduced: yes (physical device, dev build)
Fix applied: (1) android/ predated Firebase — wired google-services plugin into
android/build.gradle + android/app/build.gradle and copied google-services.json
into android/app/ (local-only; android/ is gitignored). (2) Hardened
useFcmDeepLink — messaging() instance obtained once inside try/catch so missing
native Firebase degrades to no-FCM instead of crashing the render tree.
(3) Committed google-services.json (un-gitignored) so EAS cloud prebuild gets
Firebase wiring. NOTE: avoid `expo prebuild --clean` — it wipes the wepoll
org.gradle.jvmargs patch in android/gradle.properties.
```

```
[BUG-MOB-002] | Navigation | FIXED | Opened Jul 10, 2026 — Fixed Jul 10, 2026
Symptom: React Navigation warning on app start — "Found screens with the same
name nested inside one another... This can cause confusing behavior during
navigation." Console also showed unrelated "duplicate key" warnings while
investigating (see BUG-MOB-003).
Screen/File: MainNavigator.tsx — TailorResume + CoverLetter were registered in
BOTH JobsStack and ResumeStack simultaneously.
Reproduced: yes (physical device, dev build) — confirmed via console warning
Fix applied: Removed the dead ResumeStack registrations (nothing anywhere
navigated to them via that stack — only ApplyJobScreen/JobDetailScreen, both
JobsStack members, ever call navigate('TailorResume'/'CoverLetter')). Retyped
TailorResumeScreen.tsx/CoverLetterScreen.tsx route props against
JobsStackParamList instead of ResumeStackParamList. Removed both keys from
ResumeStackParamList in navigation/types.ts. tsc --noEmit clean, 462 mobile
tests green.
```

```
[BUG-MOB-004] | Notifications | FIXED | Opened Jul 10, 2026 — Fixed Jul 10, 2026
Symptom: Notifications screen (Home tab, reached via Profile → Notifications)
always showed the same 4 hardcoded "tip" strings ("Complete your profile",
"Tailor your resume", "Practice mock interviews", "Check your ATS score")
with fake static timestamps ("1h ago", "3h ago"...) that never changed,
alongside real Job Alerts. A separate, fully dynamic notifications screen
(SocialNotificationsScreen, reached via the Feed tab's bell icon) already
existed backed by the real `/api/notifications/social` endpoint — this screen
just never got wired to it.
Screen/File: NotificationsScreen.tsx (common/)
Reproduced: yes — every load showed identical content regardless of real
account activity
Fix applied: Removed the hardcoded `tips` array entirely. NotificationsScreen
now shares the same Redux notificationSlice + `/api/notifications/social`
endpoint as SocialNotificationsScreen (setNotifications/appendNotifications/
markAllRead/markOneRead), with pagination and tap-to-navigate (DM → chat,
post → PostDetail, actor → PublicProfile). Job Alerts (already real) kept as
their own header section. Also: SocialNotification.Type only had 5 of the
backend's 14 real types mapped to icons — extracted a shared
notificationIcons.ts covering all 14, used by both screens now. 3 new tests
added to NotificationsScreen.test.tsx + SocialNotificationsScreen.test.tsx;
stale assertions about static tips removed. 465 mobile tests green.
```

```
[BUG-MOB-003] | Chat | FIXED | Opened Jul 10, 2026 — Fixed Jul 10, 2026
Symptom: Console error on opening a chat conversation from a profile's
"Message" button — "Encountered two children with the same key" (7 sequential
message ids). FlatList keyExtractor is String(item.id); a duplicate id in the
`messages` array triggers this.
Screen/File: ChatDetailScreen.tsx (FlatList) / chatSlice.ts (setMessages
reducer)
Reproduced: yes, on first navigation to a chat from a profile (not a Fast
Refresh artifact)
Fix applied: setMessages reducer now dedupes the incoming page by id before
storing (chatSlice.ts) — the 5s poll in ChatDetailScreen re-dispatches
setMessages on every tick and this closes the gap regardless of exact race
cause. appendMessage already had an equivalent guard. Added chatSlice.test.ts
(10 new tests). 462 mobile tests green.
```

Format when adding:
```
[BUG-001] | Day X | OPEN | Jun 6, 2026
Symptom: what breaks and how
Screen/File: where it fails
Reproduced: yes/no
Fix applied: (fill when resolved)
```

---

## OUT-OF-ORDER WORK LOG

_None yet._

---

## DOC HEALTH DASHBOARD

| Check | Status | Last Verified |
|-------|--------|--------------|
| Every screen in SCREEN STATUS has full entry in SCREEN_SPEC.md | ✅ | Jun 6, 2026 |
| Every API call in API_INTEGRATION.md maps to backend API_SPEC | ✅ | Jun 6, 2026 |
| Every ✅ screen in SCREEN STATUS has ✅ in BUILD_LOG MASTER TRACKER | ✅ | Jun 6, 2026 |
| FUNCTIONAL_FLOW.md Flow Index matches SCREEN STATUS | ✅ | Jun 6, 2026 |
| No [DATE] placeholders in BUILD_LOG | ✅ | Jun 6, 2026 |

---

*Last updated: Jun 11, 2026 — v1.6: BUG-001 fixed — Firebase [DEFAULT] crash on login; useFcmDeepLink hardened; google-services.json now committed for EAS builds*
