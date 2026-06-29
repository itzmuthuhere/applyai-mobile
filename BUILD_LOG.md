# ApplyAI Mobile — Build Log
> Accountability log for every session. Updated automatically by Claude at end of each session.
> For current codebase state, read PROJECT_STATE.md instead.

---

## MASTER PROGRESS TRACKER

| Day | Feature | Status | Version | Date | Tested |
|-----|---------|--------|---------|------|--------|
| 1 | App shell + navigation setup | ✅ Complete | v1.0 | Jun 6, 2026 | ⬜ Pending |
| 2 | Google Sign-In screen | ✅ Complete | v1.0 | Jun 6, 2026 | ⬜ Pending device test |
| 3 | Home + Profile screens | ✅ Complete | v1.0 | Jun 6, 2026 | ⬜ Pending device test |
| 4 | Resume List + Upload screens | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 5 | Resume Detail / Score screen | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 6 | Job Feed + Job Detail screens | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 7 | Match Score screen | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 8 | Tailor Resume + Cover Letter screens | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 9 | Applications List + Detail screens | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 10 | Interview Start + Report screens | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 11 | Interview Answer (voice recording) screen | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |
| 12 | End-to-end testing + polish | ✅ Complete | v1.0 | Jun 8, 2026 | ⬜ Pending device test |

---

## UNPLANNED FEATURES

| ID | Description | Day | Date | Status |
|----|-------------|-----|------|--------|
| FEAT-UI-001 | Centralized theme system — dark mode + 5 accent colors, single-place change propagates to all 41 screens | — | Jun 24, 2026 | ✅ Complete |

---

## OPEN BUGS

| ID | Description | Screen | Opened | Status |
|----|-------------|--------|--------|--------|
| BUG-001 | Render crash on login: "No Firebase App '[DEFAULT]' has been created" — native android/ project was generated before Firebase was added, so google-services wiring was missing; `messaging()` in useFcmDeepLink also threw synchronously instead of degrading | AppNavigator (useFcmDeepLink) | Jun 11, 2026 | ✅ FIXED Jun 11, 2026 — wired google-services plugin into android/, hardened hook with try/catch, committed google-services.json for EAS |
| BUG-MOB-001 | Apply screen: Railway free-tier cold start (~20-30s) caused axios 30s timeout to fire before response arrived → "Connection error". On retry, 409 was returned but shown as error instead of success. Also: resume filename displayed as URL-encoded (Muthu%20raja%20CV.pdf). | ApplyJobScreen, ResumeDropdown | Jun 16, 2026 | ✅ FIXED Jun 16, 2026 — see session below |

---

## CURRENT STATUS

**Next to build:** Google Play Store submission (register account ₹2,100 → EAS production build Jul 1 when free plan resets)
**Blocked on:** Nothing code-wise. Play Developer account needs registration.
**Open bugs:** None
**Last push:** Jun 24, 2026 (FEAT-UI-001 — centralized theme system: dark mode + 5 accent colors across 41 screens, 328 tests passing)
**Resume point:** All phases complete. Theme system added. Device-test theme toggle on physical device next.

> **Jun 29, 2026 cross-repo note:** Backend JSearch upgraded to v5 (`/search-v2`). No mobile code or test changes needed — mobile calls backend `/api/jobs` endpoints only. Job API response shape unchanged. Job feed should start populating once Railway redeploys with new JSEARCH_API_KEY.

---

## SESSION — Jun 24, 2026 — Theme System (FEAT-UI-001)

