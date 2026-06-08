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
  JOB_FEED: '/api/jobs/feed',
  JOB_BY_ID: (id: number) => `/api/jobs/${id}`,
  RESUME_UPLOAD: '/api/resumes/upload',
  RESUME_PARSE: '/api/ai/resume-parse',
  RESUME_SCORE: '/api/ai/resume-score',
  JOBS: '/api/jobs',
  MATCH_SCORE: '/api/ai/match',
  TAILOR: '/api/resumes/tailor',
  COVER_LETTER: '/api/resumes/cover-letter',
  APPLICATIONS: '/api/applications',
  APPLICATIONS_APPLY: '/api/applications/apply',
  APPLICATION_BY_ID: (id: number) => `/api/applications/${id}`,
  APPLICATION_STATUS: (id: number) => `/api/applications/${id}/status`,
  INTERVIEW_START: '/api/interviews/start',
  INTERVIEW_BY_ID: (sessionId: number) => `/api/interviews/${sessionId}`,
  INTERVIEW_HISTORY: '/api/interviews/history',
  INTERVIEW_ANSWER: (sessionId: number) => `/api/interviews/${sessionId}/answer`,
} as const;
