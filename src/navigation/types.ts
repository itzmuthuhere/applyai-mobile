import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  GoogleSignIn: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Profile: undefined;
  Analytics: undefined;
  SalaryIntel: undefined;
  NegotiationCoach: undefined;
  Paywall: { feature?: string };
  Blacklist: undefined;
  CareerPath: { resumeId: number };
};

export type JobsStackParamList = {
  JobFeed: undefined;
  JobDetail: { jobId: number };
  MatchScore: { jobId: number };
  TailorResume: { jobId: number; resumeId?: number };
  CoverLetter: { jobId: number; resumeId?: number };
  ApplyJob: { jobId: number };
  CompanyIntel: { companyName: string; jobTitle?: string };
  SavedJobs: undefined;
  JobAlerts: undefined;
  CompanyProfiles: undefined;
};

export type ResumeStackParamList = {
  ResumeList: undefined;
  ResumeUpload: undefined;
  ResumeDetail: { resumeId: number };
  TailorResume: { jobId: number; resumeId?: number };
  CoverLetter: { jobId: number; resumeId?: number };
};

export type ApplicationsStackParamList = {
  ApplicationsList: undefined;
  ApplicationDetail: { applicationId: number };
  InterviewPrepPlan: { applicationId: number };
};

export type InterviewStackParamList = {
  InterviewStart: { applicationId?: number } | undefined;
  InterviewQuestion: { sessionId: number; questionIndex: number };
  InterviewReport: { sessionId: number };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  JobsTab: NavigatorScreenParams<JobsStackParamList>;
  ResumeTab: NavigatorScreenParams<ResumeStackParamList>;
  ApplicationsTab: NavigatorScreenParams<ApplicationsStackParamList>;
  InterviewTab: NavigatorScreenParams<InterviewStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
