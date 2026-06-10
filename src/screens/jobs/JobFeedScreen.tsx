import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
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
import { COLORS, API_ENDPOINTS, ROUTES } from '../../constants';
import { JobsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setJobs, appendJobs, setLoading, setError } from '../../store/slices/jobSlice';
import { Job, JobFeedResponse } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type Nav = NativeStackNavigationProp<JobsStackParamList, 'JobFeed'>;

const PAGE_SIZE = 20;

function formatSalary(min: number | null, max: number | null): string | null {
  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${Math.round(n / 100000)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

export default function JobFeedScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const { feed, isLoading, error, currentPage, totalElements } = useSelector(
    (s: RootState) => s.job,
  );

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadJobs = useCallback(async (refresh = false) => {
    dispatch(setLoading(true));
    dispatch(setError(''));
    try {
      const res = await apiClient.get<JobFeedResponse>(API_ENDPOINTS.JOB_FEED, {
        params: { page: 0, size: PAGE_SIZE },
      });
      dispatch(setJobs({ jobs: res.data.content, totalElements: res.data.totalElements, page: 0 }));
    } catch {
      dispatch(setError('Failed to load jobs.'));
    }
  }, [dispatch]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || feed.length >= totalElements) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await apiClient.get<JobFeedResponse>(API_ENDPOINTS.JOB_FEED, {
        params: { page: nextPage, size: PAGE_SIZE },
      });
      dispatch(appendJobs({ jobs: res.data.content, totalElements: res.data.totalElements, page: nextPage }));
    } catch {
      // silently fail on pagination error
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, feed.length, totalElements, currentPage, dispatch]);

  useEffect(() => {
    loadJobs();
  }, []);

  const renderItem = ({ item }: { item: Job }) => {
    const salary = formatSalary(item.salaryMin, item.salaryMax);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate(ROUTES.JOB_DETAIL as 'JobDetail', { jobId: item.id })}
      >
        <View style={styles.cardTop}>
          <View style={styles.companyIcon}>
            <Text style={styles.companyInitial}>
              {item.company ? item.company[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.tagRow}>
            {item.location && (
              <View style={styles.tag}>
                <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.tagText}>{item.location}</Text>
              </View>
            )}
            {item.isRemote && (
              <View style={[styles.tag, styles.tagRemote]}>
                <Text style={[styles.tagText, styles.tagTextRemote]}>Remote</Text>
              </View>
            )}
            {salary && (
              <View style={[styles.tag, styles.tagSalary]}>
                <Text style={[styles.tagText, styles.tagTextSalary]}>{salary}</Text>
              </View>
            )}
          </View>
          <View style={styles.bottomRow}>
            {item.postedDate && (
              <Text style={styles.postedDate}>
                {dayjs(item.postedDate).format('MMM D, YYYY')}
              </Text>
            )}
            {item.matchScore != null && (
              <View style={[styles.matchBadge, { backgroundColor: item.matchScore >= 80 ? '#D1FAE5' : item.matchScore >= 60 ? '#FEF9C3' : '#F1F5F9' }]}>
                <Text style={[styles.matchBadgeText, { color: item.matchScore >= 80 ? '#065F46' : item.matchScore >= 60 ? '#854D0E' : '#475569' }]}>
                  {item.matchScore}% match
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((k) => (
        <View key={k} style={[styles.card, styles.skeletonCard]}>
          <View style={styles.cardTop}>
            <View style={[styles.companyIcon, styles.skeletonBox]} />
            <View style={styles.cardMeta}>
              <View style={styles.skeletonLine1} />
              <View style={styles.skeletonLine2} />
            </View>
          </View>
        </View>
      ))}
    </>
  );

  const renderEmpty = () => (
    <View style={styles.centeredWrap}>
      <Ionicons name="briefcase-outline" size={64} color={COLORS.border} />
      <Text style={styles.emptyTitle}>No jobs yet</Text>
      <Text style={styles.emptySubtitle}>Jobs will appear here once they're added by the admin.</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centeredWrap}>
      <Ionicons name="cloud-offline-outline" size={64} color={COLORS.error} />
      <Text style={styles.emptyTitle}>Failed to load jobs</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadJobs()}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Feed</Text>
        {!isLoading && totalElements > 0 && (
          <Text style={styles.headerCount}>{totalElements} jobs</Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.listContent}>{renderSkeleton()}</View>
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, feed.length === 0 && styles.listEmpty]}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => loadJobs(true)}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  headerCount: { fontSize: 14, color: COLORS.textSecondary },

  listContent: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInitial: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  cardMeta: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  companyName: { fontSize: 13, color: COLORS.textSecondary },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 12, color: COLORS.textSecondary },
  tagRemote: { backgroundColor: '#D1FAE5' },
  tagTextRemote: { color: COLORS.success, fontWeight: '600' },
  tagSalary: { backgroundColor: COLORS.primaryLight },
  tagTextSalary: { color: COLORS.primary, fontWeight: '600' },
  postedDate: { fontSize: 11, color: COLORS.textMuted },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  matchBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  matchBadgeText: { fontSize: 11, fontWeight: '700' },

  // Skeleton
  skeletonCard: { opacity: 0.5 },
  skeletonBox: { backgroundColor: COLORS.border },
  skeletonLine1: { height: 14, borderRadius: 6, backgroundColor: COLORS.border, width: '55%', marginBottom: 6 },
  skeletonLine2: { height: 11, borderRadius: 6, backgroundColor: COLORS.border, width: '35%' },

  // Empty / Error
  centeredWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  retryText: { color: COLORS.error, fontWeight: '600', fontSize: 15 },

  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});
