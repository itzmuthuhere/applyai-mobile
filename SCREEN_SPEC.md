# ApplyAI Mobile — Screen Specification
> Version: 1.1 | Last updated: Jun 6, 2026
> Every screen: purpose, route name, navigation params, state, API calls, loading/error/empty states.
> Updated every time a screen is added or its behavior changes.

---

## HOW TO READ THIS

Each screen entry has:
- **Route name** — the string constant used in navigation
- **Entry point** — how user gets here
- **State** — what data this screen owns (local) vs reads from Redux
- **API calls** — which backend endpoints are triggered and when
- **Loading state** — what the user sees while waiting
- **Error state** — what the user sees on failure
- **Empty state** — what the user sees with no data
- **Navigation out** — what taps navigate where
- **Day built** and **Status**

---

## SCREEN INDEX

| Screen | Route Name | Day | Status |
|--------|-----------|-----|--------|
| SplashScreen | `Splash` | 1 | ✅ |
| OnboardingScreen | `Onboarding` | 1 | ✅ |
| GoogleSignInScreen | `GoogleSignIn` | 2 | ✅ |
| HomeScreen | `Home` | 3 | ✅ |
| ProfileScreen | `Profile` | 3 | ✅ |
| ResumeListScreen | `ResumeList` | 4 | ✅ |
| ResumeUploadScreen | `ResumeUpload` | 4 | ✅ |
| ResumeDetailScreen | `ResumeDetail` | 5 | ✅ |
| TailorResumeScreen | `TailorResume` | 8 | ⬜ |
| CoverLetterScreen | `CoverLetter` | 8 | ⬜ |
| JobFeedScreen | `JobFeed` | 6 | ⬜ |
| JobDetailScreen | `JobDetail` | 6 | ⬜ |
| MatchScoreScreen | `MatchScore` | 7 | ⬜ |
| ApplicationsListScreen | `ApplicationsList` | 9 | ⬜ |
| ApplicationDetailScreen | `ApplicationDetail` | 9 | ⬜ |
| InterviewStartScreen | `InterviewStart` | 10 | ⬜ |
| InterviewQuestionScreen | `InterviewQuestion` | 11 | ⬜ |
| InterviewReportScreen | `InterviewReport` | 10 | ⬜ |

---

## AUTH SCREENS

---

### SplashScreen
- **Route:** `Splash`
- **Day:** 1 | **Status:** ✅ Built Jun 6, 2026
- **Entry:** App launch, always shown first
- **Purpose:** Check JWT in SecureStore → route user to correct navigator
- **State:** None (pure routing logic)
- **API calls:** None
- **Logic:**
  - Read JWT from SecureStore
  - If found → dispatch setJwt → navigate to `MainNavigator`
  - If not found → navigate to `Onboarding`
- **UI:** ApplyAI logo + loading spinner, 1.5s max
- **Navigation out:** `Onboarding` (no JWT) | `MainNavigator` (JWT found)

---

### OnboardingScreen
- **Route:** `Onboarding`
- **Day:** 1 | **Status:** ✅ Built Jun 6, 2026
- **Entry:** From Splash (no JWT)
- **Purpose:** Show app value proposition, lead to sign-in
- **State:** None
- **API calls:** None
- **UI:** 3-slide swiper — what the app does, key features, CTA "Get Started"
- **Navigation out:** `GoogleSignIn` on "Get Started"

---

### GoogleSignInScreen
- **Route:** `GoogleSignIn`
- **Day:** 2 | **Status:** ✅ Complete
- **Entry:** From Onboarding
- **Purpose:** Google OAuth → get JWT → enter app
- **Local state:**
  - `isLoading: boolean`
  - `error: string | null`
- **API calls:**
  - `POST /api/auth/google { idToken }` — on tap "Sign in with Google"
- **Loading state:** Spinner overlay, button disabled
- **Error state:** Toast / inline error message below button
- **Logic:**
  - Tap → Firebase SDK → Google account picker → Firebase ID token
  - Call backend → get JWT + user
  - SecureStore.setItem('jwt', jwt)
  - Dispatch setUser(user) + setJwt(jwt) to Redux
  - Navigate to `MainNavigator`
- **Navigation out:** `MainNavigator` on success

---

## HOME SCREENS

---

### HomeScreen
- **Route:** `Home`
- **Day:** 3 | **Status:** ✅ Built Jun 6, 2026
- **Entry:** Bottom tab (Tab 1)
- **Purpose:** Dashboard — show user summary, quick actions, stats
- **Redux reads:**
  - `auth.user` — name, subscriptionPlan
  - `resume.list` — count of resumes
  - `application.list` — count of applications, recent status
