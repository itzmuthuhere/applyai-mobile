# ApplyAI Mobile — Project State
> This is the SINGLE SOURCE OF TRUTH for the current frontend codebase state.
> Read this first every session. Update before ending every session.
> If this file contradicts code on disk, trust the code — then fix this file.
> **Platform priority: web-first as of Jul 12, 2026 — see CLAUDE.md.** This repo's `react-native-web` build (`feature/web-app` branch) is the primary platform; native Android/iOS is secondary.

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

**Phase:** 1 — Core Screens (Days 1–12) + Theming + Web Parity (in progress)
**Active Day:** Phase 1 complete — theming layer added Jun 24, 2026. Web app (feature/web-app branch) bootstrapped Jul 12, login verified end-to-end Jul 13, 2026. Web MVP push started Aug 9, 2026 on branch `feature/web-mvp` (off `feature/web-app`) — see below.
**Last Session:** Aug 9, 2026

**Overall Status (Aug 9, 2026):** Closed the gaps between `feature/web-app`'s existing screens and the "web-first MVP, ship this week" flow the user asked for (see `D:\backend` BUILD_LOG.md same date for the full cross-repo context — this was mostly a frontend session, zero new backend endpoints needed since the existing API is already client-agnostic). Five concrete gaps closed:
1. **Extension install step** — `AutoApplyQueueScreen.tsx`'s old static hint banner replaced with a real `components/jobs/ExtensionInstallCard.tsx` (new file): Chrome Web Store link (`CHROME_EXTENSION_URL`, new constant) + an actual "Install" button. Still no live install-detection — deliberately deferred, extension repo untouched.
2. **RevenueCat Web Billing** — the real risk item. `services/revenueCat.ts` split into a native-only file (Metro `.native`/default resolution) and a new `services/revenueCat.web.ts` (Metro `.web` resolution) using the new `@revenuecat/purchases-js` SDK, configured with the user's email as `appUserId` (must match the native `Purchases.logIn(userEmail)` convention exactly, since the backend webhook resolves purchases by email — see backend BUILD_LOG.md). `PaywallScreen.tsx`'s old "Coming Soon... Google Play" dead-end on web is gone; web purchases now go through a real checkout. Restore-purchases hidden on web (doesn't map to an account-based web purchase model). **Not yet functional against a real account** — needs RevenueCat dashboard Web Billing + Stripe connection (see actions checklist).
3. **Live progress polling** — `AutoApplyQueueScreen.tsx` now re-polls `GET /api/auto-apply/queue` every 10s while any item is PENDING/APPLYING, stops once all settle. Was previously manual-refresh-only.
4. **Tailored resume visible for interview prep** — `ApplicationDetailScreen.tsx` now shows `application.tailoredResumeText` (was on the type, never rendered). Also added the field to the `Application` TS type (`types/api.types.ts`) — it existed on the backend response (`ApplicationResponse.java`) but was missing from the frontend type entirely.
5. **Top 20 cap** — `JobFeedScreen.tsx`'s default view (Best Match sort, All Jobs tab, no search/filter) no longer infinite-scrolls past the first 20 — that's the "top 20 matches" feed the auto-apply flow is built around. Any deliberate narrowing (search, filter, tab switch) re-enables normal pagination.

All 532 mobile tests green (was 517 baseline + new coverage for all 5 changes, including the native/web `revenueCat` split). `tsc --noEmit` shows zero new errors from this session's files (one pre-existing unrelated error in `ApplicationDetailScreen.tsx` line 333, `application.resume` possibly null — confirmed pre-existing on `feature/web-app` before this session, not touched).

**External setup still required (not code, tracked here since no `actions/ACTION_REQUIRED_0XX.md` was warranted for a multi-item checklist this small):**
- RevenueCat dashboard: connect Stripe, create Web Billing products/entitlements matching the existing `hunter`/`pro` lowercase identifiers
- Set the real `EXPO_PUBLIC_REVENUECAT_WEB_BILLING_KEY` once issued
- Google Cloud Console: add the production Vercel domain to the OAuth client's Authorized JavaScript origins (per `actions/ACTION_REQUIRED_004.md`, only `localhost:8090` was ever confirmed added)
- Verify Railway `CORS_ALLOWED_ORIGINS` still matches the production domain live (checked this session — it does, see backend BUILD_LOG.md)
**Overall Status (Jul 13, 2026):** Web app login now works end-to-end against the live Railway backend (ACTION_REQUIRED_004 done — Google Cloud Console origin + Railway CORS_ALLOWED_ORIGINS both set). Live web testing (via Claude in Chrome, the user's real signed-in browser) found and fixed BUG-MOB-018 (Alert.alert was a total no-op on web, app-wide — 75 call sites, fixed via a react-native-web patch-package patch), BUG-MOB-019 (Paywall restore-purchases unguarded on web), BUG-MOB-020 (WebSidebar account footer wasn't clickable, ProfileScreen unreachable from it). 24 screens verified rendering correctly on web with zero console errors (Onboarding, GoogleSignIn, Home, Feed, Search, ChatList, Jobs list, JobDetail, CompanyIntel, Companies, SavedJobs, JobAlerts, AutoApplyQueue, Resumes list, ResumeUpload, ResumeDetail, Applications list, ApplicationDetail, Interview landing, Profile, ProfileSettings, Analytics, SalaryIntel, NegotiationCoach, CareerPath, Blacklist, Notifications, Paywall, HrPostJob — see BUILD_LOG.md for the full breakdown). Remaining screens were deliberately not live-tested this session because doing so would trigger real side effects (AI credit usage, actual job applications, voice recording) — same judgment call as the FEAT-024 session.

**FEAT-026 (same day, follow-up):** User pushed back with screenshots — most screens were still stretching full-bleed on desktop web despite "rendering correctly." Root cause: FEAT-024/025's centering treatment (`WebPageContainer`) had only reached 7 of 44 screens. Applied it to all 36 remaining screens (2 intentionally skipped — see BUILD_LOG.md). 517 mobile tests passing.

**Overall Status (Jul 11, 2026, prior):** BUG-MOB-009 (comment/post timestamps showing wrong relative time) fixed — backend-side global UTC serializer, no mobile code change (see applyai-backend BUG-059). PostDetailScreen redesigned (FEAT-UI-002) — card shadows, avatar color-hash rings, skeleton loaders, pill stat badges. BUG-MOB-010 fixed — profile avatar now opens the read-only view screen (with Edit button) instead of jumping straight into the edit form. BUG-MOB-011 fixed — all 3 Quick Apply entry points (JobDetailScreen, JobFeedScreen, SavedJobsScreen) now sync Redux so the Mock Interview job picker sees new applications immediately. FEAT-019 — JobFeedScreen bulk-queue bar gets tailor/cover-letter toggle chips; AutoApplyQueueScreen gets full select-mode + bulk remove (applyai-backend FEAT-018). FEAT-020 — HomeScreen (the actual landing tab) gets a "Jobs for you" personalized preview section since Jobs is a separate tab users weren't reaching. FEAT-021 — JobFeedScreen now opens with a resume upload CTA (no parsed resume) or a resume status card with AI score (parsed resume exists), making the "resume → matched jobs" connection explicit instead of three disconnected tabs. BUG-MOB-012 — ResumeListScreen now has a real "Use for job matching" selector (was previously impossible to change; see applyai-backend BUG-060). BUG-MOB-013 — the selector now computes a single-winner primary client-side instead of trusting the raw isOriginal flag, so accounts with multiple stale-original resumes (uploaded before BUG-060) get a working selector instead of every resume showing "already primary." 506 mobile tests passing.

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
| `EXPO_PUBLIC_REVENUECAT_KEY` | Native RevenueCat public SDK key (iOS/Android IAP) | ⬜ Not set in .env — configure via RevenueCat dashboard |
| `EXPO_PUBLIC_REVENUECAT_WEB_BILLING_KEY` | RevenueCat Web Billing public key (Stripe-backed, web-only paywall) | ⬜ Placeholder added to .env — needs the real key from RevenueCat dashboard once Web Billing + Stripe are connected there (see actions checklist below) |

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
[BUG-MOB-008] | Notifications | FIXED | Opened Jul 11, 2026 — Fixed Jul 11, 2026
Symptom: User-reported screenshot showed the global bell icon's red unread
dot still visible even while looking directly at an empty "All caught up!"
Notifications screen. Request: dot should only show for genuinely new
notifications, and should clear once the user has opened/viewed them.
Screen/File: GlobalSearchBar.tsx, NotificationsScreen.tsx,
SocialNotificationsScreen.tsx
Root cause: GlobalSearchBar's red dot was rendered completely
unconditionally — it had zero connection to unreadCount or any Redux state
at all, so it was permanently visible regardless of actual notification
status.
Fix: (1) GlobalSearchBar now reads `s.socialNotifications.unreadCount` and
only renders the dot when > 0. (2) Both notification screens now
automatically call the mark-all-read endpoint right after their initial
load completes — opening the screen is itself the "seen it" signal, so the
dot clears without a separate tap. (3) Removed the now-redundant explicit
"Mark all read" button/header-count from both screens (auto-mark-on-open
supersedes it) — SocialNotificationsScreen's header now just shows back +
title with a balancing spacer. 2 new tests (GlobalSearchBar conditional
dot), 3 existing tests rewritten to assert the auto-mark behavior instead of
button-press. 482 mobile tests green.
Symptom: User asked "why is this option here?" after tapping "Tailor for a
Job" quick action on ResumeDetailScreen — it only showed an Alert saying "Go
to the Jobs tab, open a job, and tap 'Tailor Resume' from there," a dead-end
that describes the steps instead of doing them.
Screen/File: ResumeDetailScreen.tsx
Fix: Button now navigates directly to JobsTab → JobFeed instead of showing
the alert (Analyze-first guard alert unchanged). No test file existed for
this screen at all — added ResumeDetailScreen.test.tsx (2 tests) covering
both the parsed (navigates) and unparsed (shows Analyze First alert) paths.
480 mobile tests green.
```

```
[BUG-MOB-006] | Feed | FIXED | Opened Jul 11, 2026 — Fixed Jul 11, 2026
Symptom: User-reported screenshot showed bell + chat icons appearing twice on
the Feed screen — once in the global top bar (GlobalSearchBar, rendered once
above the whole Tab.Navigator), once again in FeedScreen's own local header.
Screen/File: FeedScreen.tsx
Cause: FeedScreen's header re-implemented its own notifications/chat buttons
(navigate to SocialNotifications/ChatList) independently of GlobalSearchBar,
which already provides the same actions on every tab.
Fix: Removed the duplicate bell + chat buttons and the now-unused
`unreadCount` selector/badge styles from FeedScreen's header — kept only the
"+ Post" create button (genuinely screen-specific, not duplicated elsewhere).
Also redesigned the "Nothing here yet" empty state to match the app's
established pattern (circular icon badge, bolder copy, shadowed primary
button) and added a secondary "Find people to follow" action linking to
Search. 3 new tests, 478 mobile tests green.
```

```
[FEAT-MOB] | Resume Delete | Complete | Jul 10, 2026
Context: no delete-resume capability existed anywhere — direct follow-on from
BUG-MOB-005's caveat (broken resume needs deleting + re-uploading to get a
working link).
Screen/File: ResumeListScreen.tsx — long-press a resume card → confirmation
Alert → DELETE /api/resumes/{id} → dispatch removeResume. Shows the backend's
409 message directly ("used in an application") if blocked.
Files: resumeSlice.ts (removeResume reducer), constants/index.ts
(RESUME_BY_ID), ResumeListScreen.test.tsx (+3 tests).
Tests: 475 mobile tests green (472 + 3 new).

