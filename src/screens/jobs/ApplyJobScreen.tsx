import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { JobsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setResumes } from '../../store/slices/resumeSlice';
import { addApplication } from '../../store/slices/applicationSlice';
import { Resume, Application } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import ResumeDropdown from '../../components/common/ResumeDropdown';

type RouteProps = RouteProp<JobsStackParamList, 'ApplyJob'>;
type Nav = NativeStackNavigationProp<JobsStackParamList, 'ApplyJob'>;

export default function ApplyJobScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const selectedJob = useSelector((s: RootState) => s.job.selected);
  const resumes = useSelector((s: RootState) => s.resume.list);

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumesLoading, setResumesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (resumes.length === 0) loadResumes();
  }, []);

  async function loadResumes() {
    setResumesLoading(true);
    try {
      const { data } = await apiClient.get<Resume[]>(API_ENDPOINTS.RESUMES);
      dispatch(setResumes(data));
    } catch {
      // keep empty
    } finally {
      setResumesLoading(false);
    }
  }

  async function handleApply() {
    if (!selectedResumeId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { jobId: params.jobId, resumeId: selectedResumeId };
      if (coverLetter.trim()) body.coverLetter = coverLetter.trim();
      const { data } = await apiClient.post<Application>(API_ENDPOINTS.APPLICATIONS_APPLY, body);
      dispatch(addApplication(data));
      setSubmitted(true);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        e?.message ??
        'Failed to submit application.';
      console.log('[ApplyJob] Error:', JSON.stringify(e?.response?.data), 'status:', e?.response?.status, 'msg:', e?.message);
      if (msg.toLowerCase().includes('already applied')) {
        setError('You have already applied to this job.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const jobLabel = selectedJob
    ? `${selectedJob.title} at ${selectedJob.company}`
    : `Job #${params.jobId}`;

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconWrap}>
          <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
        </View>
        <Text style={styles.successTitle}>Application Submitted!</Text>
        <Text style={styles.successSubtitle}>
          Your application for{'\n'}
          <Text style={styles.successJobName}>{jobLabel}</Text>
          {'\n'}has been sent successfully.
        </Text>
        <TouchableOpacity
          style={styles.viewAppsBtn}
          onPress={() =>
            navigation.dispatch(CommonActions.navigate({ name: 'ApplicationsTab' }))
          }
        >
          <Ionicons name="list-outline" size={18} color="#fff" />
          <Text style={styles.viewAppsBtnText}>View My Applications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'JobsTab' }))}
        >
          <Text style={styles.backBtnText}>Back to Jobs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.jobHeader}>
        <Ionicons name="briefcase-outline" size={16} color={COLORS.primary} />
        <Text style={styles.jobLabel} numberOfLines={2}>
          {jobLabel}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Select Resume to Submit</Text>
      <ResumeDropdown
        resumes={resumes}
        selectedId={selectedResumeId}
        onSelect={(id) => { setSelectedResumeId(id); setError(null); }}
        loading={resumesLoading}
        placeholder="Choose a resume…"
      />

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        Cover Letter <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TextInput
        style={styles.textArea}
        placeholder="Paste or write your cover letter here…"
        placeholderTextColor={COLORS.textMuted}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        value={coverLetter}
        onChangeText={setCoverLetter}
      />

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitBtn,
          (!selectedResumeId || isSubmitting) && styles.submitBtnDisabled,
        ]}
        onPress={handleApply}
        disabled={!selectedResumeId || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color="#fff" />
            <Text style={styles.submitBtnText}>Submit Application</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },

  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
  },
  jobLabel: { flex: 1, fontSize: 14, color: COLORS.primary, fontWeight: '700' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  optional: { fontSize: 13, fontWeight: '400', color: COLORS.textSecondary },

  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 140,
    marginBottom: 20,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
  },
  submitBtnDisabled: { backgroundColor: COLORS.textMuted },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Success screen
  successContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  successIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  successSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  successJobName: { fontWeight: '700', color: COLORS.textPrimary },
  viewAppsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    marginTop: 8,
  },
  viewAppsBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  backBtn: {
    paddingVertical: 12,
  },
  backBtnText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
});
