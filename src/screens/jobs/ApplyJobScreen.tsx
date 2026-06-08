import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
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
      navigation.navigate('JobFeed');
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.response?.data?.error ?? 'Failed to submit application.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const jobLabel = selectedJob
    ? `${selectedJob.title} at ${selectedJob.company}`
    : `Job #${params.jobId}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.jobHeader}>
        <Ionicons name="briefcase-outline" size={16} color={COLORS.primary} />
        <Text style={styles.jobLabel} numberOfLines={2}>
          {jobLabel}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Select Resume to Submit</Text>
      {resumesLoading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
      ) : resumes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-outline" size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No resumes found.</Text>
          <Text style={styles.emptySubtext}>Upload a resume from the Resume tab first.</Text>
        </View>
      ) : (
        <FlatList
          data={resumes}
          keyExtractor={(r) => String(r.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerRow}
          renderItem={({ item }) => {
            const selected = item.id === selectedResumeId;
            return (
              <TouchableOpacity
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setSelectedResumeId(item.id)}
              >
                <Ionicons
                  name={item.isOriginal ? 'document-outline' : 'color-wand-outline'}
                  size={13}
                  color={selected ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                  numberOfLines={1}
                >
                  {item.versionName}
                </Text>
                {item.aiScore != null && (
                  <Text style={[styles.chipScore, selected && styles.chipScoreSelected]}>
                    {item.aiScore}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Text style={styles.sectionTitle}>
        Cover Letter{' '}
        <Text style={styles.optional}>(optional)</Text>
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
        style={[styles.submitBtn, (!selectedResumeId || isSubmitting) && styles.submitBtnDisabled]}
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

  spinner: { marginVertical: 20 },

  emptyBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  emptyText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginTop: 8 },
  emptySubtext: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },

  pickerRow: { paddingVertical: 4, gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    maxWidth: 200,
  },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', flexShrink: 1 },
  chipTextSelected: { color: COLORS.primary, fontWeight: '700' },
  chipScore: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  chipScoreSelected: { color: COLORS.primary },

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
});
