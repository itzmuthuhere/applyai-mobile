import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Animated, Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
dayjs.extend(relativeTime);
dayjs.extend(utc);
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { ApplicationsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setApplications } from '../../store/slices/applicationSlice';
import { Application, ApplicationStatus } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type Nav = NativeStackNavigationProp<ApplicationsStackParamList, 'ApplicationsList'>;

interface PagedApplications { content: Application[] }

type FilterTab = 'all' | 'active' | 'interview' | 'offer' | 'closed';

const TAB_LABELS: Record<FilterTab, string> = {
  all: 'All',
  active: 'Active',
  interview: 'Interviews',
  offer: 'Offers',
  closed: 'Closed',
};

const ACTIVE_STATUSES: ApplicationStatus[] = ['APPLIED', 'VIEWED', 'SHORTLISTED'];
const INTERVIEW_STATUSES: ApplicationStatus[] = ['INTERVIEW'];
const OFFER_STATUSES: ApplicationStatus[] = ['OFFER'];
const CLOSED_STATUSES: ApplicationStatus[] = ['REJECTED', 'WITHDRAWN'];

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; bg: string; text: string; dot: string }> = {
  APPLIED:     { label: 'Applied',      bg: '#EFF6FF', text: '#1D4ED8', dot: '#2563EB' },
  VIEWED:      { label: 'Viewed',       bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
  SHORTLISTED: { label: 'Shortlisted',  bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  INTERVIEW:   { label: 'Interview',    bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  OFFER:       { label: 'Offer! 🎉',   bg: '#D1FAE5', text: '#064E3B', dot: '#059669' },
  REJECTED:    { label: 'Rejected',     bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  WITHDRAWN:   { label: 'Withdrawn',    bg: '#F8FAFC', text: '#94A3B8', dot: '#CBD5E1' },
};

const COMPANY_COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#DC2626',
  '#D97706', '#0891B2', '#C026D3', '#65A30D',
];
function companyColor(name: string) {
  if (!name) return COMPANY_COLORS[0];
  return COMPANY_COLORS[name.charCodeAt(0) % COMPANY_COLORS.length];
}

function filterByTab(apps: Application[], tab: FilterTab): Application[] {
  if (tab === 'all') return apps;
  if (tab === 'active') return apps.filter(a => ACTIVE_STATUSES.includes(a.status));
  if (tab === 'interview') return apps.filter(a => INTERVIEW_STATUSES.includes(a.status));
  if (tab === 'offer') return apps.filter(a => OFFER_STATUSES.includes(a.status));
  if (tab === 'closed') return apps.filter(a => CLOSED_STATUSES.includes(a.status));
  return apps;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={[styles.card, { opacity, marginBottom: 10 }]}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: colors.border }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 14, width: '65%', backgroundColor: colors.border, borderRadius: 6 }} />
          <View style={{ height: 12, width: '45%', backgroundColor: colors.border, borderRadius: 6 }} />
        </View>
        <View style={{ height: 24, width: 70, backgroundColor: colors.border, borderRadius: 12 }} />
      </View>
    </Animated.View>
  );
}

// ─── Stats bar ───────────────────────────────────────────────────────────────

