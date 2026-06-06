# ApplyAI Mobile — Functional Flow (UI Level)
> Version: 1.0 | Last updated: Jun 6, 2026
> End-to-end UI flows: what the user taps, what screen appears, what they see.
> Cross-reference with backend FUNCTIONAL_FLOW.md for the full picture.
> Updated whenever a flow changes or a new flow is added.

---

## FLOW INDEX

| # | Flow | Status | Day |
|---|------|--------|-----|
| UF-01 | First-time app open → Sign in | ✅ Day 2 | Day 2 |
| UF-02 | Returning user → Auto-login | ✅ Day 2 | Day 2 |
| UF-03 | Upload and analyze resume | ⬜ Day 4–5 | Day 4–5 |
| UF-04 | Browse jobs and get match score | ⬜ Day 6–7 | Day 6–7 |
| UF-05 | Tailor resume for a job | ⬜ Day 8 | Day 8 |
| UF-06 | Generate cover letter | ⬜ Day 8 | Day 8 |
| UF-07 | Apply to a job | ⬜ Day 9 | Day 9 |
| UF-08 | Track application + update status | ⬜ Day 9 | Day 9 |
| UF-09 | Start and complete mock interview | ⬜ Day 10–11 | Day 10–11 |
| UF-10 | View interview report | ⬜ Day 10 | Day 10 |
| UF-11 | Full happy path (first use to first interview) | ⬜ Day 12 | Day 12 |
| UF-12 | Sign out | ⬜ Day 3 | Day 3 |

---

## UF-01 — First-time App Open → Sign In

**Day:** 2 | **Status:** ⬜

```
User opens app for the first time
  ↓
[SplashScreen]
  → Checks SecureStore for JWT
  → No JWT found
  → Navigate to OnboardingScreen

[OnboardingScreen]
  → User swipes through 3 slides
  → Taps "Get Started"
  → Navigate to GoogleSignInScreen

[GoogleSignInScreen]
  → User sees "Sign in with Google" button
  → Taps button
  → Google account picker appears (Firebase SDK)
  → User selects their Google account
  → Firebase returns ID token
  → Spinner shows: "Signing in..."
  → POST /api/auth/google called
  → JWT received → stored in SecureStore
  → User stored in Redux
  → Navigate to MainNavigator → HomeScreen

[HomeScreen]
  → User sees: "Hi [name] 👋"
  → App is ready to use
```

**Error cases:**
- Google sign-in cancelled → stay on GoogleSignInScreen, no error shown
- Backend returns 401 (invalid token) → show "Sign in failed. Try again."
- Network error → show "No internet connection. Try again."

---

## UF-02 — Returning User → Auto-Login

**Day:** 2 | **Status:** ⬜

```
User opens app (not first time)
  ↓
[SplashScreen]
  → Checks SecureStore for JWT
  → JWT found
  → Dispatch setJwt to Redux
  → Navigate directly to MainNavigator → HomeScreen
  (No sign-in screen shown)

[HomeScreen]
  → User is already logged in
```

**Error case:**
- JWT expired → first API call returns 401 → Axios interceptor clears token → navigate to AuthNavigator

---

## UF-03 — Upload and Analyze Resume

**Day:** 4–5 | **Status:** ⬜

```
[HomeScreen]
  → Tap "Upload Resume" quick action
  → Navigate to ResumeListScreen

[ResumeListScreen]
  → GET /api/resumes loads (empty first time)
  → User sees empty state: "Upload your first resume"
  → Tap FAB (+ button)
  → Navigate to ResumeUploadScreen

[ResumeUploadScreen]
  → File picker opens (DocumentPicker)
  → User selects a PDF from phone
  → File shown: "resume.pdf — 1.2MB"
  → Tap "Upload"
  → Progress bar fills: "Uploading... 60%"
  → POST /api/resumes/upload completes
  → "Upload successful!" shown
  → Navigate back to ResumeListScreen

[ResumeListScreen]
  → New resume card appears: "Original — Not analyzed yet"
  → Tap the resume card
  → Navigate to ResumeDetailScreen

[ResumeDetailScreen]
  → Shows: file name, upload date
  → Score gauge: empty (not analyzed yet)
  → Tap "Analyze My Resume"
  → Spinner: "Analyzing your resume with AI..."
  → POST /api/ai/resume-parse → POST /api/ai/resume-score (sequential)
  → Score gauge fills: e.g., 72/100
  → Skills chips appear: ["Java", "Spring Boot", "PostgreSQL"]
  → Strengths: ["Strong backend experience", ...]
  → Improvements: ["Add quantified achievements", ...]
```

