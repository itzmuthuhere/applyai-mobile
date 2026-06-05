# ApplyAI Mobile — Architecture Document
> Version: 1.0 | Last updated: Jun 6, 2026
> Updated whenever navigation structure, Redux store, or component hierarchy changes.

---

## TECH OVERVIEW

```
┌─────────────────────────────────────────────┐
│    React Native 0.85.3 (Expo SDK 56)         │
│    TypeScript 6 | React 19                   │
└──────────────────┬──────────────────────────┘
                   │
     ┌─────────────▼──────────────┐
     │   React Navigation v7       │
     │   Stack + Bottom Tabs       │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │    Redux Toolkit            │
     │    Global state management  │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │    Axios (apiClient.ts)     │
     │    JWT interceptor          │
     └─────────────┬──────────────┘
                   │ HTTPS REST
     ┌─────────────▼──────────────┐
     │  Spring Boot Backend        │
     │  Railway.app                │
     └─────────────────────────────┘
```

---

## NAVIGATION STRUCTURE

```
AppNavigator (Root Stack)
│
├── [No JWT stored] → AuthNavigator (Stack)
│   ├── SplashScreen
│   ├── OnboardingScreen
│   └── GoogleSignInScreen
│
└── [JWT in SecureStore] → MainNavigator (Bottom Tab)
    │
    ├── Tab 1: Home
    │   └── HomeScreen
    │
    ├── Tab 2: Jobs (Stack)
    │   ├── JobFeedScreen          ← default
    │   ├── JobDetailScreen        ← push on tap
    │   └── MatchScoreScreen       ← push on "See Match"
    │
    ├── Tab 3: Resume (Stack)
    │   ├── ResumeListScreen       ← default
    │   ├── ResumeUploadScreen     ← push on "Upload"
    │   ├── ResumeDetailScreen     ← push on resume tap
    │   ├── TailorResumeScreen     ← push on "Tailor"
    │   └── CoverLetterScreen      ← push on "Cover Letter"
    │
    ├── Tab 4: Applications (Stack)
    │   ├── ApplicationsListScreen ← default
    │   └── ApplicationDetailScreen← push on application tap
    │
    └── Tab 5: Interview (Stack)
        ├── InterviewStartScreen   ← entry (from Application Detail)
        ├── InterviewQuestionScreen← push, cycles through 7 questions
        └── InterviewReportScreen  ← push after all answers
```

_Update this tree every time a screen is added, removed, or renamed._

---

## REDUX STORE SHAPE

```typescript
{
  auth: {
    jwt: string | null,
    user: {
      id: number,
      name: string,
      email: string,
      subscriptionPlan: 'FREE' | 'HUNTER' | 'PRO',
      targetRole: string | null,
      targetLocation: string | null,
      minSalary: number | null,
      remotePreference: 'REMOTE' | 'HYBRID' | 'ONSITE' | 'ANY' | null,
      profilePicture: string | null,
      createdAt: string
    } | null,
    isLoading: boolean,
    error: string | null
  },

  resume: {
    list: Resume[],
    selected: Resume | null,
    isUploading: boolean,
    isAnalyzing: boolean,
    error: string | null
  },

  job: {
    feed: Job[],
    selected: Job | null,
    currentPage: number,
    totalElements: number,
    matchScores: Record<string, MatchScore>,  // key = "resumeId_jobId"
    isLoading: boolean,
    error: string | null
  },

  application: {
    list: Application[],
    selected: Application | null,
    isLoading: boolean,
    error: string | null
  },

  interview: {
    currentSession: InterviewSession | null,
    history: InterviewSession[],
    isLoading: boolean,
    error: string | null
  }
}
```

_Update this shape every time a slice is added or modified._

---

## FILE STRUCTURE