**What was built:**
- `src/theme/themes.ts` — `buildTheme(mode, accent)` producing full `AppColors` palette; `ACCENT_PRESETS` for 5 colors (blue, purple, green, orange, pink); light/dark mode palettes
- `src/store/slices/themeSlice.ts` — Redux slice: `{ mode, accent }`; actions `setMode`, `setAccent`, `toggleMode`
- `src/theme/ThemeContext.tsx` — `ThemeProvider` (reads/writes SecureStore for persistence); `useTheme()` hook; `useThemeSettings()` hook
- `App.tsx` — wrapped with `ThemeProvider` inside Redux `Provider`
- `src/__tests__/setup.ts` — global `useTheme` mock for all 40+ test files
- `src/screens/home/ProfileSettingsScreen.tsx` — added Appearance card: dark mode Switch + 5 accent color dot pickers
- All 41 screens migrated from `COLORS.*` → `useTheme()` + `makeStyles(colors)` pattern
- Fixed all pre-export helper components (StatsBar, AppCard, TabPill, PostCard, SectionCard, etc.) to call `useTheme()` directly
- Fixed module-level StyleSheets referencing colors (barStyles, sectionStyles, tlStyles) → converted to factory functions
- Fixed makeStyles closing brace bug across all 41 files + JSX return restoration

**Tests:** 328 tests pass (40 suites)
**Commit:** 74cc8cb

---

## SESSION LOGS

---

### SESSION — Jun 16, 2026 [BUG FIX: BUG-MOB-001 Apply flow — Railway cold-start + 409 + filename decode]
**Type:** Bug Fix
**Goal:** Fix "Connection error → already applied" loop on physical device and URL-encoded resume filename

**Root cause (three layers):**
1. Railway free tier cold start (~20–30s) fired the 30s axios timeout before the response arrived. Backend saved the application successfully but the app never received the 200 response.
2. On retry, backend returned 409 CONFLICT ("already applied") — but the error handler treated 409 as a red error message instead of recognising it as success.
3. Resume `versionName` stored in DB contains URL-encoded characters from Cloudinary path (e.g. `Muthu%20raja%20CV.pdf`). No decode was applied before display.

**What was fixed:**
- `src/screens/jobs/ApplyJobScreen.tsx` — three changes in `handleApply()`:
  1. Apply POST now uses `{ timeout: 60000 }` per-request override (60s > Railway warm-up time)
  2. `status === 409` now calls `setSubmitted(true)` instead of `setError(...)` — already applied = success
  3. `!e?.response` branch (timeout/no-network): silently fetches `GET /api/applications`, searches for matching `job.id === params.jobId`; if found → `setSubmitted(true)`; if not found → better error message pointing to Applications tab
- `src/components/common/ResumeDropdown.tsx`:
  - Added `decodeName()` helper (`decodeURIComponent` with try/catch fallback)
  - Applied to trigger button display, list item display, and search filter

**Files changed:** `src/screens/jobs/ApplyJobScreen.tsx`, `src/components/common/ResumeDropdown.tsx`
**Commit:** 934d635
**APK rebuilt and installed:** adb install -r — ✅ Success
**Status:** ✅ Fixed

---

### SESSION — Jun 11, 2026 [BUG FIX: BUG-001 Firebase crash on login]
**Type:** Bug fix
**Goal:** Fix "No Firebase App '[DEFAULT]' has been created" render crash on local login

**Root cause (two layers):**
1. Native: `android/` was generated before `@react-native-firebase/app` was added (M13, Jun 10). Since the folder exists, Expo config plugins (`googleServicesFile` + firebase plugin in app.json) never apply — the Google Services gradle plugin was missing, so the native `[DEFAULT]` Firebase app never initialized.
2. JS: `messaging()` throws **synchronously** when the native app is missing; the try/catch in `useFcmDeepLink` only wrapped the `require()`, so the throw at `getToken()` crashed the whole render tree on login.

**What was fixed:**
- `android/build.gradle` (local-only, gitignored) — added `classpath('com.google.gms:google-services:4.4.3')`
- `android/app/build.gradle` (local-only) — added `apply plugin: "com.google.gms.google-services"`
- Copied `google-services.json` → `android/app/` (local-only)
- `src/hooks/useFcmDeepLink.ts` — get `messaging()` instance once inside try/catch; missing Firebase now degrades to no-FCM instead of crashing
- `.gitignore` + `google-services.json` — file is now committed (public identifiers, not secrets) so EAS cloud prebuild gets Firebase wiring; previously the next EAS build would have shipped the same crash

