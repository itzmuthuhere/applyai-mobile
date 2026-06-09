import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import ResumeDropdown from '../../components/common/ResumeDropdown';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { JobsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setMatchScore } from '../../store/slices/jobSlice';
import { Resume, MatchScore } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<JobsStackParamList, 'MatchScore'>;
type Nav = NativeStackNavigationProp<JobsStackParamList, 'MatchScore'>;

function scoreColor(score: number) {
  if (score >= 75) return COLORS.success;
  if (score >= 55) return COLORS.warning;
  return COLORS.error;
}

function scoreBg(score: number) {
  if (score >= 75) return '#D1FAE5';
  if (score >= 55) return '#FEF3C7';
  return '#FEE2E2';
}

function scoreLabel(score: number) {
  if (score >= 80) return 'Strong Match';
  if (score >= 65) return 'Good Match';
  if (score >= 50) return 'Moderate Match';
  return 'Weak Match';
}

export default function MatchScoreScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const job = useSelector((s: RootState) => s.job.selected);
  const cachedScores = useSelector((s: RootState) => s.job.matchScores);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load user's resumes on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<Resume[]>(API_ENDPOINTS.RESUMES);
        setResumes(res.data);
        // Auto-select the first parsed resume
        const firstParsed = res.data.find((r) => r.isParsed);
        if (firstParsed) setSelectedResumeId(firstParsed.id);
      } catch {
        setError('Failed to load your resumes.');
      } finally {
        setIsLoadingResumes(false);
      }
    };
    load();
  }, []);

  // Check Redux cache whenever resume selection changes
  useEffect(() => {
    if (selectedResumeId == null) return;
    const key = `${selectedResumeId}_${params.jobId}`;
    if (cachedScores[key]) {
      setMatchResult(cachedScores[key]);
    } else {
      setMatchResult(null);
    }
  }, [selectedResumeId, params.jobId, cachedScores]);

  const analyzeMatch = useCallback(async () => {
    if (selectedResumeId == null) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await apiClient.post<MatchScore>(API_ENDPOINTS.MATCH_SCORE, {
        resumeId: selectedResumeId,
        jobId: params.jobId,
      });
      setMatchResult(res.data);
      dispatch(setMatchScore(res.data));
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? 'Failed to analyze match. Try again.';
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedResumeId, params.jobId, dispatch]);

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);
  const hasResult = matchResult !== null;
  const canAnalyze = selectedResume?.isParsed && !isAnalyzing;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoadingResumes) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Loading your resumes…</Text>
      </View>
    );
  }

  // ── No resumes at all ─────────────────────────────────────────────────────
  if (resumes.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="document-outline" size={52} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No resumes yet</Text>
        <Text style={styles.emptySubtitle}>Upload a resume first to analyze your match.</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Job header */}
      <View style={styles.jobCard}>
        <View style={styles.companyIcon}>
          <Text style={styles.companyInitial}>
            {job?.company ? job.company[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={2}>{job?.title ?? 'Job Match Analysis'}</Text>
          <Text style={styles.companyName}>{job?.company ?? ''}</Text>
        </View>
        <View style={styles.analyticsBadge}>
          <Ionicons name="analytics" size={18} color={COLORS.primary} />
        </View>
      </View>

      {/* Resume picker */}
      <View style={styles.pickerSection}>
        <Text style={styles.sectionTitle}>Select Resume to Compare</Text>
        <Text style={styles.sectionSubtitle}>Only analyzed resumes can be matched.</Text>
        <ResumeDropdown
          resumes={resumes.filter((r) => r.isParsed)}
          selectedId={selectedResumeId}
          onSelect={setSelectedResumeId}
          loading={isLoadingResumes}
        />
      </View>

      {/* Analyze button */}
      {!hasResult && (
        <TouchableOpacity
          style={[styles.analyzeBtn, !canAnalyze && styles.analyzeBtnDisabled]}
          onPress={analyzeMatch}
          disabled={!canAnalyze}
        >
          {isAnalyzing ? (
            <>
              <ActivityIndicator color={COLORS.surface} size="small" />
              <Text style={styles.analyzeBtnText}>Analyzing with AI…</Text>
            </>
          ) : (
            <>
              <Ionicons name="flash" size={18} color={COLORS.surface} />
              <Text style={styles.analyzeBtnText}>Analyze Match</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {hasResult && matchResult && (
        <>
          {/* Score ring */}
          <View style={[styles.scoreCard, { backgroundColor: scoreBg(matchResult.matchScore) }]}>
            <View style={[styles.scoreRing, { borderColor: scoreColor(matchResult.matchScore) }]}>
              <Text style={[styles.scoreNumber, { color: scoreColor(matchResult.matchScore) }]}>
                {matchResult.matchScore}
              </Text>
              <Text style={[styles.scoreOutOf, { color: scoreColor(matchResult.matchScore) }]}>
                /100
              </Text>
            </View>
            <View style={styles.scoreRight}>
              <Text style={[styles.scoreLabel, { color: scoreColor(matchResult.matchScore) }]}>
                {scoreLabel(matchResult.matchScore)}
              </Text>
              <Text style={styles.scoreDesc}>AI Match Score</Text>
              {matchResult.cached && (
                <View style={styles.cachedBadge}>
                  <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
                  <Text style={styles.cachedText}>
                    Cached · {dayjs(matchResult.createdAt).format('MMM D')}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.reanalyzeBtn}
                onPress={() => setMatchResult(null)}
              >
                <Ionicons name="refresh" size={13} color={COLORS.primary} />
                <Text style={styles.reanalyzeText}>Re-analyze</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Strengths */}
          {matchResult.strengths.length > 0 && (
            <View style={styles.listCard}>
              <View style={styles.listHeader}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.listTitle}>Strengths</Text>
              </View>
              {matchResult.strengths.map((s, i) => (
                <View key={i} style={styles.listRow}>
                  <View style={[styles.listDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.listText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Gaps */}
          {matchResult.gaps.length > 0 && (
            <View style={styles.listCard}>
              <View style={styles.listHeader}>
                <Ionicons name="warning" size={18} color={COLORS.warning} />
                <Text style={styles.listTitle}>Gaps</Text>
              </View>
              {matchResult.gaps.map((g, i) => (
                <View key={i} style={styles.listRow}>
                  <View style={[styles.listDot, { backgroundColor: COLORS.warning }]} />
                  <Text style={styles.listText}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendation */}
          <View style={styles.recommendCard}>
            <View style={styles.listHeader}>
              <Ionicons name="bulb" size={18} color={COLORS.primary} />
              <Text style={styles.listTitle}>Recommendation</Text>
            </View>
            <Text style={styles.recommendText}>{matchResult.recommendation}</Text>
          </View>

          {/* Re-analyze button at bottom */}
          <TouchableOpacity
            style={[styles.analyzeBtn, { marginTop: 4 }]}
            onPress={() => {
              setMatchResult(null);
            }}
          >
            <Ionicons name="refresh" size={17} color={COLORS.surface} />
            <Text style={styles.analyzeBtnText}>Re-analyze with Different Resume</Text>
          </TouchableOpacity>
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: COLORS.background,
  },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },

  // Empty state
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  goBackBtn: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  goBackText: { fontSize: 14, color: COLORS.textSecondary },

  // Job card
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInitial: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  companyName: { fontSize: 13, color: COLORS.textSecondary },
  analyticsBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Picker
  pickerSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  sectionSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: -6 },
  chipList: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    maxWidth: 200,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipDisabled: {
    opacity: 0.55,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flexShrink: 1 },
  chipTextSelected: { color: COLORS.surface },
  chipTextDisabled: { color: COLORS.textMuted },
  notAnalyzedBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  notAnalyzedText: { fontSize: 10, color: COLORS.warning, fontWeight: '600' },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  // Analyze button
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  analyzeBtnDisabled: { opacity: 0.45 },
  analyzeBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.surface },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error },

  // Score ring
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderRadius: 16,
    padding: 20,
  },
  scoreRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: { fontSize: 26, fontWeight: '800' },
  scoreOutOf: { fontSize: 12, fontWeight: '600', marginTop: -2 },
  scoreRight: { flex: 1, gap: 4 },
  scoreLabel: { fontSize: 18, fontWeight: '800' },
  scoreDesc: { fontSize: 12, color: COLORS.textSecondary },
  cachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cachedText: { fontSize: 11, color: COLORS.textMuted },
  reanalyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  reanalyzeText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  // Lists (strengths / gaps)
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  listDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  listText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 21 },

  // Recommendation
  recommendCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  recommendText: { fontSize: 14, color: '#1E40AF', lineHeight: 22 },
});
