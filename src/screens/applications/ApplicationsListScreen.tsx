import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { ApplicationsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setApplications } from '../../store/slices/applicationSlice';
import { Application, ApplicationStatus } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type Nav = NativeStackNavigationProp<ApplicationsStackParamList, 'ApplicationsList'>;

interface PagedApplications {
  content: Application[];
}

const STATUS_ORDER: ApplicationStatus[] = [
  'INTERVIEW',
  'OFFER',
  'SHORTLISTED',
  'APPLIED',
  'VIEWED',
  'REJECTED',
  'WITHDRAWN',
];

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  VIEWED: 'Viewed',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string }> = {
  APPLIED: { bg: '#DBEAFE', text: '#1D4ED8' },
  VIEWED: { bg: '#F1F5F9', text: '#475569' },
  SHORTLISTED: { bg: '#FEF9C3', text: '#854D0E' },
  INTERVIEW: { bg: '#D1FAE5', text: '#065F46' },
  OFFER: { bg: '#D1FAE5', text: '#064E3B' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
  WITHDRAWN: { bg: '#F1F5F9', text: '#94A3B8' },
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

function SkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSub} />
    </View>
  );
}

export default function ApplicationsListScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const applications = useSelector((s: RootState) => s.application.list);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<PagedApplications>(
        `${API_ENDPOINTS.APPLICATIONS}?page=0&size=50`
      );
      dispatch(setApplications(data.content));
    } catch {
      setError('Could not load applications. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  const sections = STATUS_ORDER.map((status) => ({
    title: STATUS_LABELS[status],
    status,
    data: applications.filter((a) => a.status === status),
  })).filter((s) => s.data.length > 0);

  if (isLoading) {
    return (
      <View style={styles.container}>
        {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadApplications()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (applications.length === 0) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="briefcase-outline" size={56} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No applications yet</Text>
        <Text style={styles.emptySubtext}>
          Apply to jobs from the Jobs tab to track them here.
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadApplications(true)}
          tintColor={COLORS.primary}
        />
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <StatusBadge status={section.status} />
          <Text style={styles.sectionCount}>{section.data.length}</Text>
        </View>
      )}
      renderItem={({ item }: { item: Application }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ApplicationDetail', { applicationId: item.id })}
          activeOpacity={0.75}
        >
          <View style={styles.cardLeft}>
            <View style={styles.companyIcon}>
              <Text style={styles.companyInitial}>
                {item.job.company.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.job.title}</Text>
            <Text style={styles.company} numberOfLines={1}>{item.job.company}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.resumeVersion} numberOfLines={1}>
                {item.resume.versionName}
              </Text>
              {item.appliedAt && (
                <Text style={styles.dateText}>
                  {dayjs(item.appliedAt).format('MMM D')}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
      SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: 16, paddingBottom: 40 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCount: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  cardLeft: {},
  companyIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInitial: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  cardBody: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  company: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resumeVersion: { fontSize: 12, color: COLORS.textMuted, flex: 1 },
  dateText: { fontSize: 12, color: COLORS.textMuted },

  skeletonRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    gap: 8,
  },
  skeletonTitle: { height: 14, backgroundColor: COLORS.border, borderRadius: 6, width: '60%' },
  skeletonSub: { height: 12, backgroundColor: COLORS.border, borderRadius: 6, width: '40%' },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
});
