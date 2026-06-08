export type SubscriptionPlan = 'FREE' | 'HUNTER' | 'PRO';
export type RemotePreference = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'ANY';
export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED';

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
  createdAt: string;
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
  remoteType: RemotePreference;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string;
  requiredSkills: string[];
  postedAt: string;
  sourceUrl: string | null;
}

export interface MatchScore {
  resumeId: number;
  jobId: number;
  overallScore: number;
  skillMatchScore: number;
  experienceScore: number;
  educationScore: number;
  missingSkills: string[];
  matchingSkills: string[];
  recommendation: string;
}

export interface TailoredResume {
  resumeId: number;
  jobId: number;
  tailoredContent: string;
  changes: string[];
}

export interface CoverLetter {
  resumeId: number;
  jobId: number;
  content: string;
}

export interface Application {
  id: number;
  userId: number;
  jobId: number;
  resumeId: number;
  status: ApplicationStatus;
  appliedAt: string | null;
  notes: string | null;
  job: Job;
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