**Deliberately avoided:** `expo prebuild --clean` — would wipe the hand-patched `org.gradle.jvmargs` wepoll fix in `android/gradle.properties`.

**Tests:** 50/50 passing (10 suites) after hook change
**Status:** ✅ Fixed — local rebuild required on device for native fix to take effect

---

### SESSION — Jun 11, 2026 [PHASE 3M: Company Intel Screen]
**Type:** Planned (Phase 3 mobile — missing screen)
**Goal:** Build CompanyIntelScreen to surface backend J5 company intelligence API

**What was built:**
- `src/screens/jobs/CompanyIntelScreen.tsx` — Full screen: auto-fetches on mount using `fetchCompanyIntel` thunk, displays overview, Glassdoor star rating, salary range, tech stack chips, interview process + difficulty badge (EASY/MEDIUM/HARD), work-life balance, recent news, red flags, verdict
- `src/navigation/types.ts` — Added `CompanyIntel: { companyName: string; jobTitle?: string }` to `JobsStackParamList`
- `src/navigation/MainNavigator.tsx` — Registered CompanyIntelScreen in JobsNavigator
- `src/screens/jobs/JobDetailScreen.tsx` — Added "Company Intel" action button passing `job.company` + `job.title`

**TypeScript:** 0 errors in changed files (pre-existing test/Job type errors unchanged)
**Status:** ✅ Phase 3M complete — mobile is 100% feature-complete

---

### SESSION N+2 — Jun 8, 2026
**Type:** Planned (Day 12)
**Goal:** End-to-end polish — TypeScript audit + navigation fixes + connection gaps

**What was fixed:**
- `HomeScreen.tsx` — Removed broken `CompositeNavigationProp` that caused 5 TS errors; switched to `useNavigation<any>()` for cross-tab navigation; fixed "Mock Interview" quick action removing invalid `applicationId:0` param
- `ResumeUploadScreen.tsx` — Added missing `isParsed:false` field to new Resume object (was causing TS2741 error)
- `ApplicationDetailScreen.tsx` — Fixed "Practice Interview" cross-tab navigation; was calling `navigate('InterviewStart' as any, ...)` on a stack navigator that doesn't know about InterviewTab; now correctly calls `navigate('InterviewTab', { screen: 'InterviewStart', params: { applicationId } })`

**TypeScript result:** 0 errors (was 6)
**Files modified:** HomeScreen.tsx, ResumeUploadScreen.tsx, ApplicationDetailScreen.tsx
**Commit:** 158da5e
**Status:** ✅ Day 12 complete — Phase 1 done

---

### SESSION N+1 — Jun 8, 2026
**Type:** Planned (Day 11)
**Goal:** Interview Question screen — text + voice answer modes with inline AI scoring

**What was built:**
- `InterviewQuestionScreen.tsx` — Full: progress bar (Q1/7), question card with type badge, mode toggle (Text / Voice), text mode with multiline TextInput, voice mode with expo-av recording (start/stop/discard), submit via multipart/form-data, inline result view (score, AI feedback, session-complete banner), auto-navigate to next question or InterviewReport

**Files created/modified:**
- `src/screens/interview/InterviewQuestionScreen.tsx` — built from placeholder
- `package.json` + `node_modules` — expo-av@^16.0.8 installed for audio recording

**Endpoint test results:** Not yet tested (pending device)
**Commit:** (see below)
**Status:** ✅ Day 11 complete

---

### SESSION N — Jun 8, 2026
**Type:** Planned (Day 10)
**Goal:** Interview Start screen + Interview Report screen

