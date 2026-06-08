import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { ApplicationsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import {
  setSelectedApplication,
  updateApplication,
} from '../../store/slices/applicationSlice';
import { Application, ApplicationStatus } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<ApplicationsStackParamList, 'ApplicationDetail'>;
type Nav = NativeStackNavigationProp<ApplicationsStackParamList, 'ApplicationDetail'>;

const STATUS_ORDER: ApplicationStatus[] = [
  'APPLIED',
  'VIEWED',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
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

const TERMINAL_STATUSES: ApplicationStatus[] = ['REJECTED', 'WITHDRAWN'];

export default function ApplicationDetailScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplication();
  }, []);

  async function loadApplication() {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<Application>(
        API_ENDPOINTS.APPLICATION_BY_ID(params.applicationId)
      );
      setApplication(data);
      dispatch(setSelectedApplication(data));
    } catch (e: any) {
      setError('Could not load application.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(newStatus: ApplicationStatus) {
    if (!application) return;
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const { data } = await apiClient.put<Application>(
        API_ENDPOINTS.APPLICATION_STATUS(application.id),
        { status: newStatus }
      );
      setApplication(data);
      dispatch(updateApplication(data));
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Status update failed.';
      Alert.alert('Error', msg);
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (error || !application) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>{error ?? 'Application not found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadApplication}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isTerminal = TERMINAL_STATUSES.includes(application.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Job card */}
      <View style={styles.jobCard}>
        <View style={styles.companyIcon}>
          <Text style={styles.companyInitial}>
            {application.job.company.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{application.job.title}</Text>
          <Text style={styles.company}>{application.job.company}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.location}>{application.job.location}</Text>
          </View>
        </View>
      </View>

      {/* Status + dates */}
      <View style={styles.metaCard}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Status</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[application.status].bg }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLORS[application.status].text }]}>
              {STATUS_LABELS[application.status]}
            </Text>
          </View>
        </View>
        {application.appliedAt && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Applied</Text>
            <Text style={styles.metaValue}>
              {dayjs(application.appliedAt).format('MMM D, YYYY')}
            </Text>
          </View>
        )}
        {application.lastUpdated && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Last updated</Text>
            <Text style={styles.metaValue}>
              {dayjs(application.lastUpdated).format('MMM D, YYYY')}
            </Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Resume sent</Text>
          <Text style={styles.metaValue}>{application.resume.versionName}</Text>
        </View>
      </View>

      {/* Cover letter */}
      {application.coverLetter && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionToggle}
            onPress={() => setShowCoverLetter((v) => !v)}
          >
            <Text style={styles.sectionTitle}>Cover Letter</Text>
            <Ionicons
              name={showCoverLetter ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
          {showCoverLetter && (
            <Text style={styles.coverLetterText} selectable>
              {application.coverLetter}
            </Text>
          )}
        </View>
      )}

      {/* Status picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        {isTerminal ? (
          <View style={styles.terminalNote}>
            <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.terminalNoteText}>
              Status is {STATUS_LABELS[application.status]} — cannot be changed.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statusGrid}>
              {STATUS_ORDER.filter((s) => !TERMINAL_STATUSES.includes(s)).map((s) => {
                const active = s === application.status;
                const c = STATUS_COLORS[s];
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusChip,
                      active && { backgroundColor: c.bg, borderColor: c.text },
                    ]}
                    onPress={() => !active && handleStatusUpdate(s)}
                    disabled={active || isUpdating}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        active && { color: c.text, fontWeight: '700' },
                      ]}
                    >
                      {STATUS_LABELS[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() =>
                Alert.alert('Withdraw Application', 'This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Withdraw', style: 'destructive', onPress: () => handleStatusUpdate('WITHDRAWN') },
                ])
              }
              disabled={isUpdating}
            >
              <Text style={styles.withdrawBtnText}>Withdraw Application</Text>
            </TouchableOpacity>
          </>
        )}
        {isUpdating && (
          <ActivityIndicator color={COLORS.primary} size="small" style={{ marginTop: 8 }} />
        )}
      </View>

      {/* Practice interview CTA */}
      {application.status === 'INTERVIEW' && (
        <TouchableOpacity
          style={styles.interviewBtn}
          onPress={() =>
            navigation.navigate('InterviewStart' as any, { applicationId: application.id })
          }
        >
          <Ionicons name="mic-outline" size={20} color="#fff" />
          <View style={styles.interviewBtnText}>
            <Text style={styles.interviewBtnTitle}>Practice Mock Interview</Text>
            <Text style={styles.interviewBtnSub}>7 AI-generated questions for this role</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Notes */}
      {application.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{application.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },

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

  jobCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInitial: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  company: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 13, color: COLORS.textMuted },

  metaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    gap: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaLabel: { fontSize: 13, color: COLORS.textSecondary },
  metaValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500', flexShrink: 1, textAlign: 'right', maxWidth: '60%' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  coverLetterText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 21,
    marginTop: 8,
  },

  terminalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
  },
  terminalNoteText: { fontSize: 13, color: COLORS.textSecondary },

  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  statusChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },

  withdrawBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  withdrawBtnText: { fontSize: 13, color: COLORS.error, fontWeight: '600' },

  interviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  interviewBtnText: { flex: 1 },
  interviewBtnTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  interviewBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  notesText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
});