[BUG-MOB-005] | Resume | FIXED | Opened Jul 10, 2026 — Fixed Jul 10, 2026
Symptom: Resume filename shown as raw percent-encoding — "Muthu%20raja%20CV.pdf"
instead of "Muthu raja CV.pdf" — on ResumeDetailScreen (user-reported via
screenshot), and the same undecoded pattern also present in ResumeListScreen,
ApplicationDetailScreen, and JobFeedScreen. BUG-MOB-001 (Jun 16) had only ever
patched ResumeDropdown.tsx, so the artifact kept resurfacing everywhere else.
Screen/File: ResumeDetailScreen.tsx, ResumeListScreen.tsx,
ApplicationDetailScreen.tsx, JobFeedScreen.tsx
Reproduced: yes — live on device, screenshot evidence
Root cause: backend (applyai-backend BUG-057) — React Native's multipart
encoder percent-encodes filenames with spaces; the backend stored that raw
header value verbatim as the resume's display name.
Fix applied: Backend now decodes at upload time (fixes future uploads).
Extracted a shared `src/utils/decodeFileName.ts` and applied it at display
time in all 4 screens + refactored ResumeDropdown.tsx's inline duplicate to
use it — this also fixes the already-broken existing DB row without a data
migration. 4 new tests. 472 mobile tests green.
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

