import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { ResumeStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { addResume, setResumes } from '../../store/slices/resumeSlice';
import { Resume, TailoredResumeResponse } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<ResumeStackParamList, 'TailorResume'>;
type Nav = NativeStackNavigationProp<ResumeStackParamList, 'TailorResume'>;

export default function TailorResumeScreen() {
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
  const [result, setResult] = useState<TailoredResumeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedResumes = resumes.filter((r) => r.isParsed);

  useEffect(() => {
    if (resumes.length === 0) {
      loadResumes();
    }
  }, []);

  // Once resumes load, validate the pre-selected resumeId is actually parsed
  useEffect(() => {
    if (selectedResumeId !== null && resumes.length > 0) {
      const isParsed = parsedResumes.some((r) => r.id === selectedResumeId);
      if (!isParsed) setSelectedResumeId(null);
    }
  }, [resumes]);

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

  async function handleTailor() {
    if (!selectedResumeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<TailoredResumeResponse>(
        API_ENDPOINTS.TAILOR,
        { resumeId: selectedResumeId, jobId: params.jobId }
      );
      setResult(data);
      dispatch(
        addResume({
          id: data.newResumeId,
          versionName: data.versionName,
          fileUrl: '',
          aiScore: null,
          isOriginal: false,
          isParsed: false,
          createdAt: new Date().toISOString(),
        })
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.response?.data?.error ?? 'Tailoring failed. Try again.';
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
      <View style={[styles.jobHeader, !params.jobId && styles.jobHeaderWarn]}>
        <Ionicons
          name="briefcase-outline"
          size={16}
          color={params.jobId ? COLORS.primary : COLORS.warning}
        />
        <Text style={[styles.jobLabel, !params.jobId && styles.jobLabelWarn]} numberOfLines={1}>
          {params.jobId ? jobLabel : 'No job selected — open a job and tap "Tailor Resume"'}
        </Text>
      </View>

      {!result && (
        <>
          <Text style={styles.sectionTitle}>Select a Resume</Text>
          <Text style={styles.hint}>Only analyzed resumes can be tailored.</Text>

          {resumesLoading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
          ) : parsedResumes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="document-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No analyzed resumes found.</Text>
              <Text style={styles.emptySubtext}>
                Upload and analyze a resume first from the Resume tab.
              </Text>
            </View>
          ) : (
            <FlatList
              data={parsedResumes}
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

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.ctaBtn, (!selectedResumeId || !params.jobId || isLoading) && styles.ctaBtnDisabled]}
            onPress={handleTailor}
            disabled={!selectedResumeId || !params.jobId || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="color-wand-outline" size={18} color="#fff" />
                <Text style={styles.ctaBtnText}>Tailor Resume with AI</Text>
              </>
            )}
          </TouchableOpacity>

          {isLoading && (
            <Text style={styles.loadingHint}>
              AI is rewriting your resume for this role… this takes ~15 seconds.
            </Text>
          )}
        </>
      )}

      {result && (
        <>
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.successText}>Resume tailored successfully!</Text>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultVersionLabel}>New version created:</Text>
            <Text style={styles.resultVersionName}>{result.versionName}</Text>
          </View>

          <Text style={styles.sectionTitle}>Changes Made</Text>
          {result.changes.map((change, i) => (
            <View key={i} style={styles.changeRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
              <Text style={styles.changeText}>{change}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Tailored Resume Content</Text>
          <View style={styles.textBox}>
            <Text style={styles.tailoredText}>{result.tailoredText}</Text>
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => Share.share({ message: result.tailoredText })}
            >
              <Ionicons name="share-outline" size={16} color={COLORS.primary} />
              <Text style={styles.shareBtnText}>Share / Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => navigation.navigate('ResumeList')}
            >
              <Text style={styles.doneBtnText}>View My Resumes</Text>
            </TouchableOpacity>
          </View>
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
  jobHeaderWarn: { backgroundColor: '#FEF3C7' },
  jobLabelWarn: { color: COLORS.warning },

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
    backgroundColor: COLORS.primary,
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
    marginBottom: 16,
  },
  successText: { fontSize: 14, fontWeight: '600', color: COLORS.success },

  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  resultVersionLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
  resultVersionName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },

  changeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  changeText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },

  textBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 20,
  },
  tailoredText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },

  resultActions: { gap: 12 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  shareBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
