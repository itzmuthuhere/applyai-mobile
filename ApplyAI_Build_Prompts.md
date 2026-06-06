# ApplyAI Mobile — Build Prompts (Copy-Paste Ready)
> One prompt per session. Copy the prompt block exactly and paste into Claude Code.
> Claude automatically: reads PROJECT_STATE.md → builds → updates all docs → commits → pushes.

---

## HOW TO USE THIS FILE

1. Check `BUILD_LOG.md` → find "Next to build"
2. Check "Pre-session checklist" for that day — complete it first
3. Copy the prompt block exactly
4. Paste into Claude Code — Claude handles everything else
5. Run the test steps listed under each day
6. If something fails → use the ERROR FIX TEMPLATE at the bottom

## IF SOMETHING GOES WRONG

- **Screen blank / crash:** Run `npx expo start` in D:\applyai-mobile, check terminal for red errors
- **API call fails 401:** Check JWT is stored in SecureStore correctly; check backend is up
- **API call fails 500:** Check Railway backend logs; check request body format
- **Navigation not working:** Check route names match exactly in navigation/types.ts + constants/index.ts
- **New feature not in plan:** Just describe it. Claude will build it and log it as [UNPLANNED]

---

## ✅ DAY 1 — App Shell + Navigation Setup — COMPLETED (Jun 6, 2026)

**What was built:**
- Full `src/` folder structure (api, navigation, screens, store, types, constants, utils)
- `apiClient.ts` — Axios + JWT interceptor + 401 auto-logout handler
- `AppNavigator.tsx` — bootstraps JWT from SecureStore → routes Auth or Main
- `AuthNavigator.tsx` — Onboarding → GoogleSignIn stack
- `MainNavigator.tsx` — 5-tab bottom navigator (Home/Jobs/Resume/Applications/Interview)
- `authSlice.ts` — Google Sign-In thunk + state + configureGoogleSignIn
- All Redux slices (resume, job, application, interview) as stubs
- All screen placeholder files created
- All TypeScript types in `api.types.ts`
- `constants/index.ts` — ROUTES, COLORS, API_ENDPOINTS, SECURE_STORE_KEYS

**Test:** `npx expo start` → QR code appears, app opens in Expo Go → see blue splash screen

---

## ✅ DAY 2 — Google Sign-In Screen — COMPLETED (Jun 6, 2026)

**What was built:**
- `GoogleSignInScreen.tsx` — full UI (gradient bg, logo, feature list, Google button, loading + error states)
- `authSlice.ts` → `signInWithGoogle` thunk — Google SDK → Firebase ID token → `POST /api/auth/google` → store JWT
- `signOut` thunk — clears JWT + Google session
- `App.tsx` — calls `configureGoogleSignIn()` at startup with webClientId
- `google-services.json` — placed in root (Firebase Android config)

**Backend dependency:** `POST /api/auth/google` ✅ Working (backend Day 3 done)

**Pre-session checklist:**
- [x] `google-services.json` in D:\applyai-mobile root
- [x] Firebase Android app registered (com.applyai.mobile)
- [x] Backend auth endpoint ✅ working

**Test steps:**
```
1. npx expo start
2. Open in Expo Go on Android phone
3. Tap "Continue with Google"
4. Select Google account
5. Should navigate to Home tab (main navigator)
6. Kill app → reopen → should go straight to Home (JWT saved)
```

---

## ⬜ DAY 3 — Home + Profile Screens

**Goal:** Build HomeScreen (dashboard with stats) and ProfileScreen (user info + sign out).

**Backend dependency:** `GET /api/auth/me` ✅ Working

**Pre-session checklist:**
- [ ] Day 2 tested and working (can sign in with Google)
- [ ] User object in Redux after sign-in (check with Redux DevTools)

**Prompt to paste:**
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- Google Sign-In is working (Day 2 complete)
- User object is stored in Redux: auth.user (id, name, email, subscriptionPlan, profilePicture)

TODAY'S GOAL: Build HomeScreen and ProfileScreen.

HomeScreen requirements (src/screens/home/HomeScreen.tsx):
- Route: Home (currently a placeholder)
- Header: "Hi [name] 👋" + subscription badge (FREE/HUNTER/PRO)
- Quick stats row: X resumes | Y applications | Z interviews (read from Redux)
- Quick action cards: "Upload Resume" → ResumeList, "Browse Jobs" → JobFeed, "Practice Interview" → InterviewStart
- Colors from src/constants/index.ts COLORS object
- Empty/first-time state: "Let's get started" tips when all counts are 0

