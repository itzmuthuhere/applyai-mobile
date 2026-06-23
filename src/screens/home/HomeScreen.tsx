import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, SafeAreaView, RefreshControl, Animated,
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

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

const PLAN_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  FREE:   { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', icon: 'person-outline',  label: 'Free' },
  HUNTER: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE', icon: 'flash',           label: 'Hunter' },
  PRO:    { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: 'rocket',           label: 'Pro' },
};

const STATUS_COLORS: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  APPLIED:     { dot: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8', label: 'Applied' },
  VIEWED:      { dot: '#94A3B8', bg: '#F8FAFC', text: '#475569', label: 'Viewed' },
  SHORTLISTED: { dot: '#F59E0B', bg: '#FFFBEB', text: '#B45309', label: 'Shortlisted' },
  INTERVIEW:   { dot: '#10B981', bg: '#D1FAE5', text: '#065F46', label: 'Interview' },
  OFFER:       { dot: '#059669', bg: '#D1FAE5', text: '#064E3B', label: 'Offer!' },
  REJECTED:    { dot: '#EF4444', bg: '#FEF2F2', text: '#991B1B', label: 'Rejected' },
  WITHDRAWN:   { dot: '#CBD5E1', bg: '#F8FAFC', text: '#94A3B8', label: 'Withdrawn' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SkeletonPulse({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);
  return <Animated.View style={{ width: w as any, height: h, borderRadius: r, backgroundColor: COLORS.border, opacity }} />;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const resumeList = useSelector((s: RootState) => s.resume.list);
  const applicationList = useSelector((s: RootState) => s.application.list);
  const interviewHistory = useSelector((s: RootState) => s.interview.history);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dashError, setDashError] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const plan = user?.subscriptionPlan ?? 'FREE';
  const planCfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.FREE;
  const isHr = user?.role === 'HR';
  const score = user?.completenessScore ?? 0;

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
      else if (summaryRes.status === 'rejected') setDashError(true);
      if (resumesRes.status === 'fulfilled') dispatch(setResumes(resumesRes.value?.data ?? []));
      if (appsRes.status === 'fulfilled') dispatch(setApplications(appsRes.value?.data?.content ?? []));
      if (interviewsRes.status === 'fulfilled') dispatch(setHistory(interviewsRes.value?.data ?? []));
    } catch {}
    setInitialLoading(false);
    if (isRefresh) setIsRefreshing(false);
  }, [dispatch]);

  useEffect(() => { if (!summary) loadDashboard(); }, []);

  const resumeCount = summary?.resumeCount ?? resumeList.length;
  const appCount = summary?.applicationCount ?? applicationList.length;
  const interviewCount = summary?.interviewCount ?? interviewHistory.length;
  const recentApps = summary?.recentApplications ?? [];

  const STATS = [
    { icon: 'document-text' as const, color: '#2563EB', bg: '#EFF6FF', label: 'Resumes', value: resumeCount },
    { icon: 'briefcase' as const, color: '#10B981', bg: '#D1FAE5', label: 'Applied', value: appCount },
    { icon: 'mic' as const, color: '#F59E0B', bg: '#FFFBEB', label: 'Interviews', value: interviewCount },
    ...(summary?.avgMatchScore != null
      ? [{ icon: 'star' as const, color: '#8B5CF6', bg: '#EDE9FE', label: 'Avg Match', value: `${summary.avgMatchScore}%` }]
      : []),
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadDashboard(true)} tintColor={COLORS.primary} />}
      >

        {/* ── Hero Header ── */}
        <View style={styles.hero}>
          <View style={styles.heroAccent} />
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>{firstName} 👋</Text>
              {user?.headline ? (
                <Text style={styles.headline} numberOfLines={1}>{user.headline}</Text>
              ) : null}
              <View testID={`plan-badge-${plan}`} style={[styles.planBadge, { backgroundColor: planCfg.bg, borderColor: planCfg.border }]}>
                <Ionicons name={planCfg.icon as any} size={11} color={planCfg.text} />
                <Text style={[styles.planText, { color: planCfg.text }]}>{planCfg.label} Plan</Text>
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
                  <View style={[styles.avatarFallback, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Profile Completeness ── */}
        {score < 80 && (
          <TouchableOpacity style={styles.completenessBanner} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
            <View style={[styles.completenessIcon, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="person" size={14} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.completenessTitle}>Complete your profile — {score}% done</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${score}%` as any }]} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* ── HR Mode Banner ── */}
        {isHr && (
          <TouchableOpacity
            style={styles.hrBanner}
            onPress={() => navigation.navigate('JobsTab', { screen: 'HrMyJobs' })}
            activeOpacity={0.85}
          >
            <View style={styles.hrBannerIcon}>
              <Ionicons name="business" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hrBannerTitle}>HR Mode Active</Text>
              <Text style={styles.hrBannerSub}>Tap to manage your job postings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ── Stats Row ── */}
        <View style={styles.statsSection}>
          {initialLoading ? (
            <View testID="dashboard-loading" style={styles.statsRow}>
              {[1, 2, 3, 4].map(k => (
                <View key={k} style={styles.statCard}>
                  <SkeletonPulse w={32} h={32} r={10} />
                  <SkeletonPulse w={36} h={22} />
                  <SkeletonPulse w={48} h={10} />
                </View>
              ))}
            </View>
          ) : dashError ? (
            <View testID="dashboard-error" style={styles.errorBanner}>
              <Ionicons name="cloud-offline-outline" size={20} color={COLORS.error} />
              <Text style={styles.errorBannerText}>Could not load dashboard. Pull to refresh.</Text>
            </View>
          ) : (
            <View testID="status-breakdown" style={styles.statsRow}>
              {STATS.map(s => (
                <View key={s.label} style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={17} color={s.color} />
                  </View>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: 'cloud-upload-outline' as const, label: 'Upload Resume', sub: 'AI scoring', color: '#2563EB', onPress: () => navigation.navigate('ResumeTab', { screen: 'ResumeUpload' }) },
              { icon: 'search-outline' as const, label: 'Browse Jobs', sub: `${appCount} applied`, color: '#10B981', onPress: () => navigation.navigate('JobsTab', { screen: 'JobFeed' }) },
              { icon: 'mic-circle-outline' as const, label: 'Mock Interview', sub: 'AI coaching', color: '#F59E0B', onPress: () => navigation.navigate('InterviewTab', { screen: 'InterviewStart' }) },
              { icon: 'list-circle-outline' as const, label: 'Applications', sub: 'Track status', color: '#8B5CF6', onPress: () => navigation.navigate('ApplicationsTab', { screen: 'ApplicationsList' }) },
              ...(isHr ? [{ icon: 'add-circle-outline' as const, label: 'Post a Job', sub: 'HR posting', color: '#059669', onPress: () => navigation.navigate('JobsTab', { screen: 'HrPostJob' }) }] : []),
            ].map(item => (
              <TouchableOpacity key={item.label} style={styles.actionCard} onPress={item.onPress} activeOpacity={0.8}>
                <View style={[styles.actionIconBox, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <Text style={styles.actionLabel}>{item.label}</Text>
                <Text style={styles.actionSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
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
            <View style={styles.recentList}>
              {recentApps.map((app, idx) => {
                const sc = STATUS_COLORS[app.status] ?? STATUS_COLORS.APPLIED;
                const color = companyColor(app.company ?? 'A');
                return (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.appCard, idx > 0 && { borderTopWidth: 1, borderTopColor: COLORS.border }]}
                    onPress={() => navigation.navigate('ApplicationsTab', { screen: 'ApplicationDetail', params: { applicationId: app.id } })}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.appIcon, { backgroundColor: color + '18', borderColor: color + '30', borderWidth: 1 }]}>
                      <Text style={[styles.appIconText, { color }]}>{app.company.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.appBody}>
                      <Text style={styles.appTitle} numberOfLines={1}>{app.jobTitle}</Text>
                      <Text style={styles.appCompany} numberOfLines={1}>{app.company}</Text>
                    </View>
                    <View style={styles.appRight}>
                      <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
                        <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                      </View>
                      {app.appliedAt ? <Text style={styles.appDate}>{dayjs(app.appliedAt).fromNow(true)} ago</Text> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── AI Career Tools ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Career Tools</Text>
          <View style={styles.aiGrid}>
            {[
              { icon: 'cash-outline' as const, label: 'Salary Intel', sub: 'Know your worth', color: '#F59E0B', bg: '#FFFBEB', onPress: () => navigation.navigate('SalaryIntel') },
              { icon: 'trending-up-outline' as const, label: 'Negotiate', sub: 'Get the best offer', color: '#10B981', bg: '#D1FAE5', onPress: () => navigation.navigate('NegotiationCoach') },
              { icon: 'bar-chart-outline' as const, label: 'Analytics', sub: 'Track funnel', color: '#2563EB', bg: '#EFF6FF', onPress: () => navigation.navigate('Analytics') },
              { icon: 'rocket-outline' as const, label: 'Career Path', sub: 'AI roadmap', color: '#8B5CF6', bg: '#EDE9FE', onPress: () => navigation.navigate('CareerPath', { resumeId: undefined }) },
            ].map(item => (
              <TouchableOpacity key={item.label} style={styles.aiCard} onPress={item.onPress} activeOpacity={0.8}>
                <View style={[styles.aiIconBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={styles.aiLabel}>{item.label}</Text>
                <Text style={styles.aiSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Upgrade Banner (Free users) ── */}
        {plan === 'FREE' && (
          <TouchableOpacity
            style={styles.upgradeBanner}
            onPress={() => navigation.navigate('Paywall')}
            activeOpacity={0.85}
          >
            <View style={styles.upgradeBannerLeft}>
              <View style={styles.upgradeIconBox}>
                <Ionicons name="rocket" size={22} color="#fff" />
              </View>
              <View>
                <Text style={styles.upgradeBannerTitle}>Unlock Pro Features</Text>
                <Text style={styles.upgradeBannerSub}>AI interviews, unlimited apply, career AI</Text>
              </View>
            </View>
            <View style={styles.upgradeChip}>
              <Text style={styles.upgradeChipText}>Upgrade</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── First-time Onboarding ── */}
        {resumeCount === 0 && appCount === 0 && (
          <View style={styles.onboardCard}>
            <View style={styles.onboardHead}>
              <Ionicons name="rocket-outline" size={18} color={COLORS.primary} />
              <Text style={styles.onboardTitle}>Get started in 3 steps</Text>
            </View>
            {[
              { step: '1', text: 'Upload your resume for AI scoring', done: false },
              { step: '2', text: 'Browse and apply to jobs instantly', done: false },
              { step: '3', text: 'Practice with AI mock interviews', done: false },
            ].map(s => (
              <View key={s.step} style={styles.onboardStep}>
                <View style={[styles.onboardBullet, s.done && { backgroundColor: COLORS.success }]}>
                  {s.done
                    ? <Ionicons name="checkmark" size={12} color="#fff" />
                    : <Text style={styles.onboardNum}>{s.step}</Text>
                  }
                </View>
                <Text style={[styles.onboardText, s.done && { color: COLORS.textMuted, textDecorationLine: 'line-through' }]}>
                  {s.text}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // Hero
  hero: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, overflow: 'hidden' },
  heroAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
    backgroundColor: COLORS.primary,
  },
  heroContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18,
  },
  heroLeft: { flex: 1, marginRight: 12 },
  heroRight: { alignItems: 'center', gap: 8 },
  greeting: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: 2 },
  name: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 4 },
  headline: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  planText: { fontSize: 12, fontWeight: '700' },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: COLORS.surface,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, borderColor: COLORS.primary },
  avatarFallback: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 22, fontWeight: '800' },

  // Profile Completeness
  completenessBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 14,
    marginHorizontal: 16, marginTop: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  completenessIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  completenessTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  progressTrack: { height: 5, backgroundColor: '#BFDBFE', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: COLORS.primary, borderRadius: 3 },

  // HR Banner
  hrBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#059669', borderRadius: 14, padding: 14,
    marginHorizontal: 16, marginTop: 10,
  },
  hrBannerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  hrBannerTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  hrBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 1 },

  // Stats
  statsSection: { paddingHorizontal: 16, paddingTop: 16 },
  statsRow: { flexDirection: 'row', gap: 10 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#991B1B', fontWeight: '600' },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  statIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },

  // Sections
  section: { paddingHorizontal: 16, paddingTop: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },

  // Quick Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '47.5%', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  actionIconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  actionSub: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

  // Recent Applications
  recentList: {
    backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  appCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  appIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  appIconText: { fontSize: 18, fontWeight: '900' },
  appBody: { flex: 1 },
  appTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  appCompany: { fontSize: 12, color: COLORS.textSecondary },
  appRight: { alignItems: 'flex-end', gap: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  appDate: { fontSize: 10, color: COLORS.textMuted },

  // AI Tools
  aiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  aiCard: {
    width: '47.5%', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  aiIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  aiLabel: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  aiSub: { fontSize: 11, color: COLORS.textSecondary },

  // Upgrade Banner
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginTop: 22,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  upgradeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  upgradeBannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  upgradeBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  upgradeChip: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  upgradeChipText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },

  // Onboarding
  onboardCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, gap: 14,
    marginHorizontal: 16, marginTop: 22,
  },
  onboardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  onboardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  onboardStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  onboardBullet: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  onboardNum: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  onboardText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
});
