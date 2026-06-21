import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, ScrollView,
  Keyboard, Animated, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { COLORS, API_ENDPOINTS } from '../../constants';
import { JobsStackParamList } from '../../navigation/types';
import { Job, JobFeedResponse } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import { RootState } from '../../store';

type Nav = NativeStackNavigationProp<JobsStackParamList, 'JobFeed'>;
type SortBy = 'match' | 'recent';
type FeedTab = 'all' | 'remote' | 'recent' | 'saved';

const PAGE_SIZE = 20;
const CARD_HEIGHT = 158;

const SALARY_OPTIONS = [
  { label: '₹10L+', value: 1_000_000 },
  { label: '₹20L+', value: 2_000_000 },
  { label: '₹50L+', value: 5_000_000 },
];

const COMPANY_COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#DC2626',
  '#D97706', '#0891B2', '#C026D3', '#65A30D',
];

function companyColor(name: string): string {
  if (!name) return COMPANY_COLORS[0];
  return COMPANY_COLORS[name.charCodeAt(0) % COMPANY_COLORS.length];
}

function fmt(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${Math.round(n / 100_000)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

function matchColors(score: number) {
  if (score >= 80) return { bg: '#D1FAE5', text: '#065F46', ring: '#059669' };
  if (score >= 60) return { bg: '#FEF9C3', text: '#854D0E', ring: '#D97706' };
  return { bg: '#F1F5F9', text: '#475569', ring: '#94A3B8' };
}

// ─── Job Card ────────────────────────────────────────────────────────────────

const JobCard = memo(function JobCard({
  item, onPress, onSave, onQuickApply,
}: {
  item: Job;
  onPress: () => void;
  onSave: () => void;
  onQuickApply: () => void;
}) {
  const salary = formatSalary(item.salaryMin, item.salaryMax);
  const initial = item.company ? item.company[0].toUpperCase() : '?';
  const bgColor = companyColor(item.company ?? '');
  const mc = item.matchScore != null ? matchColors(item.matchScore) : null;
  const postedAgo = item.scrapedAt ? dayjs(item.scrapedAt).fromNow() : null;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.82} onPress={onPress}>
      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={[styles.logoCircle, { backgroundColor: bgColor + '20' }]}>
          <Text style={[styles.logoInitial, { color: bgColor }]}>{initial}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.companyLine} numberOfLines={1}>
            {item.company}{item.location ? ` · ${item.location}` : ''}
          </Text>
        </View>
        {mc && (
          <View style={[styles.matchCircle, { backgroundColor: mc.bg, borderColor: mc.ring }]}>
            <Text style={[styles.matchPct, { color: mc.text }]}>{item.matchScore}</Text>
            <Text style={[styles.matchLabel, { color: mc.text }]}>%</Text>
          </View>
        )}
      </View>

      {/* Tags row */}
      <View style={styles.tagsRow}>
        {salary && (
          <View style={styles.tagSalary}>
            <Ionicons name="cash-outline" size={10} color={COLORS.primary} />
            <Text style={styles.tagSalaryText}>{salary}</Text>
          </View>
        )}
        {item.isRemote && (
          <View style={styles.tagRemote}>
            <Text style={styles.tagRemoteText}>Remote</Text>
          </View>
        )}
        {item.category && (
          <View style={styles.tagNeutral}>
            <Text style={styles.tagNeutralText} numberOfLines={1}>{item.category}</Text>
          </View>
        )}
        {postedAgo && (
          <Text style={styles.postedAgo}>{postedAgo}</Text>
        )}
      </View>

      {/* Action row */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.quickApplyBtn} onPress={onQuickApply} activeOpacity={0.8}>
          <Ionicons name="flash" size={13} color="#fff" />
          <Text style={styles.quickApplyText}>Easy Apply</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {item.deadline && (
          <Text style={styles.deadlineText}>
            Closes {dayjs(item.deadline).format('MMM D')}
          </Text>
        )}
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.7}>
          <Ionicons
            name={item.saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={item.saved ? COLORS.primary : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

// ─── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.logoCircle, { backgroundColor: COLORS.border }]} />
        <View style={styles.cardMeta}>
          <View style={{ height: 14, width: '70%', backgroundColor: COLORS.border, borderRadius: 6, marginBottom: 8 }} />
          <View style={{ height: 12, width: '45%', backgroundColor: COLORS.border, borderRadius: 6 }} />
        </View>
      </View>
      <View style={styles.tagsRow}>
        <View style={{ height: 24, width: 80, backgroundColor: COLORS.border, borderRadius: 8 }} />
        <View style={{ height: 24, width: 60, backgroundColor: COLORS.border, borderRadius: 8 }} />
      </View>
    </Animated.View>
  );
}

// ─── Tab pill ────────────────────────────────────────────────────────────────

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.tabPill, active && styles.tabPillActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

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

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('match');
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [filterSalary, setFilterSalary] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [savedMap, setSavedMap] = useState<Record<number, boolean>>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const buildParams = useCallback((pageNum: number): Record<string, unknown> => {
    const p: Record<string, unknown> = {
      page: pageNum, size: PAGE_SIZE,
      sortBy: activeTab === 'recent' ? 'recent' : sortBy,
    };
    if (debouncedQuery.trim()) p.q = debouncedQuery.trim();
    if (activeTab === 'remote') p.remote = true;
    if (activeTab === 'recent') p.daysAgo = 7;
    if (filterSalary > 0) p.minSalary = filterSalary;
    return p;
  }, [debouncedQuery, sortBy, activeTab, filterSalary]);

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    if (!append) { setIsLoading(true); setLoadError(''); }
    try {
      if (activeTab === 'saved') {
        const res = await apiClient.get<Job[]>(API_ENDPOINTS.SAVED_JOBS);
        setJobs(res.data);
        setTotal(res.data.length);
        setPage(0);
      } else {
        const res = await apiClient.get<JobFeedResponse>(API_ENDPOINTS.JOB_FEED, { params: buildParams(pageNum) });
        setJobs(prev => append ? [...prev, ...res.data.content] : res.data.content);
        setTotal(res.data.totalElements);
        setPage(pageNum);
        // Merge saved state
        const newSaved: Record<number, boolean> = {};
        res.data.content.forEach(j => { if (j.saved) newSaved[j.id] = true; });
        setSavedMap(prev => ({ ...prev, ...newSaved }));
      }
    } catch {
      if (!append) setLoadError('Could not load jobs. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [buildParams, activeTab]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollToOffset({ offset: 0, animated: false });
    loadPage(0, false);
  }, [loadPage]);

  const onRefresh = () => { setIsRefreshing(true); loadPage(0, false); };
  const loadMore = () => {
    if (isLoadingMore || jobs.length >= total || activeTab === 'saved') return;
    setIsLoadingMore(true);
    loadPage(page + 1, true);
  };

  async function handleSave(job: Job) {
    const isSaved = savedMap[job.id] ?? job.saved ?? false;
    setSavedMap(prev => ({ ...prev, [job.id]: !isSaved }));
    try {
      if (isSaved) await apiClient.delete(API_ENDPOINTS.SAVE_JOB(job.id));
      else await apiClient.post(API_ENDPOINTS.SAVE_JOB(job.id));
    } catch {
      setSavedMap(prev => ({ ...prev, [job.id]: isSaved })); // revert
    }
  }

  async function handleQuickApply(job: Job) {
    if (applyingId) return;
    setApplyingId(job.id);
    try {
      await apiClient.post(API_ENDPOINTS.QUICK_APPLY(job.id));
    } catch { /* silent — navigate to apply full if fails */ }
    setApplyingId(null);
    navigation.navigate('JobDetail', { jobId: job.id });
  }

  const hasFilters = !!debouncedQuery.trim() || filterSalary > 0 || activeTab !== 'all';
  const filterCount = (filterSalary > 0 ? 1 : 0) + (!!debouncedQuery.trim() ? 1 : 0);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: CARD_HEIGHT + 12,
    offset: (CARD_HEIGHT + 12) * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }: { item: Job }) => (
    <JobCard
      item={{ ...item, saved: savedMap[item.id] ?? item.saved }}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      onSave={() => handleSave(item)}
      onQuickApply={() => handleQuickApply(item)}
    />
  ), [savedMap, navigation]);

  const keyExtractor = useCallback((item: Job) => String(item.id), []);

  return (
    <View style={styles.screen}>
      {/* Search + HR bar */}
      <View style={styles.topBar}>
        <View style={[styles.searchRow, searchFocused && styles.searchRowFocused]}>
          <Ionicons name="search-outline" size={18} color={searchFocused ? COLORS.primary : COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Job title, company, skills…"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {isHr && (
          <TouchableOpacity
            style={styles.postJobBtn}
            onPress={() => navigation.navigate('HrPostJob')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.postJobText}>Post Job</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab pills */}
      <View style={styles.tabRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          <TabPill label="All Jobs" active={activeTab === 'all'} onPress={() => setActiveTab('all')} />
          <TabPill label="Remote" active={activeTab === 'remote'} onPress={() => setActiveTab('remote')} />
          <TabPill label="Latest" active={activeTab === 'recent'} onPress={() => setActiveTab('recent')} />
          <TabPill label="Saved" active={activeTab === 'saved'} onPress={() => setActiveTab('saved')} />
        </ScrollView>
      </View>

      {/* Salary filter chips + sort */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, sortBy === 'match' && styles.filterChipActive]}
            onPress={() => setSortBy('match')}
          >
            <Text style={[styles.filterChipText, sortBy === 'match' && styles.filterChipTextActive]}>Best Match</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, sortBy === 'recent' && styles.filterChipActive]}
            onPress={() => setSortBy('recent')}
          >
            <Text style={[styles.filterChipText, sortBy === 'recent' && styles.filterChipTextActive]}>Most Recent</Text>
          </TouchableOpacity>
          {SALARY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.filterChip, filterSalary === opt.value && styles.filterChipActive]}
              onPress={() => setFilterSalary(prev => prev === opt.value ? 0 : opt.value)}
            >
              <Text style={[styles.filterChipText, filterSalary === opt.value && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          {hasFilters && (
            <TouchableOpacity
              style={styles.clearChip}
              onPress={() => { setQuery(''); setDebouncedQuery(''); setSortBy('match'); setActiveTab('all'); setFilterSalary(0); }}
            >
              <Ionicons name="close" size={12} color={COLORS.error} />
              <Text style={styles.clearChipText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Results count */}
      {!isLoading && !loadError && (
        <View style={styles.resultsMeta}>
          <Text style={styles.resultsCount}>
            {total > 0 ? `${total.toLocaleString()} job${total !== 1 ? 's' : ''}` : 'No jobs found'}
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map(k => <SkeletonCard key={k} />)}
        </ScrollView>
      ) : loadError ? (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={52} color={COLORS.textMuted} />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadPage(0, false)}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={jobs}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, jobs.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={8}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Ionicons name="search-outline" size={56} color={COLORS.border} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'saved' ? 'No saved jobs yet' : hasFilters ? 'No matching jobs' : 'No jobs yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'saved'
                  ? 'Tap the bookmark on any job to save it here.'
                  : hasFilters
                  ? 'Try different keywords or remove some filters.'
                  : 'Jobs will appear here once available.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F1F5F9', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  searchRowFocused: { borderColor: COLORS.primary, backgroundColor: '#fff' },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, padding: 0 },
  postJobBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#059669', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  postJobText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  tabRow: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tabContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  tabPill: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F1F5F9',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  tabPillActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  tabPillText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabPillTextActive: { color: COLORS.primary },

  filterBar: { backgroundColor: COLORS.surface },
  filterContent: { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.primary },
  clearChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  clearChipText: { fontSize: 12, fontWeight: '600', color: COLORS.error },

  resultsMeta: { paddingHorizontal: 18, paddingVertical: 8 },
  resultsCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

  listContent: { paddingHorizontal: 14, paddingBottom: 32, gap: 12, paddingTop: 4 },

  // Job card
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  logoCircle: {
    width: 48, height: 48, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoInitial: { fontSize: 20, fontWeight: '800' },
  cardMeta: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 20, marginBottom: 4 },
  companyLine: { fontSize: 13, color: COLORS.textSecondary },
  matchCircle: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, flexShrink: 0,
  },
  matchPct: { fontSize: 15, fontWeight: '800', lineHeight: 16 },
  matchLabel: { fontSize: 9, fontWeight: '700' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  tagSalary: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  tagSalaryText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  tagRemote: {
    backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  tagRemoteText: { fontSize: 12, fontWeight: '700', color: '#065F46' },
  tagNeutral: {
    backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  tagNeutralText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  postedAgo: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickApplyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary, borderRadius: 9,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  quickApplyText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  deadlineText: { fontSize: 11, color: COLORS.warning, fontWeight: '600' },
  saveBtn: { padding: 6 },

  // States
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  errorText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
});