ProfileScreen requirements (src/screens/home/ProfileScreen.tsx — new file):
- Route: Profile (add to MainNavigator as modal or accessible from Home header)
- Show: profile picture (Google), name, email, subscriptionPlan badge
- Show: targetRole, targetLocation, minSalary, remotePreference (editable later, read-only now)
- "Sign Out" button → dispatch signOut thunk → navigate to AuthNavigator
- Add profile icon/avatar tap to HomeScreen header to navigate to Profile

Rules:
- No inline styles — StyleSheet.create() only
- No class components — functional only
- No hardcoded strings — use constants
- Add ProfileScreen to navigation types.ts and MainNavigator
- Update all docs per CLAUDE.md scenario checklist
```

**Test steps:**
```
1. Sign in → should see HomeScreen with name from Google
2. If no resumes/jobs/interviews: should show 0s or empty state
3. Tap header avatar → Profile screen opens
4. Tap "Sign Out" → goes back to Onboarding
5. Re-open app → starts at Onboarding (JWT cleared)
```

---

## ⬜ DAY 4 — Resume List + Upload Screens

**Goal:** Build ResumeListScreen (FlatList of resumes) and ResumeUploadScreen (pick PDF + upload).

**Backend dependency:** `GET /api/resumes` ⬜ Day 4 | `POST /api/resumes/upload` ⬜ Day 4

**Pre-session checklist:**
- [ ] Day 3 complete (Home + Profile working)
- [ ] Backend Day 4 deployed (resume endpoints live)
- [ ] Cloudinary env vars set in Railway (ACTION_REQUIRED_002)

**Prompt to paste:**
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- Days 1–3 complete. User is signed in. Home + Profile screens work.

TODAY'S GOAL: Build ResumeListScreen and ResumeUploadScreen.

ResumeListScreen (src/screens/resume/ResumeListScreen.tsx):
- Route: ResumeList (Tab 3, default)
- On mount: call GET /api/resumes → dispatch to resumeSlice.list
- Show FlatList of ResumeCard components (versionName, aiScore badge, isOriginal tag, createdAt)
- Loading: skeleton cards (3 placeholder rows with grey animated boxes)
- Empty: "No resumes yet. Upload your first one." + Upload button
- Error: "Failed to load resumes." + Retry button
- FAB (floating action button) bottom-right: navigate to ResumeUpload

ResumeUploadScreen (src/screens/resume/ResumeUploadScreen.tsx):
- Route: ResumeUpload
- Use expo-document-picker to pick PDF/DOCX (max 5MB)
- Validate: file type (PDF/DOCX only), file size (< 5MB)
- On "Upload": POST /api/resumes/upload as multipart/form-data, field name: file
- Show upload progress bar
- Success: navigate back to ResumeList
- Error: show error below button (specific messages per error type)

resumeSlice: update list state on successful upload (append new resume)

Rules:
- All API calls through src/api/apiClient.ts
- TypeScript types from src/types/api.types.ts
- Update all docs per CLAUDE.md scenario checklist
```

**Test steps:**
```
1. Navigate to Resume tab → should see empty state
2. Tap FAB → ResumeUpload opens
3. Tap "Pick File" → file picker opens
4. Select a PDF (< 5MB) → shows file name
5. Tap "Upload" → progress bar → success → back to list
6. Resume appears in list with name and score (null initially)
7. Try uploading non-PDF → should show "Only PDF and DOCX allowed"
8. Try uploading > 5MB → should show "File must be under 5MB"
```

---

## ⬜ DAY 5 — Resume Detail / Score Screen

**Goal:** Build ResumeDetailScreen — show resume, trigger AI analysis, display score + feedback.

**Backend dependency:** `POST /api/ai/resume-parse` ⬜ Day 5 | `POST /api/ai/resume-score` ⬜ Day 5

**Pre-session checklist:**
- [ ] Day 4 complete (can upload resumes)
- [ ] Backend Day 5 deployed (AI parse + score endpoints live)
- [ ] Anthropic API key set in Railway (ACTION_REQUIRED_003)

**Prompt to paste:**
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- Days 1–4 complete. Resumes can be uploaded and listed.

TODAY'S GOAL: Build ResumeDetailScreen.