**Error cases:**
- Wrong file type → "Only PDF and DOCX allowed" (shown immediately, no upload)
- File > 5MB → "File too large. Max 5MB"
- Upload fails → "Upload failed. Try again."
- AI analysis fails → "Analysis failed. Try again." button shown

---

## UF-04 — Browse Jobs and Get Match Score

**Day:** 6–7 | **Status:** ⬜

```
[Bottom tab: Jobs]
  → Navigate to JobFeedScreen

[JobFeedScreen]
  → GET /api/jobs/feed loads
  → Job cards appear with: title, company, location, salary
  → Some cards show match score badge (green/yellow/red)
  → Some cards show "Not scored" grey badge

  → User scrolls down → infinite scroll loads next page
  → User taps a job card
  → Navigate to JobDetailScreen

[JobDetailScreen]
  → Full job description loaded
  → Action buttons at bottom: "See Match", "Tailor Resume", "Generate Cover Letter", "Apply"
  → Tap "See Match"
  → Navigate to MatchScoreScreen

[MatchScoreScreen]
  → Resume picker shown (if user has multiple resumes)
  → User selects "Original" resume
  → Tap "Score My Fit"
  → Spinner: "Analyzing fit with AI..."
  → POST /api/ai/match-score completes
  → Match score shown: 78/100 (green ring)
  → Skills Match: 85% (progress bar)
  → Experience Match: 70% (progress bar)
  → Missing keywords: "Docker", "Kafka", "AWS" (red chips)
  → Navigate back to JobDetailScreen
```

**Error cases:**
- No resumes uploaded → prompt: "Upload a resume first to see your match score"
- API fails → "Scoring failed. Try again."

---

## UF-05 — Tailor Resume for a Job

**Day:** 8 | **Status:** ⬜

```
[JobDetailScreen]
  → Tap "Tailor Resume"
  → Navigate to TailorResumeScreen (with jobId)

[TailorResumeScreen]
  → Shows job title + company
  → Resume picker: select which resume to tailor
  → Tap "Tailor for This Job"
  → Spinner: "AI is rewriting your resume for this job..."
  → POST /api/resumes/tailor completes (takes 10–20s)
  → Shows: "New version created!"
  → Changes list: ["Emphasized Docker experience", "Added Kafka to skills"]
  → "View New Resume Version" button
  → Tap → navigate to ResumeDetailScreen (new tailored resumeId)

[ResumeDetailScreen — tailored version]
  → Version name: "Tailored for Razorpay - Senior Java Developer"
  → isOriginal = false badge shown
```

---

## UF-06 — Generate Cover Letter

**Day:** 8 | **Status:** ⬜

```
[JobDetailScreen]
  → Tap "Generate Cover Letter"
  → Sheet: "Select resume to use" picker
  → User selects resume
  → Navigate to CoverLetterScreen (with jobId + resumeId)

[CoverLetterScreen]
  → Spinner: "Generating cover letter..."
  → POST /api/resumes/cover-letter completes
  → Full cover letter text shown in scrollable box
  → Tap "Copy to Clipboard"
  → "Copied!" toast shown
  → User goes back to JobDetailScreen
```

---

## UF-07 — Apply to a Job

**Day:** 9 | **Status:** ⬜

```
[JobDetailScreen]
  → Tap "Apply"
  → Bottom sheet opens:
      - "Select resume version" (picker — shows all resume versions)
      - "Cover letter" (text area — paste from clipboard or leave blank)
      - "Confirm Application" button

  → User selects tailored resume version
  → Pastes cover letter
  → Tap "Confirm Application"
  → POST /api/applications/apply called
  → Success: "Application submitted!" toast
  → Navigate to ApplicationsListScreen

[ApplicationsListScreen]
  → New application appears: "Razorpay — Senior Java Developer — APPLIED"
```

