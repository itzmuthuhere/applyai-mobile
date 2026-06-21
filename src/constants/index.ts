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
  APPLY_JOB: 'ApplyJob',
  COMPANY_INTEL: 'CompanyIntel',
  SAVED_JOBS: 'SavedJobs',
  JOB_ALERTS: 'JobAlerts',
  COMPANY_PROFILES: 'CompanyProfiles',

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
  INTERVIEW_PREP_PLAN: 'InterviewPrepPlan',

  // Home stack
  ANALYTICS: 'Analytics',
  SALARY_INTEL: 'SalaryIntel',
  NEGOTIATION_COACH: 'NegotiationCoach',
  BLACKLIST: 'Blacklist',
  CAREER_PATH: 'CareerPath',
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
  AUTH_ME: '/api/auth/me',
  PROFILE_UPDATE: '/api/auth/profile',
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
  // Phase 2M
  ANALYTICS_OVERVIEW: '/api/analytics/overview',
  ANALYTICS_RESUME: '/api/analytics/resume-performance',
  SALARY_INTEL: '/api/ai/salary-intel',
  NEGOTIATION: '/api/ai/negotiation',
  INTERVIEW_PREP: '/api/ai/interview-prep',
  COMPANY_INTEL: '/api/ai/company-intel',
  REGISTER_FCM_TOKEN: '/api/notifications/register-token',
  BLACKLIST: '/api/blacklist',
  BLACKLIST_BY_ID: (id: number) => `/api/blacklist/${id}`,
  // New job portal features
  SAVED_JOBS: '/api/jobs/saved',
  SAVE_JOB: (id: number) => `/api/jobs/${id}/save`,
  JOB_SIMILAR: (id: number) => `/api/jobs/${id}/similar`,
  JOB_COMPANIES: '/api/jobs/companies',
  JOB_CATEGORIES: '/api/jobs/categories',
  QUICK_APPLY: (jobId: number) => `/api/applications/quick-apply/${jobId}`,
  APPLICATION_INTERVIEW: (id: number) => `/api/applications/${id}/interview`,
  APPLICATION_OFFER: (id: number) => `/api/applications/${id}/offer`,
  JOB_ALERTS: '/api/alerts',
  JOB_ALERT_BY_ID: (id: number) => `/api/alerts/${id}`,
  ATS_SCORE: '/api/ai/ats-score',
  SKILLS_GAP: '/api/ai/skills-gap',
  CAREER_PATH: '/api/ai/career-path',
  ANALYSE_JOB: '/api/ai/analyse-job',
} as const;

export const PLAN_LIMITS = {
  FREE: { applications: 10, interviews: 2 },
  HUNTER: { applications: 50, interviews: Infinity },
  PRO: { applications: Infinity, interviews: Infinity },
} as const;