ResumeDetailScreen (src/screens/resume/ResumeDetailScreen.tsx):
- Route: ResumeDetail, Params: { resumeId: number }
- Entry: tap resume card in ResumeListScreen
- On mount: load resume from resumeSlice by resumeId
- Show: fileName, uploadedAt, cloudinaryUrl "View File" button (open in browser)
- "Analyze Resume" button:
  1. POST /api/ai/resume-parse { resumeId } → show extracted skills, experience, education
  2. POST /api/ai/resume-score { resumeId } → show score gauge
- Score gauge: circular 0–100 (use react-native-svg or simple View-based ring)
- Skills chips: horizontal ScrollView of extracted skill tags
- Strengths list (green check icons)
- Improvements list (orange arrow icons)
- If already analyzed (overallScore != null): show cached results on load, no "Analyze" button
- Loading: "Analyzing your resume with AI..." full-screen overlay spinner (can take 5–10s)
- Error: "Analysis failed. Try again." with retry

Action buttons at bottom:
- "Tailor for a Job" → TailorResumeScreen (resumeId)

Update resumeSlice: store selected resume + parse/score results

Rules:
- Update all docs per CLAUDE.md scenario checklist
```

**Test steps:**
```
1. Tap a resume in list → detail screen opens
2. Tap "Analyze Resume" → spinner shown
3. After ~5–10s: score gauge appears, skills shown, strengths + improvements listed
4. Navigate away and back → cached results shown immediately (no re-analyze)
5. Tap "View File" → opens PDF in browser
```

---

## ⬜ DAY 6 — Job Feed + Job Detail Screens

**Goal:** Build JobFeedScreen (paginated job list) and JobDetailScreen (full job + action buttons).

**Backend dependency:** `GET /api/jobs/feed` ⬜ Day 6 | `GET /api/jobs/{id}` ⬜ Day 6

**Pre-session checklist:**
- [ ] Day 5 complete (resume analysis working)
- [ ] Backend Day 6 deployed (job feed endpoints live)
- [ ] Admin has seeded some job records in DB

**Prompt to paste:**
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- Days 1–5 complete. Resume analysis working.

TODAY'S GOAL: Build JobFeedScreen and JobDetailScreen.

JobFeedScreen (src/screens/jobs/JobFeedScreen.tsx):
- Route: JobFeed (Tab 2, default)
- On mount: GET /api/jobs/feed?page=0&size=20 → dispatch to jobSlice.feed
- FlatList of JobCard components: title, company, location, salary range, matchScore badge, remote tag
- matchScore null → grey "Not scored" badge
- matchScore < 50 → red badge; 50–74 → yellow; 75+ → green
- Infinite scroll: on scroll to end → fetch next page → append to list
- Loading first page: skeleton cards; loading more: footer spinner
- Empty: "No jobs available yet"
- Error: "Failed to load jobs." + Retry

JobDetailScreen (src/screens/jobs/JobDetailScreen.tsx):
- Route: JobDetail, Params: { jobId: number }
- On mount: GET /api/jobs/{jobId} → set jobSlice.selected
- Show: title, company, location, salary range, posted date, full description (ScrollView)
- Action row (bottom fixed): "See Match", "Tailor Resume", "Generate Cover Letter", "Apply"
- "See Match" → MatchScoreScreen (jobId)
- "Tailor Resume" → TailorResumeScreen (jobId)
- "Generate Cover Letter" → CoverLetterScreen (jobId + resumeId from Redux selected resume)
- "Apply" → POST /api/applications/apply (Day 9) — show "coming soon" for now

Update jobSlice with pagination state (currentPage, totalPages, isLoadingMore)

Rules:
- Update all docs per CLAUDE.md scenario checklist
```

**Test steps:**
```
1. Navigate to Jobs tab → job cards appear
2. Scroll to bottom → more jobs load (footer spinner shows briefly)
3. Tap a job → detail screen with full description
4. Tap "See Match" → MatchScore screen (placeholder until Day 7)
```

---

## ⬜ DAY 7 — Match Score Screen

**Goal:** Build MatchScoreScreen — pick resume, run AI match, see score breakdown.

**Backend dependency:** `POST /api/ai/match-score` ⬜ Day 7

**Pre-session checklist:**
- [ ] Day 6 complete (job feed working)
- [ ] Backend Day 7 deployed (match score endpoint live)
- [ ] User has at least one uploaded resume

