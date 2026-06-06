import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  GoogleSignIn: undefined;
};

export type JobsStackParamList = {
  JobFeed: undefined;
  JobDetail: { jobId: number };
  MatchScore: { jobId: number; resumeId: number };
};

export type ResumeStackParamList = {
  ResumeList: undefined;
  ResumeUpload: undefined;
  ResumeDetail: { resumeId: number };
  TailorResume: { resumeId: number; jobId: number };
  CoverLetter: { resumeId: number; jobId: number };
};

export type ApplicationsStackParamList = {
  ApplicationsList: undefined;
  ApplicationDetail: { applicationId: number };
};

export type InterviewStackParamList = {
  InterviewStart: { applicationId: number };
  InterviewQuestion: { sessionId: number; questionIndex: number };
  InterviewReport: { sessionId: number };
};

export type MainTabParamList = {
  Home: undefined;
  JobsTab: NavigatorScreenParams<JobsStackParamList>;
  ResumeTab: NavigatorScreenParams<ResumeStackParamList>;
  ApplicationsTab: NavigatorScreenParams<ApplicationsStackParamList>;
  InterviewTab: NavigatorScreenParams<InterviewStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
