export type SubscriptionPlan = 'FREE' | 'HUNTER' | 'PRO';
export type RemotePreference = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'ANY';
export type ApplicationStatus =
  | 'APPLIED'
  | 'VIEWED'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface User {
  id: number;
  email: string;
  name: string;
  googleId: string;
  subscriptionPlan: SubscriptionPlan;
  targetRole: string | null;
  targetLocation: string | null;
  minSalary: number | null;
  remotePreference: RemotePreference | null;
  profilePicture: string | null;
  createdAt: string;
}

export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface Resume {
  id: number;
  versionName: string;
  fileUrl: string;
  aiScore: number | null;
  isOriginal: boolean;
  isParsed: boolean;
  createdAt: string;
}

export interface ParsedResume {
  skills: string[];
  experienceYears: number;
  education: string;
  techStack: string[];
  summary: string;
}

export interface ResumeScore {
  score: number;
  strengths: string[];
  improvements: string[];
}

export interface ResumeUploadResponse {
  resumeId: number;
  fileUrl: string;
  versionName: string;
  message: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  source: string | null;
  sourceUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  isRemote: boolean | null;
  postedDate: string | null;
  scrapedAt: string;
}

export interface JobFeedResponse {
  content: Job[];
  page: number;
  size: number;
  totalElements: number;
}

export interface MatchScore {
  matchId: number;
  resumeId: number;
  jobId: number;
  jobTitle: string;
  company: string;
  matchScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  createdAt: string;
  cached: boolean;
}

export interface TailoredResumeResponse {
  newResumeId: number;
  versionName: string;
  tailoredText: string;
  changes: string[];
}

export interface CoverLetterResponse {
  coverLetter: string;
}

export interface Application {
  id: number;
  status: ApplicationStatus;
  appliedAt: string | null;
  lastUpdated: string | null;
  notes: string | null;
  coverLetter: string | null;
  job: { id: number; title: string; company: string; location: string };
  resume: { id: number; versionName: string };
}

export interface InterviewQuestion {
  id: number;
  questionText: string;
  category: string;
  difficulty: string;
}

export interface InterviewSession {
  id: number;
  applicationId: number;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  overallScore: number | null;
  completedAt: string | null;
  createdAt: string;
}

export interface InterviewAnswer {
  questionId: number;
  transcription: string;
  score: number;
  feedback: string;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
