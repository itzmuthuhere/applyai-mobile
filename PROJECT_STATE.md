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

**Phase:** 1 — Core Screens (Days 1–12)
**Active Day:** Day 1 — Project Setup + Navigation Shell
**Last Session:** Jun 6, 2026
**Overall Status:** Not started — repo initialized, docs created

---

## SCREEN STATUS

| Screen | Day | Status | Version | Tested |
|--------|-----|--------|---------|--------|
| App shell + navigation setup | 1 | ⬜ Not started | — | — |
| Splash / Onboarding screen | 1 | ⬜ Not started | — | — |
| Google Sign-In screen | 2 | ⬜ Not started | — | — |
| Home / Dashboard screen | 3 | ⬜ Not started | — | — |
| Resume List screen | 4 | ⬜ Not started | — | — |
| Resume Upload screen | 4 | ⬜ Not started | — | — |
| Resume Detail / Score screen | 5 | ⬜ Not started | — | — |
| Job Feed screen | 6 | ⬜ Not started | — | — |
| Job Detail screen | 6 | ⬜ Not started | — | — |
| Match Score screen | 7 | ⬜ Not started | — | — |
| Tailor Resume screen | 8 | ⬜ Not started | — | — |
| Cover Letter screen | 8 | ⬜ Not started | — | — |
| Applications List screen | 9 | ⬜ Not started | — | — |
| Application Detail screen | 9 | ⬜ Not started | — | — |
| Interview Start screen | 10 | ⬜ Not started | — | — |
| Interview Question screen | 11 | ⬜ Not started | — | — |
| Interview Report screen | 10 | ⬜ Not started | — | — |
| Profile / Settings screen | 3 | ⬜ Not started | — | — |

---

## FILES THAT EXIST

### Root
- `package.json` ⬜ (after npm init)
- `app.json` ⬜ (after expo init)
- `.env` ⬜ (after setup)
- `tsconfig.json` ⬜

### Source Structure (planned)
```
src/
├── api/
│   └── apiClient.ts          ← Axios instance + JWT interceptor
├── components/               ← Shared reusable components
├── navigation/
│   └── AppNavigator.tsx      ← Root navigator
├── screens/
│   ├── auth/
│   ├── home/
│   ├── resume/
│   ├── jobs/
│   ├── applications/
│   └── interview/
├── store/
│   ├── index.ts              ← Redux store
│   └── slices/               ← Feature slices
├── types/
│   └── api.types.ts          ← TypeScript interfaces for all API responses
├── constants/
│   └── index.ts              ← Routes, strings, config
└── utils/
    └── auth.ts               ← Token storage helpers
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
    │   └── HomeScreen (Dashboard)
    ├── Tab: Jobs
    │   ├── JobFeedScreen
    │   ├── JobDetailScreen
    │   └── MatchScoreScreen
    ├── Tab: Resume
    │   ├── ResumeListScreen
    │   ├── ResumeUploadScreen
    │   ├── ResumeDetailScreen
    │   ├── TailorResumeScreen
    │   └── CoverLetterScreen
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

_None currently._

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

*Last updated: Jun 6, 2026 — v1.0: Doc system initialized, repo created*
