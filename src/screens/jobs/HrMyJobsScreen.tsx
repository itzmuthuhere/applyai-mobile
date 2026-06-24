import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Animated, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import { HrJob } from '../../types/api.types';

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
function companyColor(name: string) {
  return COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];
}

function fmt(n: number) {
  if (n >= 100_000) return `₹${Math.round(n / 100_000)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function SkeletonCard() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.cardTop}>
        <View style={{ width: 48, height: 48, borderRadius: 13, backgroundColor: colors.border }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 14, width: '65%', backgroundColor: colors.border, borderRadius: 6 }} />
          <View style={{ height: 11, width: '45%', backgroundColor: colors.border, borderRadius: 6 }} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[60, 50, 70].map((w, i) => (
          <View key={i} style={{ height: 22, width: w, backgroundColor: colors.border, borderRadius: 6 }} />
        ))}
      </View>
    </Animated.View>
  );
}

export default function HrMyJobsScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const [jobs, setJobs] = useState<HrJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    try {
      const { data } = await apiClient.get<HrJob[]>(API_ENDPOINTS.HR_MY_JOBS);
      setJobs(data);
    } catch {
      Alert.alert('Error', 'Could not load your job postings.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, []);

  async function handleDelete(job: HrJob) {
    Alert.alert(
      'Delete Job',
      `Remove "${job.title}" from the job feed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(API_ENDPOINTS.HR_DELETE_JOB(job.id));
              setJobs(prev => prev.filter(j => j.id !== job.id));
            } catch {
              Alert.alert('Error', 'Could not delete the job. Please try again.');
            }
          },
        },
      ],
    );
  }

  const renderHeader = () => (
    <>
      {/* Stats strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{jobs.length}</Text>
          <Text style={styles.statLabel}>Active Posts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>
            {jobs.filter(j => j.deadline && dayjs(j.deadline).isAfter(dayjs())).length}
          </Text>
          <Text style={styles.statLabel}>Open Deadline</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>
            {jobs.filter(j => j.isRemote).length}
          </Text>
          <Text style={styles.statLabel}>Remote Jobs</Text>
        </View>
      </View>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Text style={styles.actionBarTitle}>
          {jobs.length} posting{jobs.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          style={styles.postNewBtn}
          onPress={() => navigation.navigate('HrPostJob')}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.postNewBtnText}>Post New Job</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.list}>
          {[1, 2, 3].map(k => <SkeletonCard key={k} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={jobs}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadJobs(true)} tintColor={colors.primary} />
        }
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="briefcase-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No job postings yet</Text>
            <Text style={styles.emptySub}>
              Post your first job and start receiving applications from qualified candidates on ApplyAI.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('HrPostJob')}
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Post Your First Job</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const color = companyColor(item.company);
          const salary = item.salaryMin && item.salaryMax
            ? `${fmt(item.salaryMin)} – ${fmt(item.salaryMax)}`
            : item.salaryMin ? `${fmt(item.salaryMin)}+`
            : null;
          const isExpired = item.deadline && dayjs(item.deadline).isBefore(dayjs());
          const deadlineSoon = item.deadline && !isExpired && dayjs(item.deadline).diff(dayjs(), 'day') <= 3;

          return (
            <View style={styles.card}>
              {/* Card top */}
              <View style={styles.cardTop}>
                <View style={[styles.companyIcon, { backgroundColor: color + '18', borderColor: color + '30' }]}>
                  <Text style={[styles.companyInitial, { color }]}>
                    {item.company.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.company} numberOfLines={1}>{item.company}</Text>
                </View>
                <TouchableOpacity
                  testID="delete-job-btn"
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.error} />
                </TouchableOpacity>
              </View>

              {/* Tags */}
              <View style={styles.tagsRow}>
                {item.location && (
                  <View style={styles.tag}>
                    <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                    <Text style={styles.tagText}>{item.location}</Text>
                  </View>
                )}
                {item.isRemote && (
                  <View style={[styles.tag, styles.tagGreen]}>
                    <Ionicons name="wifi-outline" size={11} color={colors.success} />
                    <Text style={[styles.tagText, styles.tagTextGreen]}>Remote</Text>
                  </View>
                )}
                {salary && (
                  <View style={[styles.tag, { backgroundColor: color + '14' }]}>
                    <Ionicons name="cash-outline" size={11} color={color} />
                    <Text style={[styles.tagText, { color, fontWeight: '600' }]}>{salary}</Text>
                  </View>
                )}
                {item.category && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.category}</Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.postedRow}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.postedDate}>
                    Posted {dayjs(item.scrapedAt).fromNow()}
                  </Text>
                </View>
                {item.deadline && (
                  <View style={[
                    styles.deadlinePill,
                    isExpired ? styles.deadlineExpired : deadlineSoon ? styles.deadlineSoon : styles.deadlineOk,
                  ]}>
                    <Ionicons
                      name={isExpired ? 'close-circle-outline' : 'calendar-outline'}
                      size={11}
                      color={isExpired ? colors.error : deadlineSoon ? colors.warning : colors.textMuted}
                    />
                    <Text style={[
                      styles.deadlineText,
                      isExpired ? { color: colors.error } : deadlineSoon ? { color: colors.warning } : {},
                    ]}>
                      {isExpired ? 'Expired' : `Closes ${dayjs(item.deadline).format('MMM D')}`}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 12, paddingBottom: 40 },

  // Stats strip
  statsStrip: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border,
    marginBottom: 4,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 4 },

  // Action bar
  actionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 2, paddingHorizontal: 2,
  },
  actionBarTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  postNewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.success, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: colors.success, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  postNewBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyIcon: {
    width: 48, height: 48, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  companyInitial: { fontSize: 20, fontWeight: '800' },
  cardMeta: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  company: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  tagGreen: { backgroundColor: '#D1FAE5' },
  tagText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  tagTextGreen: { color: colors.success, fontWeight: '600' },

  // Footer
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postedDate: { fontSize: 12, color: colors.textMuted },
  deadlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  deadlineOk: { backgroundColor: '#F1F5F9' },
  deadlineSoon: { backgroundColor: '#FEF3C7' },
  deadlineExpired: { backgroundColor: '#FEE2E2' },
  deadlineText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  emptyIconBox: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.success, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 13, marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}