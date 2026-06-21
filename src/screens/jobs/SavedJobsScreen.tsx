import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { COLORS, API_ENDPOINTS } from '../../constants';
import { JobsStackParamList } from '../../navigation/types';
import { Job } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type Nav = NativeStackNavigationProp<JobsStackParamList, 'SavedJobs'>;

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

function fmtSalary(min: number | null, max: number | null) {
  const f = (n: number) => n >= 100000 ? `₹${Math.round(n / 100000)}L` : `₹${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `${f(min)}+`;
  return null;
}

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 48, height: 48, borderRadius: 13, backgroundColor: COLORS.border }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 14, width: '65%', backgroundColor: COLORS.border, borderRadius: 6 }} />
          <View style={{ height: 11, width: '40%', backgroundColor: COLORS.border, borderRadius: 6 }} />
        </View>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.border }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[60, 80, 50].map((w, i) => (
          <View key={i} style={{ height: 24, width: w, backgroundColor: COLORS.border, borderRadius: 8 }} />
        ))}
      </View>
    </Animated.View>
  );
}

function JobCard({
  job, onUnsave, onApply, isUnsaving,
}: {
  job: Job;
  onUnsave: () => void;
  onApply: () => void;
  isUnsaving: boolean;
}) {
  const nav = useNavigation<Nav>();
  const color = companyColor(job.company ?? 'A');
  const salary = fmtSalary(job.salaryMin, job.salaryMax);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => nav.navigate('JobDetail', { jobId: job.id })}
      activeOpacity={0.8}
    >
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={[styles.logo, { backgroundColor: color + '18', borderColor: color + '30' }]}>
          <Text style={[styles.logoText, { color }]}>{(job.company ?? 'A').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
          <Text style={styles.company} numberOfLines={1}>{job.company}</Text>
          {job.location && (
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.locText}>{job.location}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.unsaveBtn}
          onPress={onUnsave}
          disabled={isUnsaving}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={isUnsaving ? 'hourglass-outline' : 'bookmark'} size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tags */}
      <View style={styles.tagsRow}>
        {salary && (
          <View style={styles.tagSalary}>
            <Ionicons name="cash-outline" size={11} color="#1D4ED8" />
            <Text style={styles.tagSalaryText}>{salary}</Text>
          </View>
        )}
        {job.isRemote && (
          <View style={styles.tagRemote}>
            <Text style={styles.tagRemoteText}>Remote</Text>
          </View>
        )}
        {job.category && (
          <View style={styles.tagNeutral}>
            <Text style={styles.tagNeutralText}>{job.category}</Text>
          </View>
        )}
        {job.postedDate && (
          <Text style={styles.postedAgo}>{dayjs(job.postedDate).fromNow()}</Text>
        )}
      </View>

      {/* Match score + apply row */}
      <View style={styles.bottomRow}>
        {job.matchScore != null ? (
          <View style={styles.matchPill}>
            <Ionicons name="analytics-outline" size={12} color={COLORS.primary} />
            <Text style={styles.matchText}>{job.matchScore}% match</Text>
          </View>
        ) : <View />}
        <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.85}>
          <Ionicons name="flash" size={13} color="#fff" />
          <Text style={styles.applyBtnText}>Easy Apply</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function SavedJobsScreen() {
  const navigation = useNavigation<Nav>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unsaving, setUnsaving] = useState<number | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const { data } = await apiClient.get<Job[]>(API_ENDPOINTS.SAVED_JOBS);
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUnsave(jobId: number) {
    setUnsaving(jobId);
    try {
      await apiClient.delete(API_ENDPOINTS.SAVE_JOB(jobId));
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch {}
    setUnsaving(null);
  }

  async function handleApply(job: Job) {
    try {
      await apiClient.post(API_ENDPOINTS.QUICK_APPLY(job.id), {});
    } catch {}
    navigation.navigate('JobDetail', { jobId: job.id });
  }

  const renderItem = useCallback(({ item }: { item: Job }) => (
    <JobCard
      job={item}
      onUnsave={() => handleUnsave(item.id)}
      onApply={() => handleApply(item)}
      isUnsaving={unsaving === item.id}
    />
  ), [unsaving]);

  const keyExtractor = useCallback((j: Job) => String(j.id), []);

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={{ padding: 14, gap: 12 }}>
          {[1, 2, 3].map(k => <SkeletonCard key={k} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={jobs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, jobs.length === 0 && { flex: 1 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          jobs.length > 0 ? (
            <View style={styles.headerChip}>
              <Ionicons name="bookmark" size={14} color={COLORS.primary} />
              <Text style={styles.headerChipText}>{jobs.length} saved job{jobs.length !== 1 ? 's' : ''}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bookmark-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No saved jobs</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon on any job in the feed to save it here for later.
            </Text>
            <TouchableOpacity
              style={styles.browsBtn}
              onPress={() => navigation.navigate('JobFeed')}
              activeOpacity={0.85}
            >
              <Ionicons name="search-outline" size={16} color="#fff" />
              <Text style={styles.browsBtnText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 14, paddingBottom: 40 },

  headerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#BFDBFE',
    marginBottom: 12, alignSelf: 'flex-start',
  },
  headerChipText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  logo: {
    width: 48, height: 48, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { fontSize: 20, fontWeight: '800' },
  cardInfo: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 20, marginBottom: 2 },
  company: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 3 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 11, color: COLORS.textMuted },
  unsaveBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 10 },
  tagSalary: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#DBEAFE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  tagSalaryText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  tagRemote: { backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tagRemoteText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  tagNeutral: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tagNeutralText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  postedAgo: { fontSize: 11, color: COLORS.textMuted, marginLeft: 'auto' as any },

  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  matchText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  applyBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 36 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
  browsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
  },
  browsBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