```
[BUG-MOB-009] | Feed (PostDetailScreen) | FIXED | Opened Jul 11, 2026 — Fixed Jul 11, 2026
Symptom: Posted a comment ("Bye") and it immediately showed "6 hours ago"
instead of "just now" — same bug affects every timestamp app-wide (posts,
chat messages, notifications, applications), comments just made it obvious.
Screen/File: PostDetailScreen.tsx (dayjs(item.createdAt).fromNow()) — but the
root cause and fix are entirely backend-side, see applyai-backend BUG-059.
Reproduced: yes
Fix applied: No mobile code change. Backend's `LocalDateTime.now()` values
were correct UTC but serialized with no timezone marker; dayjs on the client
parsed the marker-less string as device-local time instead of UTC, understating
"now" by the device's UTC offset (~5.5h on IST → rounds to "6 hours ago").
Backend added a global Jackson customizer (config/JacksonConfig.java) that
serializes every LocalDateTime with a trailing 'Z'; once deployed, existing
mobile dayjs calls resolve correctly with zero mobile-side changes needed.
While in this screen, also redesigned it (see BUILD_LOG.md FEAT-UI-002) —
card shadows, avatar color-hash rings, skeleton loaders, pill stat badges.
```

```
[BUG-MOB-010] | Navigation (Profile) | FIXED | Opened Jul 11, 2026 — Fixed Jul 11, 2026
Symptom: Tapping the header profile avatar opened the full edit form
(ProfileSettingsScreen) directly instead of a read-only LinkedIn-style
profile view with an Edit button.
Screen/File: navigation/MainNavigator.tsx, navigation/types.ts,
screens/home/HomeScreen.tsx
Reproduced: yes
Fix applied: The read-only view screen (ProfileScreen.tsx — hero card,
Profile Strength, Experience/Education/Certifications as read-only cards,
Edit Profile button) already existed but was never registered in any
navigator; HomeStackParamList's "Profile" route pointed straight at
ProfileSettingsScreen instead. Split into two routes: Profile → ProfileScreen
(view), new ProfileSettings → ProfileSettingsScreen (edit). HomeScreen's
"Complete your profile" banner updated to target ProfileSettings directly.
482 mobile tests green, tsc --noEmit clean of new errors.
```