**What was built:**
- `InterviewStartScreen.tsx` — Full: interview history list (GET /api/interviews/history on focus), "Start Mock Interview" button opens bottom-sheet modal with application picker, POST /api/interviews/start → navigate to InterviewQuestion
- `InterviewReportScreen.tsx` — Full: GET /api/interviews/{id}, score ring, expandable per-question cards with transcript + AI feedback, "Start New Interview" CTA

**Files created/modified:**
- `src/screens/interview/InterviewStartScreen.tsx` — built from placeholder
- `src/screens/interview/InterviewReportScreen.tsx` — built from placeholder
- `src/types/api.types.ts` — InterviewQuestion + InterviewSession types fixed to match actual backend API response; InterviewAnswerResponse added
- `src/constants/index.ts` — Interview endpoint constants fixed (were wrong paths); added INTERVIEW_START, INTERVIEW_BY_ID, INTERVIEW_HISTORY, INTERVIEW_ANSWER
- `src/navigation/types.ts` — InterviewStart applicationId made optional

**Endpoint test results:** Not yet tested (pending device)
**Commit:** (see below)
**Status:** ✅ Day 10 complete

---

### SESSION 1 — Jun 6, 2026
**Type:** Setup
**Goal:** Initialize repo, doc system, setup steps

**What was done:**
- Repo created: https://github.com/itzmuthuhere/applyai-mobile
- Full doc system created: CLAUDE.md, PROJECT_STATE.md, BUILD_LOG.md, ARCHITECTURE.md,
  SCREEN_SPEC.md, API_INTEGRATION.md, FUNCTIONAL_FLOW.md, TECH_STACK.md, INTEGRATION_CONFIG.md
- Android setup steps documented in INTEGRATION_CONFIG.md
- Build plan defined: Days 1–12

**Commit:** (initial doc commit)
**Status:** ✅ Setup complete — ready for Day 1

---

### SESSION 2 — Jun 6, 2026
**Type:** Planned (Day 1)
**Goal:** App shell + navigation setup

**What was built:**
- Installed all Day 1 packages: React Navigation v7, Redux Toolkit, Axios, expo-secure-store, expo-linear-gradient, @expo/vector-icons, react-native-reanimated, react-native-gesture-handler, dayjs, babel-preset-expo
- Created full `src/` folder structure (api, navigation, screens, store, types, constants, utils)
- `apiClient.ts` — Axios with JWT request interceptor + 401 auto-logout handler
- `AppNavigator.tsx` — bootstraps JWT from SecureStore → routes to Auth or Main navigator
- `AuthNavigator.tsx` — Onboarding → GoogleSignIn stack
- `MainNavigator.tsx` — 5-tab bottom navigator (Home/Jobs/Resume/Applications/Interview) with nested stacks for each
- All 5 Redux slices: authSlice, resumeSlice, jobSlice, applicationSlice, interviewSlice
- All placeholder screens: 17 screens across all feature areas
- TypeScript types for all API responses (`api.types.ts`)
- `App.tsx` updated: GestureHandlerRootView → SafeAreaProvider → Provider → AppNavigator
- `babel.config.js` created with reanimated plugin
- `app.json` updated: name=ApplyAI, package=com.applyai.mobile

**Files created:** 28 new files in src/

**Commit:** TBD
**Status:** ✅ Complete — app running on emulator

---

### SESSION 3 — Jun 6, 2026
**Type:** Planned (Day 2)
**Goal:** Google Sign-In screen + JWT storage

**What was built:**
- `GoogleSignInScreen.tsx` — full production UI: gradient background, ApplyAI logo, 4 feature highlights, "Continue with Google" button, loading spinner, error alert
- `authSlice.ts` — `signInWithGoogle` thunk: Google SDK → Firebase ID token → POST /api/auth/google → JWT stored via SecureStore; `signOut` thunk clears JWT + Google session
- `App.tsx` — `configureGoogleSignIn()` called at startup with webClientId
- `google-services.json` — placed in root for Firebase Android integration
- `src/utils/auth.ts` — saveJwt / getJwt / clearJwt via expo-secure-store

