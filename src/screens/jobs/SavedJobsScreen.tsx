import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { JobsStackParamList } from '../../navigation/types';
import { Job } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type Nav = NativeStackNavigationProp<JobsStackParamList, 'SavedJobs'>;

function fmtSalary(min: number | null, max: number | null) {
  const f = (n: number) => n >= 100000 ? `₹${Math.round(n / 100000)}L` : `₹${n.toLocaleString('en-IN')}`;
  if (min && max) return `${f(min)}–${f(max)}`;
  if (min) return `${f(min)}+`;
  return null;
}

export default function SavedJobsScreen() {
  const navigation = useNavigation<Nav>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsaving, setUnsaving] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Job[]>(API_ENDPOINTS.SAVED_JOBS);
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  if (jobs.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="bookmark-outline" size={52} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No saved jobs</Text>
        <Text style={styles.emptyText}>Tap the bookmark icon on any job to save it for later.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={j => String(j.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item: job }) => {
        const salary = fmtSalary(job.salaryMin, job.salaryMax);
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{job.company?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
                <Text style={styles.company} numberOfLines={1}>{job.company}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleUnsave(job.id)}
                disabled={unsaving === job.id}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {unsaving === job.id
                  ? <ActivityIndicator size="small" color={COLORS.primary} />
                  : <Ionicons name="bookmark" size={22} color={COLORS.primary} />
                }
              </TouchableOpacity>
            </View>
            <View style={styles.chips}>
              {job.isRemote && <View style={styles.chip}><Text style={styles.chipText}>Remote</Text></View>}
              {salary && <View style={styles.chip}><Text style={styles.chipText}>{salary}</Text></View>}
              {job.category && <View style={styles.chip}><Text style={styles.chipText}>{job.category}</Text></View>}
              {job.postedDate && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{dayjs(job.postedDate).format('MMM D')}</Text>
                </View>
              )}
            </View>
            {job.matchScore != null && (
              <View style={styles.matchRow}>
                <Ionicons name="analytics-outline" size={13} color={COLORS.primary} />
                <Text style={styles.matchText}>{job.matchScore}% match</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: COLORS.background },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
  list: { padding: 14, gap: 10 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  cardInfo: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  company: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: COLORS.background, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  matchText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
});