**Important:** The exact resume version selected is locked after submission (Applied Resume Vault). User cannot change which resume they sent.

---

## UF-08 — Track Application and Update Status

**Day:** 9 | **Status:** ⬜

```
[Bottom tab: Applications]
  → Navigate to ApplicationsListScreen
  → GET /api/applications loads
  → Applications grouped by status

  → User received a callback email from Razorpay
  → Tap the Razorpay application
  → Navigate to ApplicationDetailScreen

[ApplicationDetailScreen]
  → Shows: job, company, status = APPLIED, applied date
  → Resume sent: locked (shows version name, greyed out edit)
  → Tap "Update Status" → status picker sheet opens
  → Select "INTERVIEW"
  → PUT /api/applications/{id}/status called
  → Status badge updates to "INTERVIEW"
  → "Practice Interview" button appears
```

---

## UF-09 — Start and Complete Mock Interview

**Day:** 10–11 | **Status:** ⬜

```
[ApplicationDetailScreen]
  → Tap "Practice Interview"
  → Navigate to InterviewStartScreen

[InterviewStartScreen]
  → Shows: job title + interview format (7 questions explained)
  → Tap "Start Interview"
  → Spinner: "AI is preparing your questions..."
  → POST /api/interviews/start completes
  → 7 question cards shown:
      1. [TECHNICAL] Explain Spring Boot auto-configuration
      2. [SYSTEM_DESIGN] Design a payment system
      ...7 total
  → Tap "Begin"
  → Navigate to InterviewQuestionScreen (question 1)

[InterviewQuestionScreen — Q1 of 7]
  → "Question 1 of 7" header
  → [TECHNICAL] badge
  → Question text shown large
  → Tap red Record button
  → Mic animation plays, waveform shown
  → User answers verbally
  → Tap Stop button
  → Audio recorded
  → Tap "Submit Answer"
  → Spinner: "Transcribing and evaluating..."
  → POST /api/interviews/{id}/answer completes
  → Shows: Your answer transcript
  → Score: 7/10
  → Feedback: "Good explanation. Add @ConditionalOnMissingBean."
  → "Next Question" button → InterviewQuestionScreen (Q2)
  → ... repeat for Q2–Q6
  → After Q7 → "See Interview Report" button

  → Navigate to InterviewReportScreen
```

---

## UF-10 — View Interview Report

**Day:** 10 | **Status:** ⬜

```
[InterviewReportScreen]
  → GET /api/interviews/{sessionId} loads
  → Overall score: 7.4 / 10 (large ring)
  → Per-question breakdown (7 expandable cards):
      Q1: TECHNICAL — Score 7/10
          "Explain Spring Boot auto-configuration"
          Your answer: "Spring Boot auto-configuration works by..."
          AI Feedback: "Good. Add @ConditionalOnMissingBean next time."
      Q2: SYSTEM_DESIGN — Score 8/10
      ... all 7
  → Tap "Done" → back to ApplicationDetailScreen
```

---

## UF-11 — Full Happy Path (First Use to First Interview)

**Day:** 12 | **Status:** ⬜

```
1. Open app → sign in with Google           [UF-01]
2. Upload resume → analyze → score          [UF-03]
3. Browse jobs → tap Razorpay role          [UF-04]
4. See match score → 78%                    [UF-04]
5. Tailor resume for that job               [UF-05]
6. Generate cover letter                    [UF-06]
7. Apply with tailored resume + cover letter[UF-07]
8. Get callback → update status → INTERVIEW [UF-08]
9. Start mock interview → answer 7 questions[UF-09]
10. View report → 7.4/10 overall            [UF-10]
```

---

## UF-12 — Sign Out

**Day:** 3 | **Status:** ⬜

```
[HomeScreen] → tap avatar
  → Navigate to ProfileScreen

[ProfileScreen]
  → Tap "Sign Out"
  → Confirm dialog: "Are you sure you want to sign out?"
  → Confirm
  → SecureStore.removeItem('jwt')
  → Redux auth reset
  → Navigate to AuthNavigator → OnboardingScreen
```

---

## CHANGE LOG

| Version | Date | Flow | Change | Reason |
|---------|------|------|--------|--------|
| 1.0 | Jun 6, 2026 | — | Initial flows defined | Project start |