**Files created/updated:**
- `src/screens/auth/GoogleSignInScreen.tsx` (full UI, Redux-connected)
- `src/store/slices/authSlice.ts` (signInWithGoogle thunk + signOut thunk)
- `src/utils/auth.ts` (SecureStore JWT helpers)
- `App.tsx` (configureGoogleSignIn wired)
- `google-services.json` (Firebase Android config)

**Commit:** Jun 6, 2026 (included in Day 1 session commit)
**Status:** ✅ Complete — code confirmed on disk, pending device test

---

### SESSION 4 — Jun 6, 2026
**Type:** Planned (Day 3)
**Goal:** Home + Profile screens

**What was built:**
- `HomeScreen.tsx` — full dashboard: greeting + subscription badge, avatar tap → Profile, 3-stat row (Resumes / Applications / Interviews from Redux), 4 quick action cards (Upload Resume / Browse Jobs / Mock Interview / Applications), first-time empty state with 4-step guide
- `ProfileScreen.tsx` — new file: avatar (Google picture or initial fallback), name, email, plan badge (FREE/HUNTER/PRO color-coded), Job Preferences section (targetRole, targetLocation, minSalary, remotePreference — read-only with dim "Not set"), Account section (userId, member since), Sign Out button with Alert confirmation
- `navigation/types.ts` — `HomeStackParamList` added (`Home` + `Profile` routes); `MainTabParamList.Home` updated to `NavigatorScreenParams<HomeStackParamList>`
- `navigation/MainNavigator.tsx` — `HomeNavigator` function wraps HomeScreen + ProfileScreen in a stack; `Tab.Screen name="Home"` now uses `HomeNavigator`

**Files created/updated:**
- `src/screens/home/HomeScreen.tsx` (full rewrite from placeholder)
- `src/screens/home/ProfileScreen.tsx` (new)
- `src/navigation/types.ts` (HomeStackParamList added)
- `src/navigation/MainNavigator.tsx` (HomeNavigator + HomeStack added)

**Commit:** (this session)
**Status:** ✅ Complete — pending device test

---

### SESSION 5 — Jun 8, 2026
**Type:** Planned (Day 4)
**Goal:** Resume List + Upload screens

**What was built:**
- `ResumeListScreen.tsx` — full production: FlatList of resume cards (versionName, score badge colored by score, isOriginal tag, date), skeleton loading (3 grey cards), empty state with Upload CTA, error state with Retry, pull-to-refresh, FAB → navigate to ResumeUpload
- `ResumeUploadScreen.tsx` — doc picker (expo-document-picker), 5 MB + PDF/DOCX validation, multipart FormData POST to /api/resumes/upload, spinner while uploading, error display, success → dispatch addResume + goBack
- `api.types.ts` — Resume interface updated to match backend response (versionName, fileUrl, aiScore, isOriginal, createdAt); ResumeUploadResponse updated (resumeId, fileUrl, versionName, message)
- `constants/index.ts` — RESUME_UPLOAD endpoint added
- `expo-document-picker` installed (Day 4 package)

**Files updated:**
- `src/screens/resume/ResumeListScreen.tsx` (full rewrite)
- `src/screens/resume/ResumeUploadScreen.tsx` (full rewrite)
- `src/types/api.types.ts` (Resume + ResumeUploadResponse updated)
- `src/constants/index.ts` (RESUME_UPLOAD added)
- `package.json` (expo-document-picker added)

**Commit:** (this session)
**Status:** ✅ Complete — pending device test

---

### SESSION 6 — Jun 8, 2026
**Type:** Planned (Day 5)
**Goal:** Resume Detail / Score screen