**Prompt to paste:**
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- Days 1–6 complete. Job feed working.

TODAY'S GOAL: Build MatchScoreScreen.

MatchScoreScreen (src/screens/jobs/MatchScoreScreen.tsx):
- Route: MatchScore, Params: { jobId: number }
- Entry: "See Match" from JobDetail
- On mount: load resumeSlice.list (GET /api/resumes if not yet loaded)
- Resume picker: if user has 1 resume → auto-select; if multiple → show dropdown/picker
- "Score Match" button → POST /api/ai/match-score { resumeId, jobId }
- Loading: "Analyzing fit with AI..." overlay (can take 5–10s)
- Result UI:
  - Big overall score number with colored ring (red/yellow/green thresholds)
  - Skills Match: labeled progress bar (percentage)
  - Experience Match: labeled progress bar
  - Missing keywords: horizontal chip list (red chips)
  - Matching keywords: horizontal chip list (green chips)
  - "Cached" badge if response field `cached: true`
- Error: "Match failed. Try again."
- If already scored this (jobId + resumeId): show cached result from jobSlice immediately

Update jobSlice: store matchScores keyed by `${resumeId}-${jobId}`

Rules:
- Update all docs per CLAUDE.md scenario checklist
```

**Test steps:**
```
1. Tap "See Match" on any job → MatchScore screen
2. If 1 resume: auto-selected; tap "Score Match"
3. After ~5–10s: score displayed with breakdown
4. Navigate away and back → cached result shown (no re-run)
5. "Cached" badge visible on second view
```

---

## ⬜ DAY 8 — Tailor Resume + Cover Letter Screens

**Goal:** Build TailorResumeScreen and CoverLetterScreen.

**Backend dependency:** `POST /api/resumes/tailor` ⬜ Day 8 | `POST /api/resumes/cover-letter` ⬜ Day 8

**Pre-session checklist:**
- [ ] Day 7 complete (match score working)
- [ ] Backend Day 8 deployed (tailor + cover letter endpoints live)

**Prompt to paste:**
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- Days 1–7 complete. Match score working.

TODAY'S GOAL: Build TailorResumeScreen and CoverLetterScreen.

TailorResumeScreen (src/screens/resume/TailorResumeScreen.tsx):
- Route: TailorResume, Params: { resumeId?: number, jobId?: number }
- If both params provided: auto-start tailoring
- If only one: show picker for the missing one
- "Tailor" button → POST /api/resumes/tailor { resumeId, jobId }
- Loading: "AI is rewriting your resume for this job..." (can take 10–20s)
- Result:
  - "New version created: [versionName]"
  - List of changes made (bullet list)
  - "View New Version" button → navigate to ResumeDetail (new resumeId)
- Error: "Tailoring failed. Try again."
- Append new resume to resumeSlice.list on success

CoverLetterScreen (src/screens/resume/CoverLetterScreen.tsx):
- Route: CoverLetter, Params: { resumeId: number, jobId: number }
- On mount: POST /api/resumes/cover-letter { resumeId, jobId }
- Loading: "Generating your cover letter..." spinner
- Result: full-screen ScrollView showing cover letter text
- "Copy to Clipboard" button (Clipboard API) with "Copied!" toast on tap
- NOTE: cover letter is NOT saved — for copy-paste use only
- Error: "Generation failed. Try again."

Rules:
- Update all docs per CLAUDE.md scenario checklist
```

**Test steps:**
```
1. From JobDetail → "Tailor Resume" → TailorResume screen
2. Tap "Tailor" → wait 10–20s → see changes + new version name
3. Tap "View New Version" → ResumeDetail of new version
4. From JobDetail → "Generate Cover Letter" → CoverLetter screen
5. Cover letter text appears → tap "Copy" → paste into any app to verify
```

---

## ⬜ DAY 9 — Applications List + Detail Screens

**Goal:** Build ApplicationsListScreen (track all applications) and ApplicationDetailScreen (full detail + status update).

**Backend dependency:** `GET /api/applications` ⬜ Day 9 | `GET /api/applications/{id}` ⬜ Day 9 | `PUT /api/applications/{id}/status` ⬜ Day 9 | `POST /api/applications/apply` ⬜ Day 9

**Pre-session checklist:**
- [ ] Day 8 complete (tailor + cover letter working)
- [ ] Backend Day 9 deployed (application endpoints live)

