# ApplyAI Mobile — API Integration
> Version: 1.2 | Last updated: Jun 8, 2026
> Every API call the frontend makes: which screen, which endpoint, when, success/error handling.
> Cross-reference with backend API_SPEC.md to verify endpoints exist and are ✅ Working.

---

## BASE URL

```
Production: https://applyai-backend-production-3b67.up.railway.app
Set in:     .env → EXPO_PUBLIC_API_URL
Injected by: src/api/apiClient.ts (Axios baseURL)
```

---

## AUTH HEADERS

All protected calls use:
```
Authorization: Bearer <jwt>
```
JWT is injected automatically by `apiClient.ts` request interceptor — screens never add it manually.

---

## 401 HANDLING

Handled globally in `apiClient.ts` response interceptor:
```
On 401 → SecureStore.removeItem('jwt') → Redux reset → navigate to AuthNavigator
```
No screen needs to handle 401 individually.

---

## API CALLS BY SCREEN

---

### GoogleSignInScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Google sign-in | POST | `/api/auth/google` | Tap "Sign in" | Store JWT, dispatch user, navigate to Main | Show error toast |

**Request:**
```json
{ "idToken": "firebase-id-token" }
```
**Response:**
```json
{ "jwt": "...", "user": { "id", "name", "email", "subscriptionPlan" } }
```
**Backend status:** ✅ Working (Day 3)

---

### ResumeListScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Load resumes | GET | `/api/resumes` | Screen mount | Dispatch to resumeSlice | Show error state |

**Response:**
```json
[ { "id", "versionName", "fileUrl", "aiScore", "isOriginal", "isParsed", "createdAt" } ]
```
`isParsed: true` means parsedText is populated and the resume can be used for matching/tailoring.
**Backend status:** ✅ Working (Day 4, isParsed added Day 7)

---

### ResumeUploadScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Upload resume | POST | `/api/resumes/upload` | Tap "Upload" | Add to resumeSlice, navigate back | Show error below button |

**Request:** `multipart/form-data`, field name: `file` (PDF/DOCX, max 5MB)
**Response:**
```json
{ "resumeId": 1, "fileUrl": "https://...", "versionName": "Original", "message": "Upload successful" }
```
**Backend status:** ✅ Working (Day 4)

---

### ResumeDetailScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Parse resume | POST | `/api/ai/resume-parse` | Tap "Analyze" | Show parsed data | Show error |
| Score resume | POST | `/api/ai/resume-score` | After parse | Show score gauge | Show error |

**Request (parse):** `{ "resumeId": 1 }`
**Response (parse):** `{ "skills": [], "experienceYears": 3, "education": "...", "summary": "..." }`

**Request (score):** `{ "resumeId": 1 }`
**Response (score):** `{ "score": 72, "strengths": [], "improvements": [] }`
**Backend status:** ✅ Working (Day 5)

---

### TailorResumeScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Tailor resume | POST | `/api/resumes/tailor` | Tap "Tailor" | Show changes, new resumeId | Show error |

**Request:** `{ "resumeId": 1, "jobId": 1 }`
**Response:** `{ "newResumeId": 2, "versionName": "...", "tailoredText": "...", "changes": [] }`
**Backend status:** ⬜ Day 8

---

### CoverLetterScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Generate cover letter | POST | `/api/resumes/cover-letter` | Screen mount | Show text | Show error |

**Request:** `{ "resumeId": 1, "jobId": 1 }`
**Response:** `{ "coverLetter": "Dear Hiring Manager..." }`
**Backend status:** ⬜ Day 8

---

### JobFeedScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Load job feed | GET | `/api/jobs/feed?page=0&size=20` | Screen mount + scroll | Append to jobSlice | Show error state |

**Response:** `{ "content": [ { "id", "title", "company", "location", "salaryMin", "salaryMax", "matchScore", "postedDate" } ], "page", "totalElements" }`
**Backend status:** ⬜ Day 6

---

### JobDetailScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Get job detail | GET | `/api/jobs/{jobId}` | Screen mount | Set job.selected | Show error |

**Response:** Full job object including `description`
**Backend status:** ⬜ Day 6

---

### MatchScoreScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Load resumes | GET | `/api/resumes` | Screen mount | Populate resume picker | Show error state |
| Analyze match | POST | `/api/ai/match` | Tap "Analyze Match" | Show score ring + details | Show error banner |

**Load resumes response:**
```json
[ { "id", "versionName", "fileUrl", "aiScore", "isOriginal", "isParsed", "createdAt" } ]
```
**Analyze match request:** `{ "resumeId": 1, "jobId": 1 }`
**Analyze match response:**
```json
{
  "matchId": 1, "resumeId": 1, "jobId": 1,
  "jobTitle": "Backend Developer", "company": "Google",
  "matchScore": 78,
  "strengths": ["Strong Java background", "4 years relevant experience"],
  "gaps": ["Missing Docker experience", "No AWS certifications"],
  "recommendation": "Strong candidate — tailor resume to highlight cloud skills.",
  "createdAt": "2026-06-08T10:00:00", "cached": false
}
```
**Redux:** Result stored in `job.matchScores["{resumeId}_{jobId}"]` — cache hit shows result instantly without re-calling API.
**Backend status:** ✅ Built (Day 7)