- **API calls:** None (data already in Redux from other screens)
- **UI:**
  - Welcome header: "Hi [name] 👋"
  - Subscription badge: FREE / HUNTER / PRO
  - Quick stats: X resumes | Y applications | Z interviews
  - Quick action cards: "Upload Resume", "Browse Jobs", "Practice Interview"
- **Empty state:** First-time user → show "Let's get started" onboarding tips
- **Navigation out:**
  - Quick action → navigate to respective tab

---

### ProfileScreen
- **Route:** `Profile`
- **Day:** 3 | **Status:** ✅ Built Jun 6, 2026
- **Entry:** From Home screen header avatar tap
- **Purpose:** Show full user profile + sign out
- **Redux reads:** `auth.user` (all fields)
- **API calls:** None
- **UI:**
  - Profile picture (Google)
  - Name, email, subscriptionPlan
  - Target role, location, min salary, remote preference
  - "Sign Out" button
- **Navigation out:** `AuthNavigator` on sign out

---

## RESUME SCREENS

---

### ResumeListScreen
- **Route:** `ResumeList`
- **Day:** 4 | **Status:** ⬜
- **Entry:** Bottom tab (Tab 3, default)
- **Purpose:** Show all resume versions, enter upload
- **Redux reads:** `resume.list`, `resume.isLoading`, `resume.error`
- **API calls:**
  - `GET /api/resumes` — on screen mount
- **Loading state:** Skeleton cards (3 placeholder rows)
- **Error state:** "Failed to load resumes. Retry" button
- **Empty state:** "No resumes yet. Upload your first one." + Upload button
- **UI:**
  - FlatList of ResumeCard components
  - Each card: versionName, aiScore badge, isOriginal tag, createdAt
  - FAB (floating action button): "Upload Resume"
- **Navigation out:**
  - Tap resume card → `ResumeDetail` (pass resumeId)
  - Tap FAB → `ResumeUpload`

---

### ResumeUploadScreen
- **Route:** `ResumeUpload`
- **Day:** 4 | **Status:** ⬜
- **Entry:** FAB on ResumeListScreen
- **Purpose:** Pick PDF, upload to backend, show result
- **Local state:**
  - `selectedFile: DocumentPickerAsset | null`
  - `isUploading: boolean`
  - `uploadProgress: number` (0–100)
  - `error: string | null`
- **API calls:**
  - `POST /api/resumes/upload` — multipart/form-data — on "Upload" tap
- **Loading state:** Progress bar + "Uploading..." text
- **Error state:**
  - Wrong file type → "Only PDF and DOCX allowed"
  - File too large → "File must be under 5MB"
  - Upload failed → "Upload failed. Try again."
- **Success state:** "Upload successful!" → navigate back to ResumeList
- **Navigation out:** Back to `ResumeList` on success or Cancel

---

### ResumeDetailScreen
- **Route:** `ResumeDetail`
- **Params:** `{ resumeId: number }`
- **Day:** 5 | **Status:** ⬜
- **Entry:** Tap on ResumeCard in ResumeListScreen
- **Purpose:** Show resume analysis — score, skills, strengths, improvements
- **Redux reads:** `resume.selected` (loaded by resumeId)
- **Local state:**
  - `isAnalyzing: boolean`
  - `parseResult: ParsedResume | null`
  - `scoreResult: ResumeScore | null`
- **API calls:**
  - `POST /api/ai/resume-parse { resumeId }` — on "Analyze" tap
  - `POST /api/ai/resume-score { resumeId }` — after parse completes
- **Loading state:** "Analyzing your resume with AI..." + spinner
- **Error state:** "Analysis failed. Try again."
- **UI:**
  - Score gauge: 0–100 circular progress
  - Skills chips: extracted skills
  - Strengths list (green checkmarks)
  - Improvements list (orange suggestions)
  - Action buttons: "Tailor for a Job", "View File"
- **Navigation out:**
  - "Tailor for a Job" → `TailorResume` (pass resumeId)

---

### TailorResumeScreen
- **Route:** `TailorResume`
- **Params:** `{ resumeId: number }`
- **Day:** 8 | **Status:** ⬜
- **Entry:** From ResumeDetail or JobDetail
- **Purpose:** Select a job, generate AI-tailored resume version
- **Local state:**
  - `selectedJobId: number | null`
  - `isTailoring: boolean`
  - `result: TailorResult | null`
