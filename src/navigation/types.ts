import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  GoogleSignIn: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Profile: undefined;
  ProfileSettings: undefined;
  Analytics: undefined;
  SalaryIntel: undefined;
  NegotiationCoach: undefined;
  Paywall: { feature?: string };
  Blacklist: undefined;
  CareerPath: { resumeId?: number };
  Notifications: undefined;
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
  HrPostJob: undefined;
  HrMyJobs: undefined;
  AutoApplyQueue: undefined;
};

export type ResumeStackParamList = {
  ResumeList: undefined;
  ResumeUpload: undefined;
  ResumeDetail: { resumeId: number };
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

export type FeedStackParamList = {
  Feed: undefined;
  CreatePost: undefined;
  PostDetail: { postId: number };
  PublicProfile: { userId: number; userName?: string };
  ChatList: undefined;
  ChatDetail: { partnerId: number; partnerName: string; partnerPicture?: string };
  SocialNotifications: undefined;
  Followers: { userId: number; userName?: string };
  Following: { userId: number; userName?: string };
  HashtagFeed: { tag: string };
  Search: { initialQuery?: string } | undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  FeedTab: NavigatorScreenParams<FeedStackParamList>;
  JobsTab: NavigatorScreenParams<JobsStackParamList>;
  ResumeTab: NavigatorScreenParams<ResumeStackParamList>;
  ApplicationsTab: NavigatorScreenParams<ApplicationsStackParamList>;
  InterviewTab: NavigatorScreenParams<InterviewStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
