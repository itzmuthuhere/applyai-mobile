export type SubscriptionPlan = 'FREE' | 'HUNTER' | 'PRO';
export type AutoApplyStatus = 'PENDING' | 'APPLYING' | 'APPLIED' | 'FAILED' | 'SKIPPED';
export type ProfileStrengthLabel = 'Beginner' | 'Developing' | 'Intermediate' | 'Advanced' | 'Expert' | 'All-Star';
export type ProfileHintSection = 'BASIC' | 'EXPERIENCE' | 'EDUCATION' | 'CERTIFICATIONS' | 'SKILLS' | 'PREFERENCES' | 'SOCIAL';

export interface ProfileHint {
  key: string;
  label: string;
  points: number;
  section: ProfileHintSection;
}

export interface AutoApplyQueueItem {
  id: number;
  jobId: number;
  jobTitle: string;
  company: string;
  location: string | null;
  sourceUrl: string | null;
  status: AutoApplyStatus;
  matchScore: number | null;
  tailoredResumeText: string | null;
  tailoredCoverLetterText: string | null;
  queuedAt: string;
  appliedAt: string | null;
}
export type RemotePreference = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'ANY';
export type UserRole = 'JOBSEEKER' | 'HR';
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
  role: UserRole;
  headline: string | null;
  phone: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  yearsOfExperience: number | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  twitterUrl: string | null;
  targetRole: string | null;
  targetLocation: string | null;
  minSalary: number | null;
  remotePreference: RemotePreference | null;
  profilePicture: string | null;
  skills: string | null;
  followersCount: number;
  followingCount: number;
  completenessScore: number;
  profileStrengthLabel: ProfileStrengthLabel;
  completenessHints: ProfileHint[];
  createdAt: string;
}

export interface Experience {
  id: number;
  company: string;
  title: string;
  location: string | null;
  startMonth: number | null;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  current: boolean;
  description: string | null;
  createdAt: string;
}

export interface Education {
  id: number;
  school: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  current: boolean;
  grade: string | null;
  description: string | null;
  createdAt: string;
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  issueDate: string | null;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  createdAt: string;
}

export interface FullProfile extends User {
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
}

export interface DashboardSummary {
  resumeCount: number;
  applicationCount: number;
  interviewCount: number;
  avgMatchScore: number | null;
  avgInterviewScore: number | null;
  applicationsByStatus: Record<string, number>;
  recentApplications: Array<{
    id: number;
    jobTitle: string;
    company: string;
    status: string;
    appliedAt: string | null;
  }>;
}

export interface HrJob {
  id: number;
  title: string;
  company: string;
  location: string | null;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  isRemote: boolean | null;
  category: string | null;
  tags: string | null;
  deadline: string | null;
  scrapedAt: string;
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
  skills?: string | null;
  experienceYears?: number | null;
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
  deadline: string | null;
  category: string | null;
  tags: string | null;
  matchScore?: number | null;
  saved?: boolean | null;
  scrapedAt: string;
}

export interface JobAlert {
  id: number;
  keywords: string | null;
  remote: boolean | null;
  minSalary: number | null;
  category: string | null;
  active: boolean;
  createdAt: string;
}

export interface CompanyProfile {
  company: string;
  jobCount: number;
  avgSalary: number | null;
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
  applicationMethod?: 'IN_APP' | 'QUICK_APPLY' | 'EXTENSION';
  appliedAt: string | null;
  lastUpdated: string | null;
  notes: string | null;
  coverLetter: string | null;
  interviewDate: string | null;
  interviewNotes: string | null;
  offerSalary: number | null;
  offerDeadline: string | null;
  offerDetails: string | null;
  job: { id: number | null; title: string; company: string; location: string | null };
  resume: { id: number; versionName: string } | null;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  questionType: string;
  sequenceOrder: number;
  transcript: string | null;
  aiScore: number | null;
  aiFeedback: string | null;
}

export interface InterviewSession {
  sessionId: number;
  applicationId: number;
  jobTitle: string;
  company: string;
  overallScore: number | null;
  completedAt: string | null;
  createdAt: string;
  questions: InterviewQuestion[];
}

export interface InterviewAnswerResponse {
  questionId: number;
  question: string;
  answerText: string;
  audioUrl: string | null;
  aiScore: number;
  aiFeedback: string;
  sessionComplete: boolean;
  overallScore: number | null;
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
