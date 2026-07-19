import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

// Maps every screen to a real URL path. This mainly matters for the web build —
// react-native-web uses this to drive the browser's address bar and back/forward
// history (bookmarkable job/resume/application URLs). `prefixes` is left empty:
// there's no existing native deep-link scheme to preserve, so this makes zero
// behavior change on iOS/Android (same as having no linking config at all).
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Auth: {
        screens: {
          Splash: 'splash',
          Onboarding: 'onboarding',
          GoogleSignIn: 'login',
        },
      },
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Home: 'home',
              Profile: 'profile',
              ProfileSettings: 'profile/settings',
              Analytics: 'analytics',
              SalaryIntel: 'salary-intel',
              NegotiationCoach: 'negotiation-coach',
              Paywall: 'paywall',
              Blacklist: 'blacklist',
              CareerPath: 'career-path',
              Notifications: 'notifications',
            },
          },
          JobsTab: {
            screens: {
              JobFeed: 'jobs',
              JobDetail: 'jobs/:jobId',
              MatchScore: 'jobs/:jobId/match',
              TailorResume: 'jobs/:jobId/tailor',
              CoverLetter: 'jobs/:jobId/cover-letter',
              ApplyJob: 'jobs/:jobId/apply',
              CompanyIntel: 'jobs/company/:companyName',
              SavedJobs: 'jobs/saved',
              JobAlerts: 'jobs/alerts',
              CompanyProfiles: 'companies',
              HrPostJob: 'hr/post',
              HrMyJobs: 'hr/my-jobs',
              AutoApplyQueue: 'jobs/auto-apply-queue',
            },
          },
          ResumeTab: {
            screens: {
              ResumeList: 'resumes',
              ResumeUpload: 'resumes/upload',
              ResumeDetail: 'resumes/:resumeId',
            },
          },
          ApplicationsTab: {
            screens: {
              ApplicationsList: 'applications',
              ApplicationDetail: 'applications/:applicationId',
              InterviewPrepPlan: 'applications/:applicationId/prep-plan',
            },
          },
          InterviewTab: {
            screens: {
              InterviewStart: 'interview',
              InterviewQuestion: 'interview/:sessionId/question/:questionIndex',
              InterviewReport: 'interview/:sessionId/report',
            },
          },
        },
      },
    },
  },
};