- **Redux reads:** `job.feed` (to pick from)
- **API calls:**
  - `POST /api/resumes/tailor { resumeId, jobId }` — on "Tailor" tap
- **Loading state:** "AI is rewriting your resume for this job..." + spinner
- **Success state:** Shows changes made, new version name, "View New Version" button
- **Navigation out:** `ResumeDetail` (new resumeId) on success

---

### CoverLetterScreen
- **Route:** `CoverLetter`
- **Params:** `{ resumeId: number, jobId: number }`
- **Day:** 8 | **Status:** ⬜
- **Entry:** From JobDetail "Generate Cover Letter"
- **Purpose:** Show AI-generated cover letter for a job
- **Local state:**
  - `isGenerating: boolean`
  - `coverLetter: string | null`
  - `copied: boolean`
- **API calls:**
  - `POST /api/resumes/cover-letter { resumeId, jobId }` — on mount
- **Loading state:** "Generating cover letter..." + spinner
- **UI:** Scrollable text box with cover letter, "Copy to Clipboard" button
- **Note:** Cover letter is NOT saved to DB — for user to copy and use
- **Navigation out:** Back (user copies cover letter and goes back)

---

## JOB SCREENS

---

### JobFeedScreen
- **Route:** `JobFeed`
- **Day:** 6 | **Status:** ⬜
- **Entry:** Bottom tab (Tab 2, default)
- **Purpose:** Browse paginated job list
- **Redux reads:** `job.feed`, `job.isLoading`, `job.error`, `job.currentPage`
- **API calls:**
  - `GET /api/jobs/feed?page=0&size=20` — on mount
  - Same endpoint with page+1 — on scroll to bottom (infinite scroll)
- **Loading state:** Skeleton cards on first load; footer spinner on pagination
- **Error state:** "Failed to load jobs. Retry" button
- **Empty state:** "No jobs available yet"
- **UI:**
  - FlatList of JobCard components
  - Each card: title, company, location, salary range, matchScore badge, remote tag
  - matchScore null → "Not scored yet" grey badge
  - matchScore present → colored badge (red <50, yellow 50–74, green 75+)
- **Navigation out:** Tap JobCard → `JobDetail` (pass jobId)

---

### JobDetailScreen
- **Route:** `JobDetail`
- **Params:** `{ jobId: number }`
- **Day:** 6 | **Status:** ⬜
- **Entry:** Tap JobCard in JobFeedScreen
- **Purpose:** Full job description + action buttons
- **Redux reads:** `job.selected` (loaded by jobId)
- **API calls:**
  - `GET /api/jobs/{jobId}` — on mount
- **Loading state:** Content skeleton
- **UI:**
  - Full job title, company, location, salary, posted date
  - Scrollable job description
  - Action row: "See Match", "Tailor Resume", "Generate Cover Letter", "Apply"
- **Navigation out:**
  - "See Match" → `MatchScore` (pass jobId)
  - "Tailor Resume" → `TailorResume` (pass jobId)
  - "Generate Cover Letter" → `CoverLetter` (pass jobId)
  - "Apply" → `ApplicationDetail` (apply flow)

---

### MatchScoreScreen
- **Route:** `MatchScore`
- **Params:** `{ jobId: number }`
- **Day:** 7 | **Status:** ⬜
- **Entry:** "See Match" on JobDetail
- **Purpose:** Show AI match score between user's resume and this job
- **Local state:**
  - `selectedResumeId: number | null`
  - `isScoring: boolean`
  - `result: MatchScoreResult | null`
- **Redux reads:** `resume.list` (pick which resume to compare)
- **API calls:**
  - `POST /api/ai/match-score { resumeId, jobId }` — on "Score" tap
- **Loading state:** "Analyzing fit with AI..." + spinner
- **UI:**
  - Resume picker (dropdown if user has multiple)
  - Overall match score: big number + colored ring
  - Skills Match %: progress bar
  - Experience Match %: progress bar
  - Missing keywords: chip list (red)
  - "Cached" badge if result came from DB cache
- **Navigation out:** Back to `JobDetail`

---

## APPLICATION SCREENS

---

### ApplicationsListScreen
- **Route:** `ApplicationsList`
- **Day:** 9 | **Status:** ⬜
- **Entry:** Bottom tab (Tab 4, default)
- **Purpose:** Track all submitted applications
- **Redux reads:** `application.list`, `application.isLoading`
- **API calls:**
  - `GET /api/applications` — on mount
- **Loading state:** Skeleton rows
- **Empty state:** "No applications yet. Apply to a job to get started."
- **UI:**
  - Grouped by status: APPLIED | INTERVIEW | OFFER | REJECTED
  - Each row: company, job title, applied date, status badge