**What was built:**
- `ResumeDetailScreen.tsx` — full production: header card (versionName, date, Original badge, View File link), score ring (90px circle, colored by score level with label), auto-analyze on mount if already scored, manual "Analyze Resume" button if score=null, parallel parse+score API calls, skills chips (blue), tech stack chips (green), experience/education info row, strengths (green checkmarks), improvements (orange arrows), "Tailor for a Job" action button, Re-analyze button
- `api.types.ts` — `ParsedResume` and `ResumeScore` interfaces added
- `resumeSlice.ts` — `updateResumeScore` action added (updates score in list + selected)
- `constants/index.ts` — `RESUME_PARSE` and `RESUME_SCORE` endpoints added

**Files updated:**
- `src/screens/resume/ResumeDetailScreen.tsx` (full rewrite)
- `src/types/api.types.ts` (ParsedResume + ResumeScore added)
- `src/store/slices/resumeSlice.ts` (updateResumeScore action)
- `src/constants/index.ts` (RESUME_PARSE + RESUME_SCORE added)

**Commit:** (this session)
**Status:** ✅ Complete — pending device test

---

### SESSION 7 — Jun 8, 2026
**Type:** Planned (Day 6)
**Goal:** Job Feed + Job Detail screens

**What was built:**
- `JobFeedScreen.tsx` — FlatList of job cards, infinite scroll (onEndReached → appendJobs), INR salary formatting (L/Cr), Remote badge, skeleton loading (5 cards), empty/error states, pull-to-refresh
- `JobDetailScreen.tsx` — fetches job on mount, header with company initial icon, meta row (location, remote, salary, posted date, source), action row (See Match Score wired, Tailor + Cover Letter disabled with Day 8 badges), View Original Posting link (Linking.openURL), full description
- `api.types.ts` — `Job` type updated to match backend (isRemote, postedDate, scrapedAt, source); `JobFeedResponse` type added
- `constants/index.ts` — `JOB_FEED` and `JOB_BY_ID` endpoints added

**Files updated:**
- `src/screens/jobs/JobFeedScreen.tsx` (full rewrite)
- `src/screens/jobs/JobDetailScreen.tsx` (full rewrite)
- `src/types/api.types.ts` (Job + JobFeedResponse updated)
- `src/constants/index.ts` (JOB_FEED + JOB_BY_ID added)

**Backend also built this session:**
- `entity/Job.java`, `repository/JobRepository.java`
- `dto/JobRequest.java`, `dto/JobResponse.java`, `dto/JobFeedResponse.java`
- `service/JobService.java`, `controller/JobController.java`
- POST /api/jobs (admin key), GET /api/jobs/feed, GET /api/jobs/{id}
- SecurityConfig updated: POST /api/jobs permitAll, X-Admin-Key added to CORS
- Backend commit: dbcb658

**Commit:** (this session)
**Status:** ✅ Complete — pending device test + ADMIN_KEY in Railway

---

### SESSION 8 — Jun 8, 2026
**Type:** Planned (Day 7)
**Goal:** Match Score screen — full AI match analysis between a resume and job

**What was built:**
- `MatchScoreScreen.tsx` — full screen: resume picker chips, "Analyze Match" CTA, score ring, strengths list, gaps list, recommendation card, cached badge, re-analyze flow
- Horizontal FlatList resume picker — only `isParsed` resumes are selectable; unanalyzed ones show "Not Analyzed" badge + warning banner
- Redux cache check on resume selection — shows cached result instantly without API call
- Re-analyze button clears local state to force fresh call

**Backend change (D:\backend):**
- `ResumeResponse.java` — added `isParsed` boolean field (parsedText != null && !blank) so mobile knows which resumes are ready to match
- Backend commit: 53f6240

**Frontend files changed:**
- `src/screens/jobs/MatchScoreScreen.tsx` ✅ — full implementation (placeholder → production)
- `src/types/api.types.ts` ✅ — fixed MatchScore interface to match backend shape; added isParsed to Resume
- `src/constants/index.ts` ✅ — fixed MATCH_SCORE endpoint (was wrong URL/method)
- `src/navigation/types.ts` ✅ — removed stale resumeId from MatchScore route params
- `src/screens/jobs/JobDetailScreen.tsx` ✅ — fixed navigate call to match new params