**Prompt to paste:**
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- Days 1–8 complete. Tailor + cover letter working.

TODAY'S GOAL: Build ApplicationsListScreen and ApplicationDetailScreen.
Also: wire up the "Apply" button in JobDetailScreen.

ApplicationsListScreen (src/screens/applications/ApplicationsListScreen.tsx):
- Route: ApplicationsList (Tab 4, default)
- On mount: GET /api/applications → dispatch to applicationSlice.list
- Group by status: SAVED | APPLIED | INTERVIEW | OFFER | REJECTED
- Each row: company, job title, applied date, status badge (color-coded)
- Empty: "No applications yet. Apply to a job to get started."
- Loading: skeleton rows; Error: retry button
- Tap row → ApplicationDetailScreen (applicationId)

ApplicationDetailScreen (src/screens/applications/ApplicationDetailScreen.tsx):
- Route: ApplicationDetail, Params: { applicationId: number }
- On mount: GET /api/applications/{id} → set applicationSlice.selected
- Show: job title, company, location, resume version used, cover letter (if any), current status
- Status picker: dropdown to change status → PUT /api/applications/{id}/status
- Notes field: read-only for now
- "Practice Interview" button: visible only when status = INTERVIEW → navigate to InterviewStartScreen (applicationId)

JobDetailScreen: wire up "Apply" button:
- POST /api/applications/apply { jobId, resumeId (selected or picker) }
- On success: toast "Application saved!" + add to applicationSlice.list

Update applicationSlice: add applied application to list on apply success

Rules:
- Update all docs per CLAUDE.md scenario checklist
```

**Test steps:**
```
1. Navigate to Jobs → tap job → tap "Apply" → success toast
2. Navigate to Applications tab → application appears with SAVED status
3. Tap application → detail screen
4. Change status to INTERVIEW → "Practice Interview" button appears
5. Tap "Practice Interview" → InterviewStart screen (Day 10)
```

---

## ⬜ DAY 10 — Interview Start + Report Screens

**Goal:** Build InterviewStartScreen (generate questions) and InterviewReportScreen (full report).

**Backend dependency:** `POST /api/interviews/start` ⬜ Day 10 | `GET /api/interviews/{sessionId}` ⬜ Day 10

**Pre-session checklist:**
- [ ] Day 9 complete (applications working)
- [ ] Backend Day 10 deployed (interview start + report endpoints live)

**Prompt to paste:**
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- Days 1–9 complete. Applications working.

TODAY'S GOAL: Build InterviewStartScreen and InterviewReportScreen.

InterviewStartScreen (src/screens/interview/InterviewStartScreen.tsx):
- Route: InterviewStart, Params: { applicationId: number }
- Shows: job title + company (from applicationSlice.selected.job)
- Format explanation: "7 questions: 2 technical, 2 system design, 2 behavioral, 1 HR"
- "Start Interview" button → POST /api/interviews/start { applicationId }
- Loading: "AI is preparing your interview questions..." (can take 5–10s)
- After generation: show list of question cards (question text + type badge, no answers yet)
- "Begin" button → InterviewQuestionScreen (sessionId, questionIndex=0)
- Store session + questions in interviewSlice.currentSession

InterviewReportScreen (src/screens/interview/InterviewReportScreen.tsx):
- Route: InterviewReport, Params: { sessionId: number }
- On mount: GET /api/interviews/{sessionId} → load full session with answers + scores
- Show: overall score (large number + colored ring, e.g. 7.4/10)
- Expandable cards per question:
  - Question text + type badge
  - Score: X/10
  - Your answer (transcript)
  - AI feedback text
- "Done" button → navigate back to ApplicationDetail

Rules:
- Update all docs per CLAUDE.md scenario checklist
```

**Test steps:**
```
1. Application with INTERVIEW status → "Practice Interview"
2. InterviewStart screen shows question format explanation
3. Tap "Start Interview" → wait ~5–10s → question cards appear
4. Tap "Begin" → first InterviewQuestion screen (Day 11)
5. After completing all 7 questions → InterviewReport screen
6. See overall score + expandable per-question breakdown
```

---

## ⬜ DAY 11 — Interview Question Screen (Voice Recording)

**Goal:** Build InterviewQuestionScreen — show question, record voice answer, submit, show AI score.

**Backend dependency:** `POST /api/interviews/{sessionId}/answer` ⬜ Day 11

