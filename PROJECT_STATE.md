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
**Last Session:** Jul 11, 2026
**Overall Status:** BUG-MOB-009 (comment/post timestamps showing wrong relative time) fixed — backend-side global UTC serializer, no mobile code change (see applyai-backend BUG-059). PostDetailScreen redesigned (FEAT-UI-002) — card shadows, avatar color-hash rings, skeleton loaders, pill stat badges. BUG-MOB-010 fixed — profile avatar now opens the read-only view screen (with Edit button) instead of jumping straight into the edit form. BUG-MOB-011 fixed — all 3 Quick Apply entry points (JobDetailScreen, JobFeedScreen, SavedJobsScreen) now sync Redux so the Mock Interview job picker sees new applications immediately. FEAT-019 — JobFeedScreen bulk-queue bar gets tailor/cover-letter toggle chips; AutoApplyQueueScreen gets full select-mode + bulk remove (applyai-backend FEAT-018). 493 mobile tests passing.

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