function StatsBar({ apps }: { apps: Application[] }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const counts: Record<string, number> = {
    Applied: apps.filter(a => ACTIVE_STATUSES.includes(a.status)).length,
    Interview: apps.filter(a => a.status === 'INTERVIEW').length,
    Offer: apps.filter(a => a.status === 'OFFER').length,
    Rejected: apps.filter(a => CLOSED_STATUSES.includes(a.status)).length,
  };
  const icons: Record<string, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
    Applied:   { icon: 'send-outline', color: colors.primary },
    Interview: { icon: 'mic-outline', color: '#10B981' },
    Offer:     { icon: 'trophy-outline', color: '#F59E0B' },
    Rejected:  { icon: 'close-circle-outline', color: colors.error },
  };
  return (
    <View style={styles.statsBar}>
      {Object.entries(counts).map(([label, count]) => (
        <View key={label} style={styles.statItem}>
          <Ionicons name={icons[label].icon} size={16} color={icons[label].color} />
          <Text style={[styles.statCount, { color: icons[label].color }]}>{count}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Application card ────────────────────────────────────────────────────────

function AppCard({ item, onPress }: { item: Application; onPress: () => void }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const cfg = STATUS_CONFIG[item.status];
  const bgColor = companyColor(item.job.company ?? '');
  const initial = item.job.company ? item.job.company[0].toUpperCase() : '?';
  const appliedAgo = item.appliedAt ? dayjs.utc(item.appliedAt).local().fromNow() : null;

  return (
    <TouchableOpacity testID={`app-item-${item.id}`} style={styles.card} onPress={onPress} activeOpacity={0.78}>
      <View style={styles.cardRow}>
        {/* Logo */}
        <View style={[styles.logoCircle, { backgroundColor: bgColor + '18' }]}>
          <Text style={[styles.logoInitial, { color: bgColor }]}>{initial}</Text>
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.job.title}</Text>
          <Text style={styles.company} numberOfLines={1}>{item.job.company}</Text>
          <View style={styles.cardMeta}>
            {item.job.location && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>{item.job.location}</Text>
              </View>
            )}
            {appliedAgo && <Text style={styles.appliedAgo}>{appliedAgo}</Text>}
          </View>
        </View>

        {/* Status */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Interview date highlight */}
      {item.interviewDate && (
        <View style={styles.interviewBanner}>
          <Ionicons name="calendar-outline" size={13} color="#065F46" />
          <Text style={styles.interviewBannerText}>
            Interview: {dayjs.utc(item.interviewDate).local().format('MMM D, YYYY')}
          </Text>
        </View>
      )}

      {/* Offer highlight */}
      {item.offerSalary && item.status === 'OFFER' && (
        <View style={styles.offerBanner}>
          <Ionicons name="cash-outline" size={13} color="#B45309" />
          <Text style={styles.offerBannerText}>
            Offer: ₹{Number(item.offerSalary).toLocaleString('en-IN')} / year
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Tab pill ────────────────────────────────────────────────────────────────

function TabPill({ label, active, count, onPress, testID }: { label: string; active: boolean; count: number; onPress: () => void; testID?: string }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity testID={testID} style={[styles.tabPill, active && styles.tabPillActive]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.tabCount, active && styles.tabCountActive]}>
          <Text style={[styles.tabCountText, active && { color: colors.primary }]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ApplicationsListScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const applications = useSelector((s: RootState) => s.application.list);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => { loadApplications(); }, []);

  // Refresh on focus so status changes from JobDetailScreen appear immediately
  useFocusEffect(useCallback(() => { loadApplications(); }, []));

  async function loadApplications(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<PagedApplications>(`${API_ENDPOINTS.APPLICATIONS}?page=0&size=50`);
      dispatch(setApplications(data.content));
    } catch {
      setError('Could not load applications. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  const filtered = filterByTab(applications, activeTab);

  const tabCounts: Record<FilterTab, number> = {
    all: applications.length,
    active: applications.filter(a => ACTIVE_STATUSES.includes(a.status)).length,
    interview: applications.filter(a => a.status === 'INTERVIEW').length,
    offer: applications.filter(a => a.status === 'OFFER').length,
    closed: applications.filter(a => CLOSED_STATUSES.includes(a.status)).length,
  };

  const renderItem = useCallback(({ item }: { item: Application }) => (
    <AppCard
      item={item}
      onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item.id })}
    />
  ), [navigation]);

  const keyExtractor = useCallback((item: Application) => String(item.id), []);

  if (isLoading) {
    return (
      <View testID="apps-loading" style={styles.screen}>
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map(k => <SkeletonCard key={k} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Stats */}
      {applications.length > 0 && <StatsBar apps={applications} />}

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(Object.keys(TAB_LABELS) as FilterTab[]).map(tab => (
          <TabPill
            key={tab}
            testID={`tab-${tab.toUpperCase()}`}
            label={TAB_LABELS[tab]}
            active={activeTab === tab}
            count={tabCounts[tab]}
            onPress={() => setActiveTab(tab)}
          />
        ))}
      </View>

      {error ? (
        <View testID="apps-error" style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadApplications()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, filtered.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadApplications(true)} tintColor={colors.primary} />
          }
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={8}
          ListEmptyComponent={
            <View testID="apps-empty-state" style={styles.centerState}>
              {applications.length === 0 ? (
                <>
                  <Ionicons name="briefcase-outline" size={60} color={colors.border} />
                  <Text style={styles.emptyTitle}>No applications yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Apply to jobs from the Jobs tab and track your progress here.
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="filter-outline" size={48} color={colors.border} />
                  <Text style={styles.emptyTitle}>No {TAB_LABELS[activeTab].toLowerCase()} applications</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={() => setActiveTab('all')}>
                    <Text style={styles.retryBtnText}>View All</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Stats
  statsBar: {
    flexDirection: 'row', backgroundColor: colors.surface,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statCount: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },

  // Tabs
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.surface,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: 6,
  },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent',
    backgroundColor: '#F1F5F9',
  },
  tabPillActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  tabCount: { backgroundColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountActive: { backgroundColor: '#BFDBFE' },
  tabCountText: { fontSize: 10, fontWeight: '800', color: colors.textMuted },

  // List
  listContent: { padding: 14, gap: 10, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: colors.border,
    gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoInitial: { fontSize: 19, fontWeight: '800' },
  cardBody: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  company: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  metaText: { fontSize: 11, color: colors.textMuted },
  appliedAgo: { fontSize: 11, color: colors.textMuted },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },

  // Banners
  interviewBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#D1FAE5', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  interviewBannerText: { fontSize: 13, fontWeight: '700', color: '#065F46' },
  offerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFBEB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  offerBannerText: { fontSize: 13, fontWeight: '700', color: '#B45309' },

  // States
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  });
}