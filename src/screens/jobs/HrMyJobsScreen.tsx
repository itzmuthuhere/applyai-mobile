import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { COLORS, API_ENDPOINTS } from '../../constants';
import apiClient from '../../api/apiClient';
import { HrJob } from '../../types/api.types';

function fmt(n: number) {
  if (n >= 100_000) return `₹${Math.round(n / 100_000)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function HrMyJobsScreen() {
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
          <RefreshControl refreshing={refreshing} onRefresh={() => loadJobs(true)} tintColor={COLORS.primary} />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.count}>{jobs.length} active posting{jobs.length !== 1 ? 's' : ''}</Text>
            <TouchableOpacity
              style={styles.postNewBtn}
              onPress={() => navigation.navigate('HrPostJob')}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.postNewBtnText}>Post New</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No job postings yet</Text>
            <Text style={styles.emptySub}>
              Post your first job and start receiving applications from qualified candidates.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('HrPostJob')}
            >
              <Text style={styles.emptyBtnText}>Post Your First Job</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const salary = item.salaryMin && item.salaryMax
            ? `${fmt(item.salaryMin)} – ${fmt(item.salaryMax)}`
            : item.salaryMin ? `${fmt(item.salaryMin)}+`
            : null;

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.companyIcon}>
                  <Text style={styles.companyInitial}>
                    {item.company.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.company} numberOfLines={1}>{item.company}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.tagsRow}>
                {item.location && (
                  <View style={styles.tag}>
                    <Ionicons name="location-outline" size={11} color={COLORS.textSecondary} />
                    <Text style={styles.tagText}>{item.location}</Text>
                  </View>
                )}
                {item.isRemote && (
                  <View style={[styles.tag, styles.tagGreen]}>
                    <Text style={[styles.tagText, { color: '#065F46', fontWeight: '600' }]}>Remote</Text>
                  </View>
                )}
                {salary && (
                  <View style={[styles.tag, styles.tagBlue]}>
                    <Text style={[styles.tagText, { color: COLORS.primary, fontWeight: '600' }]}>{salary}</Text>
                  </View>
                )}
                {item.category && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.category}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.postedDate}>
                  Posted {dayjs(item.scrapedAt).fromNow()}
                </Text>
                {item.deadline && (
                  <Text style={styles.deadline}>
                    Deadline: {dayjs(item.deadline).format('MMM D, YYYY')}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },

  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 4,
  },
  count: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  postNewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#059669', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  postNewBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyIcon: {
    width: 44, height: 44, borderRadius: 11,
    backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center',
  },
  companyInitial: { fontSize: 18, fontWeight: '700', color: '#059669' },
  cardMeta: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  company: { fontSize: 13, color: COLORS.textSecondary },
  deleteBtn: { padding: 4 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  tagGreen: { backgroundColor: '#D1FAE5' },
  tagBlue: { backgroundColor: COLORS.primaryLight },
  tagText: { fontSize: 12, color: COLORS.textSecondary },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postedDate: { fontSize: 12, color: COLORS.textMuted },
  deadline: { fontSize: 12, color: COLORS.warning, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    backgroundColor: '#059669', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
