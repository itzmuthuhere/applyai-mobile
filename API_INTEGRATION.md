# ApplyAI Mobile — API Integration
> Version: 1.0 | Last updated: Jun 6, 2026
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
[ { "id", "versionName", "fileUrl", "aiScore", "isOriginal", "createdAt" } ]
```
**Backend status:** ✅ Working (Day 4)

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
**Backend status:** ⬜ Day 5

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
| Get match score | POST | `/api/ai/match-score` | Tap "Score" | Show score breakdown | Show error |

**Request:** `{ "resumeId": 1, "jobId": 1 }`
**Response:** `{ "matchScore": 78, "skillsMatch": 85, "experienceMatch": 70, "keywordsMissing": [], "cached": false }`
**Backend status:** ⬜ Day 7

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
| Start interview | POST | `/api/interviews/start` | Tap "Start Interview" | Store session + questions | Show error |

**Request:** `{ "applicationId": 1 }`
**Response:** `{ "sessionId": 1, "questions": [ { "id", "question", "questionType", "sequenceOrder" } ] }`
**Backend status:** ⬜ Day 10

---

### InterviewQuestionScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Submit answer | POST | `/api/interviews/{sessionId}/answer` | Tap "Submit" | Show transcript + score | Show error |

**Request:** `multipart/form-data`: `audioFile` + `questionId` (Long)
**Response:** `{ "questionId", "transcript", "score", "feedback", "sessionComplete" }`
**Backend status:** ⬜ Day 11

---

### InterviewReportScreen
| Call | Method | Path | When | Success | Error |
|------|--------|------|------|---------|-------|
| Get session | GET | `/api/interviews/{sessionId}` | Screen mount | Render full report | Show error |

**Response:** `{ "sessionId", "overallScore", "completedAt", "questions": [ { ...with scores and feedback } ] }`
**Backend status:** ⬜ Day 10

---

## ENDPOINT STATUS TRACKER

| Method | Path | Screen | Backend Status | Frontend Built |
|--------|------|--------|---------------|---------------|
| POST | /api/auth/google | GoogleSignIn | ✅ Working | ✅ Day 2 |
| GET | /api/auth/me | Profile (refresh) | ✅ Working | ⬜ Day 3 |
| GET | /api/resumes | ResumeList | ✅ Working | ✅ Day 4 |
| POST | /api/resumes/upload | ResumeUpload | ✅ Working | ✅ Day 4 |
| POST | /api/resumes/tailor | TailorResume | ⬜ Day 8 | ⬜ Day 8 |
| POST | /api/resumes/cover-letter | CoverLetter | ⬜ Day 8 | ⬜ Day 8 |
| POST | /api/ai/resume-parse | ResumeDetail | ⬜ Day 5 | ⬜ Day 5 |
| POST | /api/ai/resume-score | ResumeDetail | ⬜ Day 5 | ⬜ Day 5 |
| GET | /api/jobs/feed | JobFeed | ⬜ Day 6 | ⬜ Day 6 |
| GET | /api/jobs/{id} | JobDetail | ⬜ Day 6 | ⬜ Day 6 |
| POST | /api/ai/match-score | MatchScore | ⬜ Day 7 | ⬜ Day 7 |
| POST | /api/applications/apply | ApplicationDetail | ⬜ Day 9 | ⬜ Day 9 |
| GET | /api/applications | ApplicationsList | ⬜ Day 9 | ⬜ Day 9 |
| GET | /api/applications/{id} | ApplicationDetail | ⬜ Day 9 | ⬜ Day 9 |
| PUT | /api/applications/{id}/status | ApplicationDetail | ⬜ Day 9 | ⬜ Day 9 |
| POST | /api/interviews/start | InterviewStart | ⬜ Day 10 | ⬜ Day 10 |
| POST | /api/interviews/{id}/answer | InterviewQuestion | ⬜ Day 11 | ⬜ Day 11 |
| GET | /api/interviews/{id} | InterviewReport | ⬜ Day 10 | ⬜ Day 10 |

---

## CHANGE LOG

| Version | Date | Change | Reason |
|---------|------|--------|--------|
| 1.0 | Jun 6, 2026 | Initial spec — all API calls documented | Project start |

_Add a row every time an API call is added, changed, or its endpoint status changes._