```
[BUG-MOB-011] | Interview (Mock Interview picker) | FIXED | Opened Jul 11, 2026 — Fixed Jul 11, 2026
Symptom: "Choose a Job Application" modal in Mock Interview showed no
applications despite the user having applied to 1 job. Recurring class of
bug — previously fixed as BUG-018 (Jun 24, 2026).
Screen/File: InterviewStartScreen.tsx's picker was NOT the bug this time —
root cause was upstream in screens/jobs/JobDetailScreen.tsx,
JobFeedScreen.tsx, SavedJobsScreen.tsx
Reproduced: yes
Fix applied: All 3 "Quick Apply" entry points POST to
/api/applications/quick-apply/{jobId} and get back the created
ApplicationResponse, but discarded it instead of dispatching addApplication
to Redux — only the original ApplyJobScreen flow did this correctly. When a
user's first application came through any Quick Apply button, Redux stayed
empty; the picker's live GET fetch was the only recovery path, and per
BUG-018's design, a slow/failed fetch (Railway cold start) silently falls
back to the stale empty Redux data. All 3 call sites now capture the
response and dispatch(addApplication(data)). Added JobDetailScreen.test.tsx
(new — screen had no tests before) + regression tests in JobFeedScreen.test.tsx
and SavedJobsScreen.test.tsx. 486 mobile tests green.
Note: this is a recurring pattern — every new "apply" entry point added
since BUG-018 forgot the Redux-sync step. Watch for this if a 4th apply
surface is ever added.
```

