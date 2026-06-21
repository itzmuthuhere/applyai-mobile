import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RootState, AppDispatch } from '../../store';
import { setResumes } from '../../store/slices/resumeSlice';
import { setApplications } from '../../store/slices/applicationSlice';
import { setHistory } from '../../store/slices/interviewSlice';
import { COLORS, API_ENDPOINTS } from '../../constants';
import apiClient from '../../api/apiClient';
import { DashboardSummary } from '../../types/api.types';

dayjs.extend(relativeTime);

const PLAN_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  FREE:   { bg: '#F1F5F9', text: '#64748B', label: 'Free' },
  HUNTER: { bg: '#DBEAFE', text: '#2563EB', label: 'Hunter' },
  PRO:    { bg: '#FEF3C7', text: '#D97706', label: 'Pro' },
};

const STATUS_COLORS: Record<string, { dot: string; label: string }> = {
  APPLIED:     { dot: '#3B82F6', label: 'Applied' },
  VIEWED:      { dot: '#94A3B8', label: 'Viewed' },
  SHORTLISTED: { dot: '#F59E0B', label: 'Shortlisted' },
  INTERVIEW:   { dot: '#10B981', label: 'Interview' },
  OFFER:       { dot: '#059669', label: 'Offer' },
  REJECTED:    { dot: '#EF4444', label: 'Rejected' },
  WITHDRAWN:   { dot: '#CBD5E1', label: 'Withdrawn' },
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const resumeList = useSelector((s: RootState) => s.resume.list);
  const applicationList = useSelector((s: RootState) => s.application.list);
  const interviewHistory = useSelector((s: RootState) => s.interview.history);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const plan = user?.subscriptionPlan ?? 'FREE';
  const planConfig = PLAN_CONFIG[plan] ?? PLAN_CONFIG.FREE;
  const isHr = user?.role === 'HR';

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const [summaryRes, resumesRes, appsRes, interviewsRes] = await Promise.allSettled([
        apiClient.get<DashboardSummary>(API_ENDPOINTS.DASHBOARD_SUMMARY),
        apiClient.get(API_ENDPOINTS.RESUMES),
        apiClient.get(`${API_ENDPOINTS.APPLICATIONS}?page=0&size=50`),
        apiClient.get(API_ENDPOINTS.INTERVIEW_HISTORY),
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      if (resumesRes.status === 'fulfilled') dispatch(setResumes(resumesRes.value.data));
      if (appsRes.status === 'fulfilled') dispatch(setApplications(appsRes.value.data.content ?? []));
      if (interviewsRes.status === 'fulfilled') dispatch(setHistory(interviewsRes.value.data ?? []));
    } catch {}
    if (isRefresh) setIsRefreshing(false);
  }, [dispatch]);

  // Only refresh from API if data is empty (first load after preloading may have populated it)
  useEffect(() => {
    if (!summary) loadDashboard();
  }, []);

  const onRefresh = () => loadDashboard(true);

  const resumeCount = summary?.resumeCount ?? resumeList.length;
  const appCount = summary?.applicationCount ?? applicationList.length;
  const interviewCount = summary?.interviewCount ?? interviewHistory.length;
  const recentApps = summary?.recentApplications ?? [];
  const score = user?.completenessScore ?? 0;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Hero Header ── */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
            {user?.headline && (
              <Text style={styles.headline} numberOfLines={1}>{user.headline}</Text>
            )}
            <View style={[styles.planBadge, { backgroundColor: planConfig.bg }]}>
              <Ionicons name="flash" size={11} color={planConfig.text} />
              <Text style={[styles.planText, { color: planConfig.text }]}>{planConfig.label} Plan</Text>
            </View>
          </View>
          <View style={styles.heroRight}>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.75}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
              <View style={styles.bellBadge} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Profile Completeness Banner ── */}
        {score < 80 && (
          <TouchableOpacity
            style={styles.completenessBar}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <View style={styles.completenessLeft}>
              <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
              <View>
                <Text style={styles.completenessTitle}>Complete your profile</Text>
                <Text style={styles.completenessSubtitle}>
                  {score}% done · tap to improve
                </Text>
              </View>
            </View>
            <View style={styles.completenessRight}>
              <View style={styles.progressOuter}>
                <View style={[styles.progressFill, { width: `${score}%` as any }]} />
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── HR Mode Banner ── */}
        {isHr && (
          <TouchableOpacity
            style={styles.hrBanner}
            onPress={() => navigation.navigate('JobsTab', { screen: 'HrMyJobs' })}
            activeOpacity={0.85}
          >
            <Ionicons name="business-outline" size={20} color="#fff" />
            <Text style={styles.hrBannerText}>HR Mode Active — Tap to manage your job postings</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <StatCard icon="document-text" color="#2563EB" label="Resumes" value={resumeCount} />
          <StatCard icon="briefcase" color="#10B981" label="Applied" value={appCount} />
          <StatCard icon="mic" color="#F59E0B" label="Interviews" value={interviewCount} />
          {summary?.avgMatchScore != null && (
            <StatCard icon="star" color="#8B5CF6" label="Avg Match" value={`${summary.avgMatchScore}%`} />
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionCard
              icon="cloud-upload-outline"
              label="Upload Resume"
              subtitle="AI analysis"
              color="#2563EB"
              onPress={() => navigation.navigate('ResumeTab', { screen: 'ResumeUpload' })}
            />
            <ActionCard
              icon="search-outline"
              label="Browse Jobs"
              subtitle={`${appCount} applied`}
              color="#10B981"
              onPress={() => navigation.navigate('JobsTab', { screen: 'JobFeed' })}
            />
            <ActionCard
              icon="mic-circle-outline"
              label="Mock Interview"
              subtitle="AI coaching"
              color="#F59E0B"
              onPress={() => navigation.navigate('InterviewTab', { screen: 'InterviewStart' })}
            />
            <ActionCard
              icon="list-circle-outline"
              label="Applications"
              subtitle="Track status"
              color="#8B5CF6"
              onPress={() => navigation.navigate('ApplicationsTab', { screen: 'ApplicationsList' })}
            />
            {isHr && (
              <ActionCard
                icon="add-circle-outline"
                label="Post a Job"
                subtitle="HR posting"
                color="#059669"
                onPress={() => navigation.navigate('JobsTab', { screen: 'HrPostJob' })}
              />
            )}
          </View>
        </View>

        {/* ── Recent Applications ── */}
        {recentApps.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Applications</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ApplicationsTab', { screen: 'ApplicationsList' })}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentApps.map(app => {
              const sc = STATUS_COLORS[app.status] ?? STATUS_COLORS.APPLIED;
              return (
                <TouchableOpacity
                  key={app.id}
                  style={styles.appCard}
                  onPress={() => navigation.navigate('ApplicationsTab', { screen: 'ApplicationDetail', params: { applicationId: app.id } })}
                  activeOpacity={0.75}
                >
                  <View style={styles.appIconWrap}>
                    <Text style={styles.appIconText}>{app.company.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.appBody}>
                    <Text style={styles.appTitle} numberOfLines={1}>{app.jobTitle}</Text>
                    <Text style={styles.appCompany} numberOfLines={1}>{app.company}</Text>
                  </View>
                  <View style={styles.appRight}>
                    <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                    <Text style={styles.appStatus}>{sc.label}</Text>
                    {app.appliedAt && (
                      <Text style={styles.appDate}>{dayjs(app.appliedAt).fromNow(true)}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── AI Tools ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Career Tools</Text>
          <View style={styles.aiToolsGrid}>
            <AiToolCard
              icon="cash-outline"
              label="Salary Intel"
              color="#F59E0B"
              onPress={() => navigation.navigate('SalaryIntel')}
            />
            <AiToolCard
              icon="trending-up-outline"
              label="Negotiate"
              color="#10B981"
              onPress={() => navigation.navigate('NegotiationCoach')}
            />
            <AiToolCard
              icon="bar-chart-outline"
              label="Analytics"
              color="#2563EB"
              onPress={() => navigation.navigate('Analytics')}
            />
            <AiToolCard
              icon="rocket-outline"
              label="Career Path"
              color="#8B5CF6"
              onPress={() => navigation.navigate('CareerPath', { resumeId: undefined })}
            />
          </View>
        </View>

        {/* ── First-time state ── */}
        {resumeCount === 0 && appCount === 0 && (
          <View style={styles.onboardCard}>
            <Text style={styles.onboardTitle}>Get started in 3 steps 🚀</Text>
            <OnboardStep step="1" text="Upload your resume for AI scoring" done={false} />
            <OnboardStep step="2" text="Browse and apply to jobs" done={false} />
            <OnboardStep step="3" text="Practice with AI mock interviews" done={false} />
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, color, label, value }: { icon: any; color: string; label: string; value: number | string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({ icon, label, subtitle, color, onPress }: {
  icon: any; label: string; subtitle: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function AiToolCard({ icon, label, color, onPress }: {
  icon: any; label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.aiCard} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.aiLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function OnboardStep({ step, text, done }: { step: string; text: string; done: boolean }) {
  return (
    <View style={styles.onboardStep}>
      <View style={[styles.onboardBullet, done && styles.onboardBulletDone]}>
        {done
          ? <Ionicons name="checkmark" size={12} color="#fff" />
          : <Text style={styles.onboardBulletText}>{step}</Text>
        }
      </View>
      <Text style={[styles.onboardStepText, done && styles.onboardStepTextDone]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // Hero
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  heroLeft: { flex: 1, marginRight: 12 },
  heroRight: { alignItems: 'center', gap: 8 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: COLORS.surface,
  },
  greeting: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  headline: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  planText: { fontSize: 12, fontWeight: '700' },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: COLORS.primary },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 22, fontWeight: '700' },

  // Completeness banner
  completenessBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  completenessLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  completenessTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  completenessSubtitle: { fontSize: 12, color: '#3B82F6', marginTop: 1 },
  completenessRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressOuter: { width: 60, height: 5, backgroundColor: '#BFDBFE', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: COLORS.primary, borderRadius: 3 },

  // HR Banner
  hrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#059669',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hrBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 5,
  },
  statIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500', textAlign: 'center' },

  // Sections
  section: { paddingHorizontal: 16, paddingTop: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  // Action cards
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '47.5%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  actionIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  actionSub: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

  // Recent applications
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  appIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: { fontSize: 17, fontWeight: '700', color: COLORS.primary },
  appBody: { flex: 1 },
  appTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  appCompany: { fontSize: 12, color: COLORS.textSecondary },
  appRight: { alignItems: 'flex-end', gap: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  appStatus: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  appDate: { fontSize: 10, color: COLORS.textMuted },

  // AI tools
  aiToolsGrid: { flexDirection: 'row', gap: 10 },
  aiCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },

  // Onboarding
  onboardCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  onboardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  onboardStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  onboardBullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardBulletDone: { backgroundColor: COLORS.success },
  onboardBulletText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  onboardStepText: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  onboardStepTextDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
});