**Pre-session checklist:**
- [ ] Day 10 complete (interview start + report working)
- [ ] Backend Day 11 deployed (voice answer eval endpoint live)
- [ ] Expo AV package installed (for audio recording)

**Prompt to paste:**
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- Days 1–10 complete. InterviewStart + Report screens working.

TODAY'S GOAL: Build InterviewQuestionScreen with voice recording.

InterviewQuestionScreen (src/screens/interview/InterviewQuestionScreen.tsx):
- Route: InterviewQuestion, Params: { sessionId: number, questionIndex: number }
- Header: "Question [N] of 7" + question type badge (TECHNICAL/BEHAVIORAL/SYSTEM_DESIGN/HR)
- Question text (large, readable, ScrollView if long)
- Record button (mic icon) → start recording (use expo-av Audio.Recording)
  - Request microphone permission first
  - While recording: show mic animation + "Recording..." + "Stop" button + timer
  - Stop recording → audioUri set
- "Submit Answer" button (enabled only when audioUri exists):
  - POST /api/interviews/{sessionId}/answer as multipart/form-data (audioFile + questionId)
  - Loading: "Transcribing and evaluating..." overlay (can take 10–15s)
- Result shown below question:
  - Your transcript (italic, smaller font)
  - Score: X / 10 (colored number)
  - AI feedback (paragraph text)
- Navigation:
  - "Next Question" button (if questionIndex < 6) → InterviewQuestion (questionIndex+1)
  - "See Report" button (if questionIndex === 6) → InterviewReport (sessionId)
- Store each answer result in interviewSlice.currentSession.answers

Install if not present: expo-av (for audio recording)

Rules:
- Update all docs per CLAUDE.md scenario checklist
```

**Test steps:**
```
1. From InterviewStart "Begin" → first question appears
2. Tap mic → speak for 10–20 seconds → tap Stop
3. Tap "Submit Answer" → "Transcribing..." shown
4. After ~10–15s: transcript + score + feedback shown
5. Tap "Next Question" → question 2 appears
6. After question 7 → "See Report" → InterviewReport screen
```

---

## ⬜ DAY 12 — End-to-End Testing + Polish

**Goal:** Full happy path test + UI polish + fix all known bugs.

**Pre-session checklist:**
- [ ] Days 1–11 complete and individually tested
- [ ] All backend endpoints ✅ Working
- [ ] No open bugs in BUILD_LOG.md

**Prompt to paste:**
```
My React Native app setup:
- Expo SDK 56, React Native 0.85.3, TypeScript, Redux Toolkit
- Local: D:\applyai-mobile
- Backend: https://applyai-backend-production-3b67.up.railway.app
- All Days 1–11 complete.

TODAY'S GOAL: End-to-end testing + polish.

Full happy path to verify:
1. Fresh install (clear app data) → Onboarding → Sign in with Google
2. Upload a resume → analyze it → see score
3. Browse jobs → tap one → see match score
4. Tailor resume for that job
5. Generate cover letter
6. Apply to job → see in Applications tab
7. Change status to INTERVIEW → Practice Interview
8. Complete all 7 questions (record voice for each)
9. See interview report

Polish checklist:
- All loading states work (no blank screens during API calls)
- All error states work (show friendly messages, retry buttons functional)
- All empty states work (first-time user sees helpful prompts)
- Navigation back buttons work correctly on all screens
- No TypeScript errors (run npx tsc --noEmit)
- Consistent colors throughout (all from COLORS constant)
- All fonts readable on both small (5") and large (6.7") screens
- Sign out → sign back in → state is fresh (no stale Redux data)

Known issues to fix: [Claude will check BUILD_LOG.md OPEN BUGS]

After polish: generate APK
npx eas build -p android --profile preview
Share APK link for final testing.
```

---

## ERROR FIX TEMPLATE

If an endpoint fails or screen crashes, paste this:

```
I'm on Day [X] of my ApplyAI mobile build.

Error: [paste full error message or stack trace]

Screen/file: [which screen]
Action: [what the user did that triggered it]
Expected: [what should happen]

My setup:
- Expo SDK 56, React Native 0.85.3, TypeScript
- Backend: https://applyai-backend-production-3b67.up.railway.app
- Local: D:\applyai-mobile

Fix this bug, assign it a BUG-XXX ID, and update BUILD_LOG.md + PROJECT_STATE.md per CLAUDE.md Scenario G.
```