```
[BUG-MOB-018] | Web (app-wide) | FIXED | Opened Jul 13, 2026 — Fixed Jul 13, 2026
Symptom: On the web build, every confirmation dialog and error alert did
nothing — no popup, no console error, just silence. Found when
GoogleSignInScreen's sign-in-failed Alert produced zero visible feedback
during live web testing.
Screen/File: node_modules/react-native-web (Alert/index.js) — not app code.
75 Alert.alert(...) call sites across 20 screens were all affected equally.
Reproduced: yes, in both the sandboxed preview browser and the user's real
Chrome
Fix applied: react-native-web ships `Alert.alert()` as a literal no-op
(`static alert() {}`). Patched via patch-package
(patches/react-native-web+0.21.2.patch) to fall back to window.alert/
window.confirm, replicating RN's button-array contract (0 buttons → alert;
1 button → alert then its onPress; 2 buttons → confirm, then the
non-cancel-style button's onPress on OK / the cancel-style button's onPress
on Cancel). Fixes all 75 call sites at once, zero app code changed. No new
Jest test possible (Jest uses the react-native preset, not react-native-web,
so it can't exercise a react-native-web patch) — verified instead by running
the exact patched logic against all 4 real button-array shapes in a live
browser and confirming it matches RN Alert semantics.
```

```
[BUG-MOB-019] | Web (PaywallScreen) | FIXED | Opened Jul 13, 2026 — Fixed Jul 13, 2026
Symptom: Clicking "Restore previous purchases" on web always showed a
generic "Could not restore purchases. Try again." — misleading, since web
billing isn't RevenueCat at all (see FEAT-023 note re: Stripe).
Screen/File: services/revenueCat.ts (restorePurchases), PaywallScreen.tsx
(handleRestore)
Reproduced: yes, by code inspection — restorePurchases() was the only
RevenueCat call in the file without a Platform.OS==='web' guard (getOfferings/
getActiveEntitlements/initRevenueCat all already had one)
Fix applied: restorePurchases() now throws "Restoring purchases isn't
available on web yet." before touching the native SDK on web;
PaywallScreen's catch now shows e.message instead of a hardcoded string.
New tests: revenueCat.test.ts (web-guard case), PaywallScreen.test.tsx
(restore-failure-message case).
```

