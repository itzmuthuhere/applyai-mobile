import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { COLORS, API_ENDPOINTS, ROUTES } from '../../constants';
import { JobsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setSelectedJob } from '../../store/slices/jobSlice';
import { Job } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<JobsStackParamList, 'JobDetail'>;
type Nav = NativeStackNavigationProp<JobsStackParamList, 'JobDetail'>;

function formatSalary(min: number | null, max: number | null): string | null {
  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr/yr`;
    if (n >= 100000) return `₹${Math.round(n / 100000)}L/yr`;
    return `₹${n.toLocaleString('en-IN')}/yr`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

export default function JobDetailScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const job = useSelector((s: RootState) => s.job.selected);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<Job>(API_ENDPOINTS.JOB_BY_ID(params.jobId));
        dispatch(setSelectedJob(res.data));
      } catch {
        setError('Failed to load job details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
    return () => { dispatch(setSelectedJob(null)); };
  }, [params.jobId]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error ?? 'Job not found.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.companyIcon}>
          <Text style={styles.companyInitial}>
            {job.company ? job.company[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.companyName}>{job.company}</Text>
        </View>
      </View>

      {/* Meta chips */}
      <View style={styles.metaCard}>
        {job.location && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
        )}
        {job.isRemote && (
          <View style={styles.metaRow}>
            <Ionicons name="wifi-outline" size={16} color={COLORS.success} />
            <Text style={[styles.metaText, { color: COLORS.success }]}>Remote OK</Text>
          </View>
        )}
        {salary && (
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{salary}</Text>
          </View>
        )}
        {job.postedDate && (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>Posted {dayjs(job.postedDate).format('MMM D, YYYY')}</Text>
          </View>
        )}
        {job.source && (
          <View style={styles.metaRow}>
            <Ionicons name="link-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{job.source}</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsCard}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            navigation.navigate(ROUTES.MATCH_SCORE as 'MatchScore', { jobId: job.id })
          }
        >
          <Ionicons name="analytics-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>See Match Score</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('TailorResume', { jobId: job.id })}
        >
          <Ionicons name="color-wand-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>Tailor Resume</Text>
        </TouchableOpacity>

        <View style={styles.actionDivider} />

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('CoverLetter', { jobId: job.id })}
        >
          <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>Cover Letter</Text>
        </TouchableOpacity>
      </View>

      {/* View original posting */}
      {job.sourceUrl && (
        <TouchableOpacity
          style={styles.sourceUrlBtn}
          onPress={() => Linking.openURL(job.sourceUrl!)}
        >
          <Ionicons name="open-outline" size={15} color={COLORS.primary} />
          <Text style={styles.sourceUrlText}>View Original Posting</Text>
        </TouchableOpacity>
      )}

      {/* Description */}
      <View style={styles.descriptionCard}>
        <Text style={styles.sectionTitle}>Job Description</Text>
        <Text style={styles.descriptionText}>{job.description}</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },

  errorText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  retryButton: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryText: { fontSize: 14, color: COLORS.textSecondary },

  // Header
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  companyIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInitial: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  headerInfo: { flex: 1 },
  jobTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  companyName: { fontSize: 14, color: COLORS.textSecondary },

  // Meta
  metaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, color: COLORS.textSecondary },

  // Actions
  actionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  actionBtnDisabled: { opacity: 0.45 },
  actionBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.primary },
  actionBtnTextDisabled: { color: COLORS.textSecondary },
  actionDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  comingSoon: {
    fontSize: 11,
    color: COLORS.textMuted,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // Source URL
  sourceUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingVertical: 10,
  },
  sourceUrlText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  // Description
  descriptionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  descriptionText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
});