- **Navigation out:** Tap application → `ApplicationDetail` (pass applicationId)

---

### ApplicationDetailScreen
- **Route:** `ApplicationDetail`
- **Params:** `{ applicationId: number }`
- **Day:** 9 | **Status:** ⬜
- **Entry:** Tap application in ApplicationsListScreen
- **Purpose:** Full application detail + update status + start interview prep
- **Redux reads:** `application.selected`
- **API calls:**
  - `GET /api/applications/{id}` — on mount
  - `PUT /api/applications/{id}/status { status }` — on status change
- **Local state:** `isUpdating: boolean`
- **UI:**
  - Job: title, company, location
  - Resume version sent (locked — Applied Resume Vault)
  - Cover letter (if any)
  - Current status + status picker
  - "Practice Interview" button (only shown if status = INTERVIEW)
  - Notes field
- **Navigation out:**
  - "Practice Interview" → `InterviewStart` (pass applicationId)

---

## INTERVIEW SCREENS

---

### InterviewStartScreen
- **Route:** `InterviewStart`
- **Params:** `{ applicationId: number }`
- **Day:** 10 | **Status:** ⬜
- **Entry:** "Practice Interview" on ApplicationDetail
- **Purpose:** Start a mock interview session — generate questions
- **Local state:**
  - `isGenerating: boolean`
  - `session: InterviewSession | null`
- **API calls:**
  - `POST /api/interviews/start { applicationId }` — on "Start Interview" tap
- **Loading state:** "AI is preparing your interview questions..." + spinner (can take 5–10s)
- **UI:**
  - Job title + company shown
  - Interview format explanation (7 questions: 2 technical, 2 system design, 2 behavioral, 1 HR)
  - "Start Interview" button
  - After generation: list of questions shown as cards (no answers yet)
  - "Begin" button → goes to first question
- **Navigation out:** `InterviewQuestion` (pass sessionId, questionIndex=0)

---

### InterviewQuestionScreen
- **Route:** `InterviewQuestion`
- **Params:** `{ sessionId: number, questionIndex: number }`
- **Day:** 11 | **Status:** ⬜
- **Entry:** "Begin" on InterviewStart, or "Next" after each answer
- **Purpose:** Show question, record voice answer, get AI score
- **Local state:**
  - `isRecording: boolean`
  - `audioUri: string | null`
  - `isSubmitting: boolean`
  - `result: AnswerResult | null`
- **API calls:**
  - `POST /api/interviews/{sessionId}/answer` (multipart: audioFile + questionId) — on "Submit"
- **Loading state:** "Transcribing and evaluating..." + spinner (can take 10–15s)
- **UI:**
  - Question number: "Question 3 of 7"
  - Question type badge: TECHNICAL / BEHAVIORAL / etc.
  - Question text (large, readable)
  - Record button → mic animation → Stop button
  - After submit: transcript shown + score (1–10) + feedback text
  - "Next Question" button
  - If question 7 → "See Report" button
- **Navigation out:**
  - "Next Question" → `InterviewQuestion` (questionIndex+1)
  - "See Report" (after Q7) → `InterviewReport` (pass sessionId)

---

### InterviewReportScreen
- **Route:** `InterviewReport`
- **Params:** `{ sessionId: number }`
- **Day:** 10 | **Status:** ⬜
- **Entry:** After all 7 answers, or from interview history
- **Purpose:** Full session report with overall score and per-question breakdown
- **Redux reads:** `interview.currentSession`
- **API calls:**
  - `GET /api/interviews/{sessionId}` — on mount
- **Loading state:** Skeleton rows
- **UI:**
  - Overall score: large number (e.g., 7.4 / 10) + ring
  - Per-question breakdown (expandable cards):
    - Question text
    - Question type badge
    - Score: X/10
    - Your answer (transcript)
    - AI feedback
  - "Done" button → back to ApplicationDetail
- **Navigation out:** `ApplicationDetail` on "Done"

---

## CHANGE LOG

| Version | Date | Screen | Change | Reason |
|---------|------|--------|--------|--------|
| 1.0 | Jun 6, 2026 | — | Initial spec defined | Project start |
| 1.1 | Jun 6, 2026 | GoogleSignInScreen | Marked ✅ Complete | Day 2 built |
| 1.2 | Jun 6, 2026 | HomeScreen, ProfileScreen | Marked ✅ Complete | Day 3 built |

_Add a row every time a screen is added or its spec changes._
