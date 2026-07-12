import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, ScrollView,
  Keyboard, Animated, Platform, Alert, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { JobsStackParamList } from '../../navigation/types';
import { Job, JobFeedResponse, Resume, Application } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import { RootState, AppDispatch } from '../../store';
import { addApplication } from '../../store/slices/applicationSlice';
import { decodeFileName } from '../../utils/decodeFileName';
import WebPageContainer from '../../components/common/WebPageContainer';

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
  item, onPress, onSave, onQuickApply, selectMode, selected,
}: {
  item: Job;
  onPress: () => void;
  onSave: () => void;
  onQuickApply: () => void;
  selectMode?: boolean;
  selected?: boolean;
}) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const salary = formatSalary(item.salaryMin, item.salaryMax);
  const initial = item.company ? item.company[0].toUpperCase() : '?';
  const bgColor = companyColor(item.company ?? '');
  const mc = item.matchScore != null ? matchColors(item.matchScore) : null;
  const postedAgo = item.scrapedAt ? dayjs(item.scrapedAt).fromNow() : null;

  return (
    <TouchableOpacity
      testID={`job-card-${item.id}`}
      style={[styles.card, selected && styles.cardSelected]}
      activeOpacity={0.82}
      onPress={onPress}
    >
      {selectMode && (
        <View style={styles.checkOverlay}>
          <View style={[styles.checkCircle, selected && styles.checkCircleActive]}>
            {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </View>
      )}
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
            <Ionicons name="cash-outline" size={10} color={colors.primary} />
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
        {item.source && (
          <View style={styles.tagSource}>
            <Ionicons name="flash-outline" size={10} color="#2563EB" />
            <Text style={styles.tagSourceText}>{item.source}</Text>
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
            color={item.saved ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

// ─── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonCard() {
  const colors = useTheme();
  const styles = makeStyles(colors);
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
        <View style={[styles.logoCircle, { backgroundColor: colors.border }]} />
        <View style={styles.cardMeta}>
          <View style={{ height: 14, width: '70%', backgroundColor: colors.border, borderRadius: 6, marginBottom: 8 }} />
          <View style={{ height: 12, width: '45%', backgroundColor: colors.border, borderRadius: 6 }} />
        </View>
      </View>
      <View style={styles.tagsRow}>
        <View style={{ height: 24, width: 80, backgroundColor: colors.border, borderRadius: 8 }} />
        <View style={{ height: 24, width: 60, backgroundColor: colors.border, borderRadius: 8 }} />
      </View>
    </Animated.View>
  );
}

// ─── Tab pill ────────────────────────────────────────────────────────────────

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
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
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const isHr = user?.role === 'HR';
  const resumeList = useSelector((s: RootState) => s.resume.list);
  const primaryResume = resumeList.find(r => r.isParsed && r.isOriginal) ?? resumeList.find(r => r.isParsed) ?? null;

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

  // Auto-apply select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [isQueuing, setIsQueuing] = useState(false);
  const [tailorResume, setTailorResume] = useState(true);
  const [generateCoverLetter, setGenerateCoverLetter] = useState(false);

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
        setJobs(prev => {
          if (!append) return res.data.content;
          const seen = new Set(prev.map(j => j.id));
          return [...prev, ...res.data.content.filter(j => !seen.has(j.id))];
        });
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
      const { data } = await apiClient.post<Application>(API_ENDPOINTS.QUICK_APPLY(job.id));
      dispatch(addApplication(data));
    } catch {
      Alert.alert('Quick Apply failed', 'Could not apply. Open the job to apply manually.');
    }
    setApplyingId(null);
    navigation.navigate('JobDetail', { jobId: job.id });
  }

  const handleToggleSelect = useCallback((jobId: number) => {
    setSelectedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }, []);

  // "Apply All" — one tap selects every visible job and drops straight into the
  // tailor/cover-letter toggle bar. Users can still deselect individual jobs
  // (tap the card) or restore full selection (the "All" chip) once inside.
  const handleApplyAll = useCallback(async () => {
    try {
      const { data } = await apiClient.get<{ content: Resume[] } | Resume[]>(API_ENDPOINTS.RESUMES);
      const list = Array.isArray(data) ? data : (data.content ?? []);
      const parsed = list.filter(r => r.isParsed);
      setResumes(parsed);
      if (parsed.length > 0) setSelectedResumeId(parsed[0].id);
    } catch { setResumes([]); }
    setSelectMode(true);
    setSelectedJobs(new Set(jobs.map(j => j.id)));
  }, [jobs]);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedJobs(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedJobs(new Set(jobs.map(j => j.id)));
  }, [jobs]);

  const handleAutoApply = useCallback(async () => {
    if (selectedJobs.size === 0) {
      Alert.alert('No Jobs Selected', 'Tap jobs to select them, then tap Auto Apply.');
      return;
    }
    if (resumes.length === 0) {
      Alert.alert('No Parsed Resume', 'Upload and parse a resume first so we can tailor it for each job.');
      return;
    }
    setIsQueuing(true);
    try {
      await apiClient.post(API_ENDPOINTS.AUTO_APPLY_QUEUE, {
        jobIds: Array.from(selectedJobs),
        resumeId: selectedResumeId,
        tailorResume,
        generateCoverLetter,
      });
      exitSelectMode();
      (navigation as any).navigate('AutoApplyQueue');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Could not queue jobs. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsQueuing(false);
    }
  }, [selectedJobs, selectedResumeId, resumes, exitSelectMode, navigation, tailorResume, generateCoverLetter]);

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
      onPress={selectMode
        ? () => handleToggleSelect(item.id)
        : () => navigation.navigate('JobDetail', { jobId: item.id })}
      onSave={selectMode ? () => {} : () => handleSave(item)}
      onQuickApply={selectMode
        ? () => handleToggleSelect(item.id)
        : () => handleQuickApply(item)}
      selectMode={selectMode}
      selected={selectedJobs.has(item.id)}
    />
  ), [savedMap, navigation, selectMode, selectedJobs, handleToggleSelect]);

  const keyExtractor = useCallback((item: Job) => String(item.id), []);

  return (
    <View style={styles.screen}>
      <WebPageContainer maxWidth={720}>
      {/* Resume status — the gate for AI-matched jobs */}
      {!isHr && (
        primaryResume ? (
          <TouchableOpacity
            testID="resume-status-card"
            style={styles.resumeStatusCard}
            onPress={() => navigation.getParent()?.navigate('ResumeTab', { screen: 'ResumeList' })}
            activeOpacity={0.8}
          >
            <View style={styles.resumeStatusIcon}>
              <Ionicons name="document-text" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeStatusTitle} numberOfLines={1}>{decodeFileName(primaryResume.versionName)}</Text>
              <Text style={styles.resumeStatusSub}>Matching jobs against this resume</Text>
            </View>
            {primaryResume.aiScore != null && (
              <View style={styles.resumeStatusScore}>
                <Text style={styles.resumeStatusScoreText}>{primaryResume.aiScore}</Text>
              </View>
            )}
            <Text style={styles.resumeStatusChange}>Change</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            testID="resume-upload-cta"
            style={styles.resumeUploadCta}
            onPress={() => navigation.getParent()?.navigate('ResumeTab', { screen: 'ResumeUpload' })}
            activeOpacity={0.85}
          >
            <View style={styles.resumeUploadIcon}>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeUploadTitle}>Upload your resume</Text>
              <Text style={styles.resumeUploadSub}>Unlock AI-matched jobs tailored to your skills</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )
      )}

      {/* Search + HR bar */}
      <View style={styles.topBar}>
        <View style={[styles.searchRow, searchFocused && styles.searchRowFocused]}>
          <Ionicons name="search-outline" size={18} color={searchFocused ? colors.primary : colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Job title, company, skills…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
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
              <Ionicons name="close" size={12} color={colors.error} />
              <Text style={styles.clearChipText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Results count + Select toggle */}
      {!isLoading && !loadError && (
        <View style={styles.resultsMeta}>
          <Text testID={selectMode ? 'selected-count' : undefined} style={styles.resultsCount}>
            {selectMode
              ? `${selectedJobs.size} selected`
              : total > 0 ? `${total.toLocaleString()} job${total !== 1 ? 's' : ''}` : 'No jobs found'}
          </Text>
          {!isHr && !selectMode && jobs.length > 0 && (
            <TouchableOpacity testID="apply-all-btn" onPress={handleApplyAll} style={styles.selectBtn} activeOpacity={0.8}>
              <Ionicons name="rocket-outline" size={14} color={colors.primary} />
              <Text style={styles.selectBtnText}>Apply All</Text>
            </TouchableOpacity>
          )}
          {selectMode && (
            <View style={styles.selectActions}>
              <TouchableOpacity testID="select-all-btn" onPress={handleSelectAll} style={styles.selectAllBtn} activeOpacity={0.8}>
                <Text style={styles.selectAllText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="cancel-select-btn" onPress={exitSelectMode} style={styles.cancelSelectBtn} activeOpacity={0.8}>
                <Text style={styles.cancelSelectText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Resume picker modal */}
      <Modal visible={false} transparent animationType="slide">
        {/* placeholder — resume picked inline in bottom bar */}
      </Modal>

      {/* List */}
      {isLoading ? (
        <ScrollView testID="jobs-loading" contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map(k => <SkeletonCard key={k} />)}
        </ScrollView>
      ) : loadError ? (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadPage(0, false)}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          testID="jobs-list"
          ref={listRef}
          data={jobs}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, jobs.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={8}
          ListEmptyComponent={
            <View testID="jobs-empty-state" style={styles.centerState}>
              <Ionicons name="search-outline" size={56} color={colors.border} />
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
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : jobs.length > 0 && jobs.length >= total && total > 0 ? (
              <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingVertical: 20 }}>
                You've seen all available jobs
              </Text>
            ) : null
          }
        />
      )}

      {/* Auto Apply sticky bottom bar */}
      {selectMode && (
        <View testID="auto-apply-bar" style={styles.autoApplyBar}>
          {resumes.length > 0 && (
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.resumePickerRow}
            >
              {resumes.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.resumeChip, selectedResumeId === r.id && styles.resumeChipActive]}
                  onPress={() => setSelectedResumeId(r.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="document-text-outline" size={12}
                    color={selectedResumeId === r.id ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[styles.resumeChipText, selectedResumeId === r.id && styles.resumeChipTextActive]}
                    numberOfLines={1}
                  >
                    {decodeFileName(r.versionName)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {resumes.length === 0 && (
            <Text style={styles.noResumeHint}>No parsed resume found. Parse a resume first.</Text>
          )}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              testID="toggle-tailor-resume"
              style={[styles.toggleChip, tailorResume && styles.toggleChipActive]}
              onPress={() => setTailorResume(v => !v)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tailorResume ? 'checkbox' : 'square-outline'}
                size={14}
                color={tailorResume ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.toggleChipText, tailorResume && styles.toggleChipTextActive]}>
                Tailor resume for all
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="toggle-cover-letter"
              style={[styles.toggleChip, generateCoverLetter && styles.toggleChipActive]}
              onPress={() => setGenerateCoverLetter(v => !v)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={generateCoverLetter ? 'checkbox' : 'square-outline'}
                size={14}
                color={generateCoverLetter ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.toggleChipText, generateCoverLetter && styles.toggleChipTextActive]}>
                Cover letter for all
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            testID="auto-apply-submit-btn"
            style={[styles.autoApplyBtn, (selectedJobs.size === 0 || isQueuing) && styles.autoApplyBtnDisabled]}
            onPress={handleAutoApply}
            activeOpacity={0.85}
            disabled={isQueuing}
          >
            {isQueuing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="rocket-outline" size={16} color="#fff" />
                <Text style={styles.autoApplyBtnText}>
                  Auto Apply{selectedJobs.size > 0 ? ` (${selectedJobs.size})` : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
      </WebPageContainer>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  resumeStatusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.primaryLight, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  resumeStatusIcon: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  resumeStatusTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  resumeStatusSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  resumeStatusScore: {
    backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0,
  },
  resumeStatusScoreText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  resumeStatusChange: { fontSize: 12, fontWeight: '700', color: colors.primary, flexShrink: 0 },

  resumeUploadCta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.primary,
  },
  resumeUploadIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  resumeUploadTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  resumeUploadSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F1F5F9', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  searchRowFocused: { borderColor: colors.primary, backgroundColor: '#fff' },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  postJobBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#059669', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  postJobText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  tabRow: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tabContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  tabPill: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F1F5F9',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  tabPillActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  tabPillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabPillTextActive: { color: colors.primary },

  filterBar: { backgroundColor: colors.surface },
  filterContent: { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive: { color: colors.primary },
  clearChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: colors.error,
    backgroundColor: '#FEF2F2',
  },
  clearChipText: { fontSize: 12, fontWeight: '600', color: colors.error },

  resultsMeta: {
    paddingHorizontal: 18, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  resultsCount: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  selectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, backgroundColor: colors.primaryLight,
  },
  selectBtnText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  selectActions: { flexDirection: 'row', gap: 8 },
  selectAllBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 8, backgroundColor: colors.primaryLight,
  },
  selectAllText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  cancelSelectBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 8, backgroundColor: '#F1F5F9',
  },
  cancelSelectText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  listContent: { paddingHorizontal: 14, paddingBottom: 32, gap: 12, paddingTop: 4 },

  // Auto Apply bar
  autoApplyBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 8,
  },
  resumePickerRow: { gap: 8, paddingBottom: 2 },
  resumeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: '#F8FAFC', maxWidth: 160,
  },
  resumeChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  resumeChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', flexShrink: 1 },
  resumeChipTextActive: { color: colors.primary, fontWeight: '600' },
  noResumeHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginVertical: 4 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#F8FAFC', flex: 1,
  },
  toggleChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  toggleChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500', flexShrink: 1 },
  toggleChipTextActive: { color: colors.primary, fontWeight: '700' },
  autoApplyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 14,
  },
  autoApplyBtnDisabled: { backgroundColor: colors.textMuted },
  autoApplyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Job card
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: colors.border,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardSelected: { borderColor: colors.primary, borderWidth: 2 },
  checkOverlay: {
    position: 'absolute', top: 12, right: 12, zIndex: 10,
  },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  logoCircle: {
    width: 48, height: 48, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoInitial: { fontSize: 20, fontWeight: '800' },
  cardMeta: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, lineHeight: 20, marginBottom: 4 },
  companyLine: { fontSize: 13, color: colors.textSecondary },
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
    backgroundColor: colors.primaryLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  tagSalaryText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  tagRemote: {
    backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  tagRemoteText: { fontSize: 12, fontWeight: '700', color: '#065F46' },
  tagSource: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3,
    backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  tagSourceText: { fontSize: 11, fontWeight: '700' as const, color: '#2563EB' },
  tagNeutral: {
    backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  tagNeutralText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  postedAgo: { fontSize: 11, color: colors.textMuted, marginLeft: 'auto' },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickApplyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primary, borderRadius: 9,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  quickApplyText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  deadlineText: { fontSize: 11, color: colors.warning, fontWeight: '600' },
  saveBtn: { padding: 6 },

  // States
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  });
}