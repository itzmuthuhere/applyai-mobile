export const ROUTES = {
  // Auth stack
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  GOOGLE_SIGN_IN: 'GoogleSignIn',

  // Main tabs
  HOME: 'Home',
  JOBS_TAB: 'JobsTab',
  RESUME_TAB: 'ResumeTab',
  APPLICATIONS_TAB: 'ApplicationsTab',
  INTERVIEW_TAB: 'InterviewTab',

  // Jobs stack
  JOB_FEED: 'JobFeed',
  JOB_DETAIL: 'JobDetail',
  MATCH_SCORE: 'MatchScore',

  // Resume stack
  RESUME_LIST: 'ResumeList',
  RESUME_UPLOAD: 'ResumeUpload',
  RESUME_DETAIL: 'ResumeDetail',
  TAILOR_RESUME: 'TailorResume',
  COVER_LETTER: 'CoverLetter',

  // Applications stack
  APPLICATIONS_LIST: 'ApplicationsList',
  APPLICATION_DETAIL: 'ApplicationDetail',

  // Interview stack
  INTERVIEW_START: 'InterviewStart',
  INTERVIEW_QUESTION: 'InterviewQuestion',
  INTERVIEW_REPORT: 'InterviewReport',
} as const;

export const COLORS = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  secondary: '#10B981',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
} as const;

export const SECURE_STORE_KEYS = {
  JWT: 'jwt',
} as const;

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH_GOOGLE: '/api/auth/google',
  RESUMES: '/api/resumes',
  JOBS: '/api/jobs',
  MATCH_SCORE: (resumeId: number, jobId: number) =>
    `/api/match/${resumeId}/${jobId}`,
  TAILOR: '/api/tailor',
  COVER_LETTER: '/api/cover-letter',
  APPLICATIONS: '/api/applications',
  INTERVIEW_QUESTIONS: (applicationId: number) =>
    `/api/interview/${applicationId}/questions`,
  INTERVIEW_SUBMIT: (sessionId: number) =>
    `/api/interview/sessions/${sessionId}/answers`,
  INTERVIEW_REPORT: (sessionId: number) =>
    `/api/interview/sessions/${sessionId}/report`,
} as const;
