import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { JobsStackParamList } from '../../navigation/types';
import { Job, JobFeedResponse } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import { RootState } from '../../store';

type Nav = NativeStackNavigationProp<JobsStackParamList, 'JobFeed'>;
type SortBy = 'match' | 'recent';

const PAGE_SIZE = 20;

const SALARY_OPTIONS = [
  { label: '₹10L+', value: 1_000_000 },
  { label: '₹20L+', value: 2_000_000 },
  { label: '₹50L+', value: 5_000_000 },
];

const DATE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
];

function formatSalary(min: number | null, max: number | null): string | null {
  const fmt = (n: number) => {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
    if (n >= 100_000) return `₹${Math.round(n / 100_000)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

export default function JobFeedScreen() {
  const navigation = useNavigation<Nav>();
  const user = useSelector((s: RootState) => s.auth.user);
  const isHr = user?.role === 'HR';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Filter state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('match');
  const [filterRemote, setFilterRemote] = useState(false);
  const [filterDays, setFilterDays] = useState(0);
  const [filterSalary, setFilterSalary] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const buildParams = (pageNum: number): Record<string, unknown> => {
    const params: Record<string, unknown> = { page: pageNum, size: PAGE_SIZE, sortBy };
    if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
    if (filterRemote) params.remote = true;
    if (filterDays > 0) params.daysAgo = filterDays;
    if (filterSalary > 0) params.minSalary = filterSalary;
    return params;
  };

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    if (!append) {
      setIsLoading(true);
      setLoadError('');
    }
    try {
      const res = await apiClient.get<JobFeedResponse>(API_ENDPOINTS.JOB_FEED, {
        params: buildParams(pageNum),
      });
      setJobs(prev => append ? [...prev, ...res.data.content] : res.data.content);
      setTotal(res.data.totalElements);
      setPage(pageNum);
    } catch {
      if (!append) setLoadError('Failed to load jobs.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [debouncedQuery, sortBy, filterRemote, filterDays, filterSalary]); // eslint-disable-line

  // Reload whenever filters change (loadPage changes when deps change)
  useEffect(() => {
    loadPage(0, false);
  }, [loadPage]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadPage(0, false);
  };

  const loadMore = () => {
    if (isLoadingMore || jobs.length >= total) return;
    setIsLoadingMore(true);
    loadPage(page + 1, true);
  };

  const clearFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setSortBy('match');
    setFilterRemote(false);
    setFilterDays(0);
    setFilterSalary(0);
  };

  const hasFilters = !!debouncedQuery.trim() || filterRemote || filterDays > 0 || filterSalary > 0;

  // ─── Job card ────────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Job }) => {
    const salary = formatSalary(item.salaryMin, item.salaryMax);
    const matchColor =
      item.matchScore != null
        ? item.matchScore >= 80
          ? { bg: '#D1FAE5', text: '#065F46' }
          : item.matchScore >= 60
          ? { bg: '#FEF9C3', text: '#854D0E' }
          : { bg: '#F1F5F9', text: '#475569' }
        : null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
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

          {matchColor && (
            <View style={[styles.matchBadge, { backgroundColor: matchColor.bg }]}>
              <Text style={[styles.matchBadgeText, { color: matchColor.text }]}>
                {item.matchScore}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tagRow}>
          {item.location && (
            <View style={styles.tag}>
              <Ionicons name="location-outline" size={11} color={COLORS.textSecondary} />
              <Text style={styles.tagText} numberOfLines={1}>{item.location}</Text>
            </View>
          )}
          {item.isRemote && (
            <View style={[styles.tag, styles.tagRemote]}>
              <Text style={[styles.tagText, styles.tagTextGreen]}>Remote</Text>
            </View>
          )}
          {salary && (
            <View style={[styles.tag, styles.tagSalary]}>
              <Text style={[styles.tagText, styles.tagTextBlue]}>{salary}</Text>
            </View>
          )}
          {item.postedDate && (
            <Text style={styles.postedDate}>{dayjs(item.postedDate).format('MMM D')}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Skeleton ────────────────────────────────────────────────────────────────

  const renderSkeleton = () => (
    <View style={styles.listContent}>
      {[1, 2, 3, 4, 5].map(k => (
        <View key={k} style={[styles.card, { opacity: 0.45 }]}>
          <View style={styles.cardTop}>
            <View style={[styles.companyIcon, { backgroundColor: COLORS.border }]} />
            <View style={styles.cardMeta}>
              <View style={styles.skelLine1} />
              <View style={styles.skelLine2} />
            </View>
          </View>
          <View style={styles.tagRow}>
            <View style={[styles.skelChip, { width: 90 }]} />
            <View style={[styles.skelChip, { width: 60 }]} />
          </View>
        </View>
      ))}
    </View>
  );

  // ─── Empty / error ───────────────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={styles.centeredWrap}>
      <Ionicons name="search-outline" size={56} color={COLORS.border} />
      <Text style={styles.emptyTitle}>
        {hasFilters ? 'No matching jobs' : 'No jobs yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {hasFilters
          ? 'Try different keywords or clear some filters.'
          : 'Jobs appear here once added by the admin.'}
      </Text>
      {hasFilters && (
        <TouchableOpacity style={styles.clearAllBtn} onPress={clearFilters}>
          <Text style={styles.clearAllBtnText}>Clear all filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
        <View style={styles.headerRight}>
          {!isLoading && (
            <Text style={styles.headerCount}>
              {total.toLocaleString()} {hasFilters ? 'results' : 'jobs'}
            </Text>
          )}
          {isHr && (
            <TouchableOpacity
              style={styles.hrPostFab}
              onPress={() => navigation.navigate('HrPostJob')}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.hrPostFabText}>Post Job</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, companies..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Sort + filter bar ── */}
      <View style={styles.filterBar}>
        {/* Sort pills */}
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortPill, sortBy === 'match' && styles.sortPillActive]}
            onPress={() => setSortBy('match')}
          >
            <Ionicons
              name="star-outline"
              size={12}
              color={sortBy === 'match' ? COLORS.surface : COLORS.textSecondary}
            />
            <Text style={[styles.sortPillText, sortBy === 'match' && styles.sortPillTextActive]}>
              Best Match
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortPill, sortBy === 'recent' && styles.sortPillActive]}
            onPress={() => setSortBy('recent')}
          >
            <Ionicons
              name="time-outline"
              size={12}
              color={sortBy === 'recent' ? COLORS.surface : COLORS.textSecondary}
            />
            <Text style={[styles.sortPillText, sortBy === 'recent' && styles.sortPillTextActive]}>
              Latest
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.sortDivider} />

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {/* Remote */}
          <TouchableOpacity
            style={[styles.chip, filterRemote && styles.chipActive]}
            onPress={() => setFilterRemote(v => !v)}
          >
            <Ionicons
              name="wifi-outline"
              size={12}
              color={filterRemote ? COLORS.surface : COLORS.textSecondary}
            />
            <Text style={[styles.chipText, filterRemote && styles.chipTextActive]}>Remote</Text>
          </TouchableOpacity>

          {/* Date chips */}
          {DATE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, filterDays === opt.value && styles.chipActive]}
              onPress={() => setFilterDays(v => v === opt.value ? 0 : opt.value)}
            >
              <Ionicons
                name="calendar-outline"
                size={12}
                color={filterDays === opt.value ? COLORS.surface : COLORS.textSecondary}
              />
              <Text style={[styles.chipText, filterDays === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Salary chips */}
          {SALARY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, filterSalary === opt.value && styles.chipActive]}
              onPress={() => setFilterSalary(v => v === opt.value ? 0 : opt.value)}
            >
              <Text style={[styles.chipText, filterSalary === opt.value && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Clear all — only when active */}
          {hasFilters && (
            <TouchableOpacity style={styles.chipClear} onPress={clearFilters}>
              <Ionicons name="close" size={12} color={COLORS.error} />
              <Text style={[styles.chipText, { color: COLORS.error }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        renderSkeleton()
      ) : loadError ? (
        <View style={styles.centeredWrap}>
          <Ionicons name="cloud-offline-outline" size={56} color={COLORS.error} />
          <Text style={styles.emptyTitle}>Failed to load</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadPage(0, false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, jobs.length === 0 && { flex: 1 }]}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
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

  // Header
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  headerCount: { fontSize: 13, color: COLORS.textSecondary },
  hrPostFab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#059669', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  hrPostFabText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { marginRight: 2 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  // Filter bar
  filterBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
    gap: 8,
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  sortPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortPillText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  sortPillTextActive: { color: COLORS.surface, fontWeight: '600' },
  sortDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },

  chipsRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.surface, fontWeight: '600' },
  chipClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },

  // List
  listContent: { padding: 16, gap: 10 },

  // Job card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 9,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  companyInitial: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  cardMeta: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  companyName: { fontSize: 13, color: COLORS.textSecondary },
  matchBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  matchBadgeText: { fontSize: 12, fontWeight: '700' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 160,
  },
  tagRemote: { backgroundColor: '#D1FAE5' },
  tagSalary: { backgroundColor: COLORS.primaryLight },
  tagText: { fontSize: 12, color: COLORS.textSecondary },
  tagTextGreen: { color: '#065F46', fontWeight: '600' },
  tagTextBlue: { color: COLORS.primary, fontWeight: '600' },
  postedDate: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },

  // Skeleton
  skelLine1: { height: 13, borderRadius: 6, backgroundColor: COLORS.border, width: '60%', marginBottom: 6 },
  skelLine2: { height: 11, borderRadius: 6, backgroundColor: COLORS.border, width: '38%' },
  skelChip: { height: 24, borderRadius: 12, backgroundColor: COLORS.border },

  // Empty / error
  centeredWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  clearAllBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
  },
  clearAllBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  retryText: { color: COLORS.error, fontWeight: '600', fontSize: 14 },

  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});