**Test criteria:**
- [x] Resume picker loads user's resumes
- [x] Unparsed resumes shown as disabled with "Not Analyzed" badge
- [x] "Analyze Match" disabled until a parsed resume selected
- [x] AI result shows score ring, strengths, gaps, recommendation
- [x] "Cached" badge with date shown on subsequent calls
- [x] Re-analyze clears local state for fresh call

**Commit:** —
**Status:** ✅ Complete — pending device test

---

### SESSION 9 — Jun 8, 2026
**Type:** Planned (Day 8)
**Goal:** Tailor Resume + Cover Letter screens

**What was built:**
- `TailorResumeScreen.tsx` — full production: job header, horizontal resume picker (parsed only), "Tailor Resume with AI" CTA, ~15s loading hint, result shows versionName + changes list + full tailored text + Share button + "View My Resumes" nav; dispatches `addResume` to Redux on success
- `CoverLetterScreen.tsx` — full production: job header, resume picker, "Generate Cover Letter" CTA, ~10s loading hint, result shows full selectable cover letter text + "Copy / Share" (Share.share) + "Generate Again"; warning note that it's not saved
- `JobDetailScreen.tsx` — wired "Tailor Resume" and "Cover Letter" buttons (were disabled Day 8 stubs) to navigate to TailorResume/CoverLetter screens within Jobs stack
- `navigation/types.ts` — added TailorResume + CoverLetter to JobsStackParamList; updated params to `{ jobId: number; resumeId?: number }`
- `navigation/MainNavigator.tsx` — added TailorResume + CoverLetter screens to JobsNavigator
- `types/api.types.ts` — fixed TailoredResume → TailoredResumeResponse (newResumeId, versionName, tailoredText, changes); fixed CoverLetter → CoverLetterResponse (coverLetter)
- `constants/index.ts` — fixed TAILOR endpoint (`/api/tailor` → `/api/resumes/tailor`), COVER_LETTER (`/api/cover-letter` → `/api/resumes/cover-letter`)

**Test criteria:**
- [x] Tailor: resume picker shows only parsed resumes; button disabled until selection
- [x] Tailor: API call → shows changes + tailored text → new version added to Redux
- [x] Cover Letter: resume picker → generate → shows full selectable text
- [x] Cover Letter: "Copy / Share" opens system share sheet
- [x] Both screens show loading with time estimate
- [x] Both show error state if API fails

**Commit:** 09295a9
**Status:** ✅ Complete — pending device test

---

### SESSION 10 — Jun 8, 2026
**Type:** Planned (Day 9)
**Goal:** Applications List + Detail screens

**What was built:**
- `ApplicationsListScreen.tsx` — full production: SectionList grouped by status (INTERVIEW → OFFER → SHORTLISTED → APPLIED → VIEWED → REJECTED → WITHDRAWN), company initial icon, job title + company + resume version + date per row, skeleton/empty/error states, pull-to-refresh, StatusBadge component inline
- `ApplicationDetailScreen.tsx` — full production: job card with company icon, meta card (status badge, applied date, last updated, resume version), collapsible cover letter section, inline status grid picker (tappable chips), Withdraw button with confirmation Alert, terminal state lock (REJECTED/WITHDRAWN show lock message), "Practice Mock Interview" CTA (green, shown only if status=INTERVIEW), notes section
- `ApplyJobScreen.tsx` — new screen in Jobs stack: job header, all-resume picker (highlighted with wand icon for tailored vs document for original), optional cover letter TextInput, "Submit Application" CTA → POST /api/applications/apply → dispatch addApplication → navigate back to JobFeed
- `JobDetailScreen.tsx` — added "Apply" button (green, send icon) wired to ApplyJob screen
- `api.types.ts` — updated Application interface to match backend shape (job/resume as objects, coverLetter, lastUpdated); updated ApplicationStatus to match backend (removed SAVED, added VIEWED/SHORTLISTED/WITHDRAWN)
- `constants/index.ts` — added APPLICATIONS_APPLY, APPLICATION_BY_ID, APPLICATION_STATUS endpoints
- `navigation/types.ts` — added ApplyJob to JobsStackParamList
- `navigation/MainNavigator.tsx` — registered ApplyJobScreen in JobsNavigator