---

### ApplicationsListScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Load applications | GET | `/api/applications` | Screen mount | Dispatch to applicationSlice | Show error state |

**Backend status:** ⬜ Day 9

---

### ApplicationDetailScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Get application | GET | `/api/applications/{id}` | Screen mount | Set application.selected | Show error |
| Update status | PUT | `/api/applications/{id}/status` | Status picker change | Update in Redux | Show error toast |

**Request (update):** `{ "status": "INTERVIEW" }`
**Backend status:** ⬜ Day 9

---

### InterviewStartScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Load history | GET | `/api/interviews/history` | Screen focus | Dispatch to interviewSlice.history | Keep stale |
| Load applications (picker) | GET | `/api/applications` | Tap "Start Mock Interview" | Populate picker | Show empty state |
| Start interview | POST | `/api/interviews/start` | Pick application in modal | Dispatch currentSession, navigate to Question | Alert error |

**Start request:** `{ "applicationId": 1 }`
**Start response:** Full `InterviewSession` with `sessionId`, `jobTitle`, `company`, `questions[]`
**Backend status:** ✅ Day 10

---

### InterviewQuestionScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Submit answer | POST | `/api/interviews/{sessionId}/answer` | Tap "Submit Answer" | Show score + AI feedback inline | Show error banner |

**Request:** `multipart/form-data` — `questionId` (Long) + either `answerText` (String) or `audioFile` (MP3/M4A/WAV/WebM)
**Response:** `{ "questionId", "question", "answerText", "audioUrl", "aiScore", "aiFeedback", "sessionComplete", "overallScore" }`
**Voice path:** audioFile → Cloudinary → Whisper transcription → Claude evaluation (~20s)
**Text path:** answerText → Claude evaluation directly (~10s)
**Backend status:** ✅ Day 11

---

### InterviewReportScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Get session | GET | `/api/interviews/{sessionId}` | Screen mount | Render full report | Show error |

**Response:** `{ "sessionId", "jobTitle", "company", "overallScore", "completedAt", "questions": [ { "id", "question", "questionType", "sequenceOrder", "transcript", "aiScore", "aiFeedback" } ] }`
**Backend status:** ✅ Day 10

---

## ENDPOINT STATUS TRACKER

| Method | Path | Screen | Backend Status | Frontend Built |
|--------|------|--------|---------------|---------------|
| POST | /api/auth/google | GoogleSignIn | ✅ Working | ✅ Day 2 |
| GET | /api/auth/me | Profile (refresh) | ✅ Working | ⬜ Day 3 |
| GET | /api/resumes | ResumeList | ✅ Working | ✅ Day 4 |
| POST | /api/resumes/upload | ResumeUpload | ✅ Working | ✅ Day 4 |
| POST | /api/resumes/tailor | TailorResume | ✅ Day 8 | ✅ Day 8 |
| POST | /api/resumes/cover-letter | CoverLetter | ✅ Day 8 | ✅ Day 8 |
| POST | /api/ai/resume-parse | ResumeDetail | ✅ Working | ✅ Day 5 |
| POST | /api/ai/resume-score | ResumeDetail | ✅ Working | ✅ Day 5 |
| GET | /api/jobs/feed | JobFeed | ✅ Working | ✅ Day 6 |
| GET | /api/jobs/{id} | JobDetail | ✅ Working | ✅ Day 6 |
| POST | /api/ai/match-score | MatchScore | ⬜ Day 7 | ⬜ Day 7 |
| POST | /api/applications/apply | ApplyJob | ✅ Day 9 | ✅ Day 9 |
| GET | /api/applications | ApplicationsList | ✅ Day 9 | ✅ Day 9 |
| GET | /api/applications/{id} | ApplicationDetail | ✅ Day 9 | ✅ Day 9 |
| PUT | /api/applications/{id}/status | ApplicationDetail | ✅ Day 9 | ✅ Day 9 |
| POST | /api/interviews/start | InterviewStart | ⬜ Day 10 | ⬜ Day 10 |
| POST | /api/interviews/{id}/answer | InterviewQuestion | ⬜ Day 11 | ⬜ Day 11 |
| GET | /api/interviews/{id} | InterviewReport | ⬜ Day 10 | ⬜ Day 10 |

---

## CHANGE LOG

| Version | Date | Change | Reason |
|---------|------|--------|--------|
| 1.0 | Jun 6, 2026 | Initial spec — all API calls documented | Project start |

_Add a row every time an API call is added, changed, or its endpoint status changes._
