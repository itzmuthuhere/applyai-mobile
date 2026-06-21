import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import {
  MainTabParamList,
  HomeStackParamList,
  JobsStackParamList,
  ResumeStackParamList,
  ApplicationsStackParamList,
  InterviewStackParamList,
} from './types';

import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/home/ProfileScreen';
import AnalyticsScreen from '../screens/home/AnalyticsScreen';
import SalaryIntelScreen from '../screens/home/SalaryIntelScreen';
import NegotiationCoachScreen from '../screens/home/NegotiationCoachScreen';
import BlacklistScreen from '../screens/home/BlacklistScreen';
import ProfileSettingsScreen from '../screens/home/ProfileSettingsScreen';
import PaywallScreen from '../screens/common/PaywallScreen';
import JobFeedScreen from '../screens/jobs/JobFeedScreen';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';
import MatchScoreScreen from '../screens/jobs/MatchScoreScreen';
import ResumeListScreen from '../screens/resume/ResumeListScreen';
import ResumeUploadScreen from '../screens/resume/ResumeUploadScreen';
import ResumeDetailScreen from '../screens/resume/ResumeDetailScreen';
import TailorResumeScreen from '../screens/resume/TailorResumeScreen';
import CoverLetterScreen from '../screens/resume/CoverLetterScreen';
import ApplyJobScreen from '../screens/jobs/ApplyJobScreen';
import CompanyIntelScreen from '../screens/jobs/CompanyIntelScreen';
import SavedJobsScreen from '../screens/jobs/SavedJobsScreen';
import JobAlertsScreen from '../screens/jobs/JobAlertsScreen';
import CompanyProfilesScreen from '../screens/jobs/CompanyProfilesScreen';
import HrPostJobScreen from '../screens/jobs/HrPostJobScreen';
import HrMyJobsScreen from '../screens/jobs/HrMyJobsScreen';
import CareerPathScreen from '../screens/home/CareerPathScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import ApplicationsListScreen from '../screens/applications/ApplicationsListScreen';
import ApplicationDetailScreen from '../screens/applications/ApplicationDetailScreen';
import InterviewPrepPlanScreen from '../screens/applications/InterviewPrepPlanScreen';
import InterviewStartScreen from '../screens/interview/InterviewStartScreen';
import InterviewQuestionScreen from '../screens/interview/InterviewQuestionScreen';
import InterviewReportScreen from '../screens/interview/InterviewReportScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const JobsStack = createNativeStackNavigator<JobsStackParamList>();
const ResumeStack = createNativeStackNavigator<ResumeStackParamList>();
const ApplicationsStack =
  createNativeStackNavigator<ApplicationsStackParamList>();
const InterviewStack = createNativeStackNavigator<InterviewStackParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Profile" component={ProfileSettingsScreen} />
      <HomeStack.Screen name="Analytics" component={AnalyticsScreen} options={{ headerShown: true, title: 'Analytics' }} />
      <HomeStack.Screen name="SalaryIntel" component={SalaryIntelScreen} options={{ headerShown: true, title: 'Salary Intelligence' }} />
      <HomeStack.Screen name="NegotiationCoach" component={NegotiationCoachScreen} options={{ headerShown: true, title: 'Negotiation Coach' }} />
      <HomeStack.Screen name="Blacklist" component={BlacklistScreen} options={{ headerShown: true, title: 'Company Blacklist' }} />
      <HomeStack.Screen name="CareerPath" component={CareerPathScreen} options={{ headerShown: true, title: 'Career Path' }} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Paywall" component={PaywallScreen} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
}

function JobsNavigator() {
  return (
    <JobsStack.Navigator>
      <JobsStack.Screen name="JobFeed" component={JobFeedScreen} options={{ title: 'Jobs' }} />
      <JobsStack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Detail' }} />
      <JobsStack.Screen name="MatchScore" component={MatchScoreScreen} options={{ title: 'Match Score' }} />
      <JobsStack.Screen name="TailorResume" component={TailorResumeScreen} options={{ title: 'Tailor Resume' }} />
      <JobsStack.Screen name="CoverLetter" component={CoverLetterScreen} options={{ title: 'Cover Letter' }} />
      <JobsStack.Screen name="ApplyJob" component={ApplyJobScreen} options={{ title: 'Apply to Job' }} />
      <JobsStack.Screen name="CompanyIntel" component={CompanyIntelScreen} options={{ title: 'Company Intel' }} />
      <JobsStack.Screen name="SavedJobs" component={SavedJobsScreen} options={{ title: 'Saved Jobs' }} />
      <JobsStack.Screen name="JobAlerts" component={JobAlertsScreen} options={{ title: 'Job Alerts' }} />
      <JobsStack.Screen name="CompanyProfiles" component={CompanyProfilesScreen} options={{ title: 'Companies' }} />
      <JobsStack.Screen name="HrPostJob" component={HrPostJobScreen} options={{ headerShown: false }} />
      <JobsStack.Screen name="HrMyJobs" component={HrMyJobsScreen} options={{ title: 'My Job Postings' }} />
    </JobsStack.Navigator>
  );
}

function ResumeNavigator() {
  return (
    <ResumeStack.Navigator>
      <ResumeStack.Screen name="ResumeList" component={ResumeListScreen} options={{ title: 'My Resumes' }} />
      <ResumeStack.Screen name="ResumeUpload" component={ResumeUploadScreen} options={{ title: 'Upload Resume' }} />
      <ResumeStack.Screen name="ResumeDetail" component={ResumeDetailScreen} options={{ title: 'Resume' }} />
      <ResumeStack.Screen name="TailorResume" component={TailorResumeScreen} options={{ title: 'Tailor Resume' }} />
      <ResumeStack.Screen name="CoverLetter" component={CoverLetterScreen} options={{ title: 'Cover Letter' }} />
    </ResumeStack.Navigator>
  );
}

function ApplicationsNavigator() {
  return (
    <ApplicationsStack.Navigator>
      <ApplicationsStack.Screen name="ApplicationsList" component={ApplicationsListScreen} options={{ title: 'Applications' }} />
      <ApplicationsStack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} options={{ title: 'Application' }} />
      <ApplicationsStack.Screen name="InterviewPrepPlan" component={InterviewPrepPlanScreen} options={{ title: 'Prep Plan' }} />
    </ApplicationsStack.Navigator>
  );
}

function InterviewNavigator() {
  return (
    <InterviewStack.Navigator>
      <InterviewStack.Screen name="InterviewStart" component={InterviewStartScreen} options={{ title: 'Mock Interview' }} />
      <InterviewStack.Screen name="InterviewQuestion" component={InterviewQuestionScreen} options={{ title: 'Interview' }} />
      <InterviewStack.Screen name="InterviewReport" component={InterviewReportScreen} options={{ title: 'Your Results' }} />
    </InterviewStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline',
            JobsTab: 'briefcase-outline',
            ResumeTab: 'document-text-outline',
            ApplicationsTab: 'list-outline',
            InterviewTab: 'mic-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="JobsTab" component={JobsNavigator} options={{ tabBarLabel: 'Jobs' }} />
      <Tab.Screen name="ResumeTab" component={ResumeNavigator} options={{ tabBarLabel: 'Resume' }} />
      <Tab.Screen name="ApplicationsTab" component={ApplicationsNavigator} options={{ tabBarLabel: 'Applications' }} />
      <Tab.Screen name="InterviewTab" component={InterviewNavigator} options={{ tabBarLabel: 'Interview' }} />
    </Tab.Navigator>
  );
}