```
D:\applyai-mobile\
├── app.json                        ← Expo config
├── package.json
├── tsconfig.json
├── .env                            ← EXPO_PUBLIC_* vars (not committed)
├── .env.example                    ← committed template
├── google-services.json            ← Firebase Android config (not committed)
│
└── src/
    ├── api/
    │   └── apiClient.ts            ← Axios instance, JWT interceptor, base URL
    │
    ├── components/
    │   ├── common/
    │   │   ├── Header.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   ├── ErrorMessage.tsx
    │   │   └── EmptyState.tsx
    │   ├── resume/
    │   │   ├── ResumeCard.tsx
    │   │   ├── ScoreGauge.tsx
    │   │   └── SkillChips.tsx
    │   ├── jobs/
    │   │   ├── JobCard.tsx
    │   │   ├── SkillGapList.tsx
    │   │   └── ScoreBreakdownBar.tsx
    │   ├── applications/
    │   │   ├── StatusBadge.tsx
    │   │   └── StatusPicker.tsx
    │   └── interview/
    │       ├── QuestionCard.tsx
    │       ├── AudioRecorder.tsx
    │       └── ScoreDisplay.tsx
    │
    ├── navigation/
    │   ├── AppNavigator.tsx        ← Root: auth check → route to Auth or Main
    │   ├── AuthNavigator.tsx
    │   ├── MainNavigator.tsx       ← Bottom tabs
    │   └── types.ts                ← Navigation param types
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── SplashScreen.tsx
    │   │   ├── OnboardingScreen.tsx
    │   │   └── GoogleSignInScreen.tsx
    │   ├── home/
    │   │   └── HomeScreen.tsx
    │   ├── profile/
    │   │   └── ProfileScreen.tsx
    │   ├── resume/
    │   │   ├── ResumeListScreen.tsx
    │   │   ├── ResumeUploadScreen.tsx
    │   │   ├── ResumeDetailScreen.tsx
    │   │   ├── TailorResumeScreen.tsx
    │   │   └── CoverLetterScreen.tsx
    │   ├── jobs/
    │   │   ├── JobFeedScreen.tsx
    │   │   ├── JobDetailScreen.tsx
    │   │   └── MatchScoreScreen.tsx
    │   ├── applications/
    │   │   ├── ApplicationsListScreen.tsx
    │   │   └── ApplicationDetailScreen.tsx
    │   └── interview/
    │       ├── InterviewStartScreen.tsx
    │       ├── InterviewQuestionScreen.tsx
    │       └── InterviewReportScreen.tsx
    │
    ├── store/
    │   ├── index.ts                ← configureStore
    │   └── slices/
    │       ├── authSlice.ts
    │       ├── resumeSlice.ts
    │       ├── jobSlice.ts
    │       ├── applicationSlice.ts
    │       └── interviewSlice.ts
    │
    ├── types/
    │   └── api.types.ts            ← TypeScript interfaces for every API response
    │
    ├── constants/
    │   └── index.ts                ← Route names, string labels, config constants
    │
    └── utils/
        ├── auth.ts                 ← SecureStore JWT read/write/clear
        └── audio.ts               ← expo-av recording helpers
```

---

## API CLIENT PATTERN

All HTTP calls flow through `src/api/apiClient.ts`:

```typescript
// Pattern every screen follows:
import apiClient from '../api/apiClient';

// apiClient already has:
// - baseURL = EXPO_PUBLIC_API_URL
// - request interceptor: adds Authorization: Bearer <jwt>
// - response interceptor: on 401 → clear token → navigate to Login

const response = await apiClient.post('/api/auth/google', { idToken });
```

No screen ever calls `fetch()` or `axios.create()` directly.

---

## STATE MANAGEMENT PATTERN

```
User action (tap/input)
  → Screen dispatches Redux action (thunk)
    → Thunk calls apiClient
      → On success: dispatch fulfilled → update store → UI re-renders
      → On error: dispatch rejected → set error state → show error UI
```

Every slice has: `isLoading`, `error`, and the data field.
Every screen reads: data from selector, isLoading for spinner, error for error UI.

---

## AUTH FLOW (JWT LIFECYCLE)

```
App start
  → SecureStore.getItem('jwt')
  → Found → set in Redux + Axios header → go to MainNavigator
  → Not found → go to AuthNavigator

Google Sign-In success
  → Backend returns JWT
  → SecureStore.setItem('jwt', token)
  → Redux authSlice.user = user
  → Navigate to MainNavigator

401 from any API call
  → Axios response interceptor fires
  → SecureStore.removeItem('jwt')
  → Redux authSlice reset
  → Navigate to AuthNavigator (auto-logout)

Sign Out (user taps)
  → SecureStore.removeItem('jwt')
  → Redux authSlice reset
  → Navigate to AuthNavigator
```

---

## ARCHITECTURE DECISION RECORDS (ADRs)

### ADR-F001 — Expo over bare React Native
- **Date:** Jun 2026 | **Status:** Active
- **Decision:** Use Expo managed workflow. Faster setup, OTA updates, no Xcode/Gradle knowledge needed for Day 1.
- **Consequences:** Some native modules require ejecting. Acceptable for Phase 1.
- **Trigger to eject:** A required library isn't Expo-compatible.

### ADR-F002 — Redux Toolkit over Context API
- **Date:** Jun 2026 | **Status:** Active
- **Decision:** Redux Toolkit for all global state (auth, resume, jobs, applications, interview).
- **Reason:** Predictable state, DevTools for debugging, async thunks handle API loading states cleanly.
- **Alternative rejected:** Context API — too verbose for this many features, no middleware.

### ADR-F003 — Axios over fetch
- **Date:** Jun 2026 | **Status:** Active
- **Decision:** Axios with request/response interceptors.
- **Reason:** Single place to inject JWT and handle 401 auto-logout. fetch() requires this to be replicated in every call.

### ADR-F004 — SecureStore over AsyncStorage for JWT
- **Date:** Jun 2026 | **Status:** Active
- **Decision:** `expo-secure-store` for JWT storage.
- **Reason:** JWT is a credential. AsyncStorage is unencrypted. SecureStore uses device keychain/keystore.
- **Alternative rejected:** AsyncStorage — not secure for tokens.

### ADR-F005 — TypeScript mandatory
- **Date:** Jun 2026 | **Status:** Active
- **Decision:** TypeScript for all files. All API responses have typed interfaces in `api.types.ts`.
- **Reason:** Backend API changes will be caught at compile time, not runtime.

---

## CHANGE LOG

| Version | Date | Change | Reason |
|---------|------|--------|--------|
| 1.0 | Jun 6, 2026 | Initial architecture defined | Project start |

_Add a row every time architecture changes._
