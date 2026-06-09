import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import ResumeDropdown from '../../components/common/ResumeDropdown';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { ResumeStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setResumes } from '../../store/slices/resumeSlice';
import { Resume, CoverLetterResponse } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<ResumeStackParamList, 'CoverLetter'>;
type Nav = NativeStackNavigationProp<ResumeStackParamList, 'CoverLetter'>;

export default function CoverLetterScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const selectedJob = useSelector((s: RootState) => s.job.selected);
  const resumes = useSelector((s: RootState) => s.resume.list);

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(
    params.resumeId ?? null
  );
  const [resumesLoading, setResumesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedResumes = resumes.filter((r) => r.isParsed);

  useEffect(() => {
    if (resumes.length === 0) {
      loadResumes();
    }
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

  async function handleGenerate() {
    if (!selectedResumeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<CoverLetterResponse>(
        API_ENDPOINTS.COVER_LETTER,
        { resumeId: selectedResumeId, jobId: params.jobId }
      );
      setCoverLetter(data.coverLetter);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.response?.data?.error ?? 'Generation failed. Try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  const jobLabel = selectedJob
    ? `${selectedJob.title} at ${selectedJob.company}`
    : `Job #${params.jobId}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.jobHeader}>
        <Ionicons name="briefcase-outline" size={16} color={COLORS.primary} />
        <Text style={styles.jobLabel} numberOfLines={1}>
          {jobLabel}
        </Text>
      </View>

      {!coverLetter && (
        <>
          <Text style={styles.sectionTitle}>Select a Resume</Text>
          <Text style={styles.hint}>Only analyzed resumes can be used.</Text>

          <ResumeDropdown
            resumes={parsedResumes}
            selectedId={selectedResumeId}
            onSelect={setSelectedResumeId}
            loading={resumesLoading}
          />

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.ctaBtn, (!selectedResumeId || isLoading) && styles.ctaBtnDisabled]}
            onPress={handleGenerate}
            disabled={!selectedResumeId || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color="#fff" />
                <Text style={styles.ctaBtnText}>Generate Cover Letter</Text>
              </>
            )}
          </TouchableOpacity>

          {isLoading && (
            <Text style={styles.loadingHint}>
              AI is writing your cover letter… this takes ~10 seconds.
            </Text>
          )}
        </>
      )}

      {coverLetter && (
        <>
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.successText}>Cover letter ready!</Text>
          </View>

          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.noteText}>
              This cover letter is not saved — copy or share it before leaving.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Your Cover Letter</Text>
          <View style={styles.textBox}>
            <Text style={styles.coverText} selectable>
              {coverLetter}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => Share.share({ message: coverLetter })}
          >
            <Ionicons name="copy-outline" size={18} color="#fff" />
            <Text style={styles.shareBtnText}>Copy / Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.regenerateBtn}
            onPress={() => {
              setCoverLetter(null);
              setSelectedResumeId(params.resumeId ?? null);
            }}
          >
            <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
            <Text style={styles.regenerateBtnText}>Generate Again</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },

  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 24,
  },
  jobLabel: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8, marginTop: 16 },
  hint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },

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

  pickerRow: { paddingVertical: 4, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    maxWidth: 180,
  },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', flexShrink: 1 },
  chipTextSelected: { color: COLORS.primary, fontWeight: '700' },
  chipScore: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  chipScoreSelected: { color: COLORS.primary },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 24,
  },
  ctaBtnDisabled: { backgroundColor: COLORS.textMuted },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  loadingHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  successText: { fontSize: 14, fontWeight: '600', color: COLORS.success },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  noteText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  textBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  coverText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  shareBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  regenerateBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
});
