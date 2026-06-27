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
  // HR stack
  HR_POST_JOB: 'HrPostJob',
  HR_MY_JOBS: 'HrMyJobs',
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
  // Dashboard
  DASHBOARD_SUMMARY: '/api/dashboard/summary',
  // HR
  HR_POST_JOB: '/api/hr/jobs',
  HR_MY_JOBS: '/api/hr/my-jobs',
  HR_DELETE_JOB: (id: number) => `/api/hr/jobs/${id}`,
  // Auto Apply
  AUTO_APPLY_QUEUE: '/api/auto-apply/queue',
  AUTO_APPLY_QUEUE_PENDING: '/api/auto-apply/queue/pending',
  AUTO_APPLY_STATUS: (id: number) => `/api/auto-apply/${id}/status`,
  AUTO_APPLY_DELETE: (id: number) => `/api/auto-apply/${id}`,
  AUTO_APPLY_COUNT: '/api/auto-apply/count',
  // Social Feed
  FEED: '/api/feed',
  FEED_POST: (postId: number) => `/api/feed/${postId}`,
  FEED_REACT: (postId: number) => `/api/feed/${postId}/react`,
  FEED_COMMENTS: (postId: number) => `/api/feed/${postId}/comments`,
  FEED_COMMENT: (postId: number, commentId: number) => `/api/feed/${postId}/comments/${commentId}`,
  FEED_COMMENT_DELETE: (postId: number, commentId: number) => `/api/feed/${postId}/comments/${commentId}`,
  FEED_MEDIA: '/api/feed/media',
  FEED_HASHTAG: (tag: string) => `/api/feed/hashtag/${tag}`,
  // Chat
  CHAT_CONVERSATIONS: '/api/chat/conversations',
  CHAT_MESSAGES: '/api/chat/messages',
  CHAT_MESSAGE_BY_ID: (id: number) => `/api/chat/messages/${id}`,
  CHAT_REACT: (id: number) => `/api/chat/messages/${id}/react`,
  CHAT_READ: '/api/chat/read',
  CHAT_UPLOAD: '/api/chat/upload',
  // Public profiles
  PUBLIC_PROFILE: (userId: number) => `/api/users/${userId}/profile`,
  USER_POSTS: (userId: number) => `/api/users/${userId}/posts`,
  USER_SEARCH: '/api/users/search',
  // Follow
  FOLLOW: (userId: number) => `/api/users/${userId}/follow`,
  IS_FOLLOWING: (userId: number) => `/api/users/${userId}/is-following`,
  USER_FOLLOWERS: (userId: number) => `/api/users/${userId}/followers`,
  USER_FOLLOWING: (userId: number) => `/api/users/${userId}/following`,
  // Social Notifications
  SOCIAL_NOTIFICATIONS: '/api/notifications/social',
  SOCIAL_NOTIFICATIONS_UNREAD: '/api/notifications/social/unread-count',
  SOCIAL_NOTIFICATIONS_READ_ALL: '/api/notifications/social/read-all',
  SOCIAL_NOTIFICATION_READ: (id: number) => `/api/notifications/social/${id}/read`,
  // Search
  FEED_SEARCH: '/api/feed/search',
  FEED_HASHTAGS_SUGGEST: '/api/feed/hashtags/suggest',
  // Profile picture
  PROFILE_PICTURE_UPLOAD: '/api/auth/profile/picture',
  // Full profile (experience, education, certifications)
  PROFILE: '/api/profile',
  PROFILE_EXPERIENCE: '/api/profile/experience',
  PROFILE_EXPERIENCE_BY_ID: (id: number) => `/api/profile/experience/${id}`,
  PROFILE_EDUCATION: '/api/profile/education',
  PROFILE_EDUCATION_BY_ID: (id: number) => `/api/profile/education/${id}`,
  PROFILE_CERTIFICATIONS: '/api/profile/certifications',
  PROFILE_CERTIFICATION_BY_ID: (id: number) => `/api/profile/certifications/${id}`,
} as const;

export const PLAN_LIMITS = {
  FREE: { applications: 10, interviews: 2 },
  HUNTER: { applications: 50, interviews: Infinity },
  PRO: { applications: Infinity, interviews: Infinity },
} as const;