```
[BUG-MOB-020] | Web (WebSidebar) | FIXED | Opened Jul 13, 2026 — Fixed Jul 13, 2026
Symptom: Clicking the account footer ("Name / Plan") at the bottom of the
desktop-web sidebar did nothing — no navigation, no error, despite looking
exactly like the working avatar button in the top bar (GlobalSearchBar).
Screen/File: navigation/WebSidebar.tsx — userRow was a plain View, not a
TouchableOpacity, with no onPress at all.
Reproduced: yes, live in the user's real Chrome
Fix applied: Wrapped userRow in TouchableOpacity, onPress now
navigation.navigate('HomeTab', { screen: 'Profile' }) — same destination
GlobalSearchBar's avatar already uses. New WebSidebar.test.tsx (2 tests:
footer press navigates to Profile on desktop web; narrow viewport still
falls back to the stock BottomTabBar unchanged).

[BUG-MOB-021] | Web (AutoApplyQueueScreen) | FIXED | Opened Jul 20, 2026 — Fixed Jul 20, 2026
Symptom: The "Install the ApplyAI Chrome extension" hint banner kept showing
even when the extension was already installed — user reported this from a
screenshot showing 20 queued jobs with the banner still visible.
Screen/File: screens/jobs/AutoApplyQueueScreen.tsx — the banner had no
detection logic at all, it rendered unconditionally whenever !selectMode.
Reproduced: yes, from user screenshot.
Fix applied: New hooks/useExtensionInstalled.ts (web-only; native always
reports not-installed since there's no browser/extension concept there)
pings window.postMessage({ type: 'APPLYAI_EXTENSION_PING' }) and waits
400ms for an APPLYAI_EXTENSION_PONG reply. The reply comes from a new
content script in the applyai-extension repo (src/content/webapp.ts) that
only runs on the ApplyAI web app's own origin. Banner now conditioned on
!extensionInstalled. New useExtensionInstalled.test.ts (3 tests) +
AutoApplyQueueScreen.test.tsx banner-hidden-when-installed case.
Caveat: requires a new Chrome Web Store release of the extension (live
since Jul 1, 2026) before already-installed users actually see the banner
disappear — see applyai-extension PROJECT_STATE.md.

[BUG-MOB-022] | Web (GoogleSignInScreen) | FIXED | Opened Jul 20, 2026 — Fixed Jul 20, 2026
Symptom: Found live while testing web sign-in via Claude in Chrome —
clicking "Continue with Google" left the button spinning forever with
no feedback, and in one reproduction the tab froze entirely. Console
showed "[GSI_LOGGER]: FedCM get() rejects with AbortError: signal is
aborted without reason" with no notification ever delivered to our code.
Screen/File: utils/googleWebAuth.ts — signInWithGoogleWeb() had no
timeout at all; if Google's SDK never called back (FedCM abort, script
load hang, anything), the returned promise just hung forever with no way
to recover short of reloading the page.
Fix applied: Wrapped the whole flow (script load included, not just the
prompt) in an 8-second timeout that always settles with a clear,
actionable error message. Also opted into use_fedcm_for_prompt: true
(the SDK was in an unsupported in-between state without it) and
distinguished a real user dismissal (isDismissedMoment — silent
"Sign-in cancelled") from Google never showing anything at all
(isNotDisplayed/isSkippedMoment — now a visible, actionable error
instead of silently swallowed). New googleWebAuth.test.ts (5 tests).
528 mobile tests green (523 + 5 new).

[BUG-MOB-023] | Web+Mobile (ApplicationDetailScreen) | FIXED | Opened Jul 20, 2026 — Fixed Jul 20, 2026
Symptom: User asked to "store the tailored resume for interview
preparation" — paired with applyai-backend BUG-071 (the tailored resume
text was never persisted to the Application record at all, only ever
sat on the auto-apply queue row).
Fix applied: Added tailoredResumeText to the Application type
(api.types.ts) and a new collapsible "Tailored Resume (used for this
application)" section in ApplicationDetailScreen.tsx, mirroring the
existing Cover Letter section — only rendered when present. New tests:
shows the section and its content when tailoredResumeText is set, and
confirms it's absent when not. 530 mobile tests green (528 + 2 new).
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
