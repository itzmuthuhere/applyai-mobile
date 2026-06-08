import React, { useEffect, useState, useCallback } from 'react';
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
import { ResumeStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setSelectedResume, updateResumeScore } from '../../store/slices/resumeSlice';
import { ParsedResume, ResumeScore } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<ResumeStackParamList, 'ResumeDetail'>;
type Nav = NativeStackNavigationProp<ResumeStackParamList, 'ResumeDetail'>;

export default function ResumeDetailScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const resume = useSelector((s: RootState) =>
    s.resume.list.find((r) => r.id === params.resumeId),
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedResume | null>(null);
  const [scoreResult, setScoreResult] = useState<ResumeScore | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => {
    if (resume) dispatch(setSelectedResume(resume));
    return () => { dispatch(setSelectedResume(null)); };
  }, [resume, dispatch]);

  // Auto-load analysis if already scored
  useEffect(() => {
    if (resume?.aiScore !== null && resume?.aiScore !== undefined && !scoreResult) {
      runAnalysis(true);
    }
  }, [resume?.id]);

  const runAnalysis = useCallback(async (silent = false) => {
    if (!resume) return;
    if (!silent) setAnalyzeError(null);
    setIsAnalyzing(true);
    try {
      const [parseRes, scoreRes] = await Promise.all([
        apiClient.post<ParsedResume>(API_ENDPOINTS.RESUME_PARSE, { resumeId: resume.id }),
        apiClient.post<ResumeScore>(API_ENDPOINTS.RESUME_SCORE, { resumeId: resume.id }),
      ]);
      setParseResult(parseRes.data);
      setScoreResult(scoreRes.data);
      dispatch(updateResumeScore({ resumeId: resume.id, score: scoreRes.data.score }));
    } catch {
      if (!silent) setAnalyzeError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [resume, dispatch]);

  const scoreColor = (score: number) => {
    if (score >= 75) return COLORS.success;
    if (score >= 50) return COLORS.warning;
    return COLORS.error;
  };

  const scoreBg = (score: number) => {
    if (score >= 75) return '#D1FAE5';
    if (score >= 50) return '#FEF3C7';
    return '#FEE2E2';
  };

  const scoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Work';
  };

  if (!resume) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Resume not found.</Text>
      </View>
    );
  }

  const displayScore = scoreResult?.score ?? resume.aiScore;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.fileIconWrap}>
          <Ionicons name="document-text" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.versionName}>{resume.versionName}</Text>
          <Text style={styles.uploadedAt}>Uploaded {dayjs(resume.createdAt).format('MMM D, YYYY')}</Text>
          <View style={styles.badgeRow}>
            {resume.isOriginal && (
              <View style={styles.originalBadge}>
                <Text style={styles.originalText}>Original</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewFileBtn}
          onPress={() => Linking.openURL(resume.fileUrl)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="open-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Score Ring */}
      {displayScore !== null && !isAnalyzing && (
        <View style={[styles.scoreCard, { backgroundColor: scoreBg(displayScore) }]}>
          <View style={[styles.scoreRing, { borderColor: scoreColor(displayScore) }]}>
            <Text style={[styles.scoreNumber, { color: scoreColor(displayScore) }]}>
              {displayScore}
            </Text>
            <Text style={[styles.scoreOutOf, { color: scoreColor(displayScore) }]}>/100</Text>
          </View>
          <View style={styles.scoreRight}>
            <Text style={[styles.scoreLabel, { color: scoreColor(displayScore) }]}>
              {scoreLabel(displayScore)}
            </Text>
            <Text style={styles.scoreDesc}>AI Resume Score</Text>
            <TouchableOpacity
              style={styles.reanalyzeBtn}
              onPress={() => runAnalysis()}
              disabled={isAnalyzing}
            >
              <Ionicons name="refresh" size={14} color={COLORS.primary} />
              <Text style={styles.reanalyzeText}>Re-analyze</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Analyze CTA — shown when not yet scored */}
      {displayScore === null && !isAnalyzing && (
        <View style={styles.analyzeCard}>
          <Ionicons name="sparkles" size={32} color={COLORS.primary} />
          <Text style={styles.analyzeTitle}>Get AI Feedback</Text>
          <Text style={styles.analyzeSubtitle}>
            Analyze your resume to get a score, skill breakdown, and improvement tips.
          </Text>
          <TouchableOpacity style={styles.analyzeButton} onPress={() => runAnalysis()}>
            <Text style={styles.analyzeButtonText}>Analyze Resume</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Analyzing spinner */}
      {isAnalyzing && (
        <View style={styles.analyzingCard}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.analyzingText}>Analyzing your resume with AI...</Text>
          <Text style={styles.analyzingHint}>This may take 10–15 seconds</Text>
        </View>
      )}

      {/* Error */}
      {analyzeError && !isAnalyzing && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{analyzeError}</Text>
        </View>
      )}

      {/* Skills Section */}
      {parseResult && !isAnalyzing && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills Detected</Text>
            <View style={styles.chipsWrap}>
              {parseResult.skills.map((skill, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {parseResult.techStack.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tech Stack</Text>
              <View style={styles.chipsWrap}>
                {parseResult.techStack.map((tech, i) => (
                  <View key={i} style={[styles.chip, styles.chipTech]}>
                    <Text style={[styles.chipText, styles.chipTextTech]}>{tech}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="briefcase-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue}>{parseResult.experienceYears} yrs</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Ionicons name="school-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>Education</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{parseResult.education}</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Strengths */}
      {scoreResult && !isAnalyzing && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strengths</Text>
            {scoreResult.strengths.map((s, i) => (
              <View key={i} style={styles.listRow}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.listText}>{s}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Improvements</Text>
            {scoreResult.improvements.map((imp, i) => (
              <View key={i} style={styles.listRow}>
                <Ionicons name="arrow-up-circle" size={18} color={COLORS.warning} />
                <Text style={styles.listText}>{imp}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            navigation.navigate(ROUTES.TAILOR_RESUME as 'TailorResume', {
              resumeId: resume.id,
              jobId: 0,
            })
          }
        >
          <Ionicons name="color-wand-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>Tailor for a Job</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, color: COLORS.textSecondary },

  // Header Card
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  fileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  versionName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  uploadedAt: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  originalBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  originalText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  viewFileBtn: { padding: 4 },

  // Score Ring
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 20,
    gap: 20,
  },
  scoreRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  scoreNumber: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  scoreOutOf: { fontSize: 11, fontWeight: '500' },
  scoreRight: { flex: 1, gap: 4 },
  scoreLabel: { fontSize: 20, fontWeight: '700' },
  scoreDesc: { fontSize: 13, color: COLORS.textSecondary },
  reanalyzeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  reanalyzeText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },

  // Analyze CTA
  analyzeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  analyzeTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  analyzeSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 8 },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  analyzeButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // Analyzing
  analyzingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  analyzingText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  analyzingHint: { fontSize: 12, color: COLORS.textMuted },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error },

  // Sections
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },

  // Chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  chipTech: { backgroundColor: '#F0FDF4' },
  chipTextTech: { color: COLORS.success },

  // Info row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: { flex: 1, alignItems: 'center', gap: 4 },
  infoDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  infoLabel: { fontSize: 11, color: COLORS.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },

  // List rows (strengths/improvements)
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  listText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },

  // Action buttons
  actionRow: { gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
});