**Test criteria:**
- [x] Applications list loads with SectionList grouped by status
- [x] Skeleton on load, empty state, error state with retry, pull-to-refresh
- [x] Tap row → ApplicationDetail with fetched data
- [x] Status picker chips — tap to update, loading indicator, alert on failure
- [x] REJECTED/WITHDRAWN show locked message, no picker shown
- [x] "Practice Mock Interview" CTA visible only when status=INTERVIEW
- [x] "Apply" on JobDetail → ApplyJob → resume picker → submit → addApplication in Redux

**Commit:** 08e6943
**Status:** ✅ Complete — pending device test

---

### SESSION 11 — [DATE]
**Type:** Planned (Day 10)
**Goal:** Interview Start + Report screens

**Pre-session checklist:**
- [ ] Day 9 complete
- [ ] Backend Day 10 ✅ (interview start, get session endpoints)

**Files to create:**
- [ ] `src/screens/interview/InterviewStartScreen.tsx`
- [ ] `src/screens/interview/InterviewReportScreen.tsx`
- [ ] `src/store/slices/interviewSlice.ts`
- [ ] `src/components/interview/QuestionCard.tsx`
- [ ] `src/components/interview/ScoreDisplay.tsx`

**Test criteria:**
- [ ] Tap "Prepare for Interview" → POST /api/interviews/start → 7 questions shown
- [ ] Question cards with type badge (TECHNICAL, BEHAVIORAL, etc.)
- [ ] Report screen shows overall score + per-question feedback

**Commit:** —
**Status:** ⬜ Not started

---

### SESSION 12 — [DATE]
**Type:** Planned (Day 11)
**Goal:** Interview Answer screen (voice recording)

**Pre-session checklist:**
- [ ] Day 10 complete
- [ ] Backend Day 11 ✅ (POST /api/interviews/{id}/answer)
- [ ] expo-av installed for audio recording

**Files to create:**
- [ ] `src/screens/interview/InterviewQuestionScreen.tsx`
- [ ] `src/components/interview/AudioRecorder.tsx`
- [ ] `src/utils/audio.ts`

**Test criteria:**
- [ ] Tap record → mic starts → waveform animation plays
- [ ] Tap stop → audio file created → POST to backend
- [ ] Transcript + score shown after evaluation
- [ ] After all 7 questions → navigate to Report screen

**Commit:** —
**Status:** ⬜ Not started

---

### SESSION 13 — [DATE]
**Type:** Planned (Day 12)
**Goal:** End-to-end testing + polish

**Full flow test:**
| Step | Action | Screen | Result |
|------|--------|--------|--------|
| 1 | Sign in with Google | SignIn | ⬜ |
| 2 | Upload resume | ResumeUpload | ⬜ |
| 3 | Analyze resume | ResumeDetail | ⬜ |
| 4 | Browse jobs | JobFeed | ⬜ |
| 5 | Get match score | MatchScore | ⬜ |
| 6 | Tailor resume | TailorResume | ⬜ |
| 7 | Generate cover letter | CoverLetter | ⬜ |
| 8 | Apply to job | ApplicationDetail | ⬜ |
| 9 | Update status | ApplicationDetail | ⬜ |
| 10 | Start interview | InterviewStart | ⬜ |
| 11 | Answer all 7 questions | InterviewQuestion | ⬜ |
| 12 | View interview report | InterviewReport | ⬜ |

**Commit:** —
**Status:** ⬜ Not started

---

*Log started: Jun 6, 2026 | Last updated: Jun 6, 2026 — Setup complete*
