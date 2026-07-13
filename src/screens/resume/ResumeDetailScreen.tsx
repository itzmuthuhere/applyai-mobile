import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { API_ENDPOINTS, ROUTES } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { ResumeStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setSelectedResume, updateResumeScore, updateResumeParsed } from '../../store/slices/resumeSlice';
import { ParsedResume, ResumeScore } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import { decodeFileName } from '../../utils/decodeFileName';
import WebPageContainer from '../../components/common/WebPageContainer';

type RouteProps = RouteProp<ResumeStackParamList, 'ResumeDetail'>;
type Nav = NativeStackNavigationProp<ResumeStackParamList, 'ResumeDetail'>;

function SkeletonPulse({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View
      style={{ width: width as any, height, borderRadius, backgroundColor: colors.border, opacity }}
    />
  );
}

export default function ResumeDetailScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
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
      const [parseSettled, scoreSettled] = await Promise.allSettled([
        apiClient.post<ParsedResume>(API_ENDPOINTS.RESUME_PARSE, { resumeId: resume.id }),
        apiClient.post<ResumeScore>(API_ENDPOINTS.RESUME_SCORE, { resumeId: resume.id }),
      ]);

      if (parseSettled.status === 'fulfilled') {
        setParseResult(parseSettled.value.data);
        dispatch(updateResumeParsed({ resumeId: resume.id }));
      }

      if (scoreSettled.status === 'fulfilled') {
        setScoreResult(scoreSettled.value.data);
        dispatch(updateResumeScore({ resumeId: resume.id, score: scoreSettled.value.data.score }));
        dispatch(updateResumeParsed({ resumeId: resume.id }));
      }

      if (parseSettled.status === 'rejected' && scoreSettled.status === 'rejected') {
        setAnalyzeError('Analysis failed. Please try again.');
      }
    } catch {
      setAnalyzeError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [resume, dispatch]);

  const scoreColor = (score: number) => {
    if (score >= 75) return colors.success;
    if (score >= 50) return colors.warning;
    return colors.error;
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="document-outline" size={48} color={colors.border} />
          <Text style={styles.notFound}>Resume not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayScore = scoreResult?.score ?? resume.aiScore;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <WebPageContainer maxWidth={720}>
        {/* Hero Banner */}
        <View style={styles.hero}>
          <View style={styles.heroInner}>
            <View style={styles.fileIconBox}>
              <Ionicons name="document-text" size={30} color={colors.primary} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={2}>{decodeFileName(resume.versionName)}</Text>
              <Text style={styles.heroDate}>Uploaded {dayjs(resume.createdAt).format('MMM D, YYYY')}</Text>
              <View style={styles.heroBadgeRow}>
                {resume.isOriginal && (
                  <View style={styles.originalBadge}>
                    <Ionicons name="star" size={10} color={colors.primary} />
                    <Text style={styles.originalText}>Original</Text>
                  </View>
                )}
                {resume.isParsed && (
                  <View style={styles.parsedBadge}>
                    <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                    <Text style={styles.parsedText}>Analyzed</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewFileBtn}
              onPress={() => Linking.openURL(resume.fileUrl)}
            >
              <Ionicons name="open-outline" size={18} color={colors.primary} />
              <Text style={styles.viewFileBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Score Card */}
        {displayScore !== null && !isAnalyzing && (
          <View style={[styles.scoreCard, { backgroundColor: scoreBg(displayScore) }]}>
            <View style={styles.scoreRingOuter}>
              <View style={[styles.scoreRingInner, { borderColor: scoreColor(displayScore) + '40' }]}>
                <View style={[styles.scoreCircle, { borderColor: scoreColor(displayScore) }]}>
                  <Text style={[styles.scoreNumber, { color: scoreColor(displayScore) }]}>
                    {displayScore}
                  </Text>
                  <Text style={[styles.scoreOutOf, { color: scoreColor(displayScore) }]}>/100</Text>
                </View>
              </View>
            </View>
            <View style={styles.scoreRight}>
              <Text style={[styles.scoreGrade, { color: scoreColor(displayScore) }]}>
                {scoreLabel(displayScore)}
              </Text>
              <Text style={styles.scoreDesc}>AI Resume Score</Text>
              <View style={styles.scoreBarBg}>
                <View
                  style={[
                    styles.scoreBarFill,
                    { width: `${displayScore}%` as any, backgroundColor: scoreColor(displayScore) },
                  ]}
                />
              </View>
              <TouchableOpacity style={styles.reanalyzeBtn} onPress={() => runAnalysis()} disabled={isAnalyzing}>
                <Ionicons name="refresh" size={13} color={colors.primary} />
                <Text style={styles.reanalyzeText}>Re-analyze</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Analyze CTA */}
        {displayScore === null && !isAnalyzing && (
          <View style={styles.analyzeCard}>
            <View style={styles.analyzeIconBox}>
              <Ionicons name="sparkles" size={28} color={colors.primary} />
            </View>
            <Text style={styles.analyzeTitle}>Get Your AI Resume Score</Text>
            <Text style={styles.analyzeSubtitle}>
              Discover your score, skills breakdown, ATS readiness, and personalized improvement tips.
            </Text>
            <View style={styles.analyzeFeatureRow}>
              {['ATS Score', 'Skill Match', 'Tips'].map((f, i) => (
                <View key={i} style={styles.analyzeFeature}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.analyzeFeatureText}>{f}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.analyzeButton} onPress={() => runAnalysis()}>
              <Ionicons name="sparkles" size={18} color="#FFF" />
              <Text style={styles.analyzeButtonText}>Analyze Resume</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analyzing state */}
        {isAnalyzing && (
          <View style={styles.analyzingCard}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.analyzingTitle}>Analyzing with AI...</Text>
            <Text style={styles.analyzingHint}>Parsing skills, scoring, generating tips — 10–15 sec</Text>
            <View style={styles.analyzingSteps}>
              {['Reading resume content', 'Scoring ATS compatibility', 'Generating improvement tips'].map((step, i) => (
                <View key={i} style={styles.analyzingStep}>
                  <View style={styles.analyzingStepDot} />
                  <Text style={styles.analyzingStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Error */}
        {analyzeError && !isAnalyzing && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{analyzeError}</Text>
            <TouchableOpacity onPress={() => runAnalysis()} style={styles.retryLink}>
              <Text style={styles.retryLinkText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Skills + Tech Stack */}
        {parseResult && !isAnalyzing && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="code-slash-outline" size={16} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>Skills Detected</Text>
                <Text style={styles.sectionCount}>{parseResult.skills.length}</Text>
              </View>
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
                <View style={styles.sectionHead}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="layers-outline" size={16} color={colors.success} />
                  </View>
                  <Text style={styles.sectionTitle}>Tech Stack</Text>
                  <Text style={styles.sectionCount}>{parseResult.techStack.length}</Text>
                </View>
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
              <View style={styles.sectionHead}>
                <View style={[styles.sectionIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="person-outline" size={16} color={colors.warning} />
                </View>
                <Text style={styles.sectionTitle}>Profile Summary</Text>
              </View>
              <View style={styles.profileSummaryRow}>
                <View style={styles.profileStat}>
                  <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                  <Text style={styles.profileStatValue}>{parseResult.experienceYears} yrs</Text>
                  <Text style={styles.profileStatLabel}>Experience</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStat}>
                  <Ionicons name="school-outline" size={20} color={colors.primary} />
                  <Text style={styles.profileStatValue} numberOfLines={1}>{parseResult.education}</Text>
                  <Text style={styles.profileStatLabel}>Education</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Strengths + Improvements */}
        {scoreResult && !isAnalyzing && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionIconBox, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="thumbs-up-outline" size={16} color={colors.success} />
                </View>
                <Text style={styles.sectionTitle}>Strengths</Text>
              </View>
              {scoreResult.strengths.map((s, i) => (
                <View key={i} style={styles.listRow}>
                  <View style={styles.listIconBox}>
                    <Ionicons name="checkmark" size={14} color={colors.success} />
                  </View>
                  <Text style={styles.listText}>{s}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="trending-up-outline" size={16} color={colors.warning} />
                </View>
                <Text style={styles.sectionTitle}>Improvements</Text>
              </View>
              {scoreResult.improvements.map((imp, i) => (
                <View key={i} style={styles.listRow}>
                  <View style={[styles.listIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="arrow-up" size={14} color={colors.warning} />
                  </View>
                  <Text style={styles.listText}>{imp}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Skeleton placeholders while analyzing */}
        {isAnalyzing && (
          <View style={styles.section}>
            <View style={{ gap: 10 }}>
              <SkeletonPulse width="60%" height={14} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {[80, 60, 90, 70, 55].map((w, i) => (
                  <SkeletonPulse key={i} width={w} height={28} borderRadius={14} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionSection}>
          <Text style={styles.actionSectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            testID="tailor-for-job-btn"
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => {
              if (!resume.isParsed) {
                Alert.alert('Analyze First', 'Please analyze this resume before tailoring it.');
                return;
              }
              // Tailoring needs a specific job's description to tailor against, which this
              // screen doesn't have — jump to the Jobs tab so the user can pick one, rather
              // than showing an alert that just describes the steps without doing them.
              (navigation as any).navigate('JobsTab', { screen: 'JobFeed' });
            }}
          >
            <View style={styles.actionBtnIcon}>
              <Ionicons name="color-wand-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.actionBtnContent}>
              <Text style={styles.actionBtnLabel}>Tailor for a Job</Text>
              <Text style={styles.actionBtnSub}>Boost your ATS match score</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Linking.openURL(resume.fileUrl)}
          >
            <View style={[styles.actionBtnIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="download-outline" size={18} color={colors.success} />
            </View>
            <View style={styles.actionBtnContent}>
              <Text style={styles.actionBtnLabel}>Download PDF</Text>
              <Text style={styles.actionBtnSub}>Open original resume file</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
        </WebPageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { gap: 14, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound: { fontSize: 16, color: colors.textSecondary },

  // Hero
  hero: { backgroundColor: colors.primary, paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  fileIconBox: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 17, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  heroBadgeRow: { flexDirection: 'row', gap: 6 },
  originalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  originalText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  parsedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  parsedText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  viewFileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  viewFileBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Score Card
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    borderRadius: 18, padding: 20, gap: 16,
  },
  scoreRingOuter: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  scoreRingInner: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
  },
  scoreCircle: {
    width: 74, height: 74, borderRadius: 37,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  scoreNumber: { fontSize: 24, fontWeight: '900', lineHeight: 28 },
  scoreOutOf: { fontSize: 11, fontWeight: '600' },
  scoreRight: { flex: 1, gap: 4 },
  scoreGrade: { fontSize: 22, fontWeight: '800' },
  scoreDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  scoreBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3 },
  scoreBarFill: { height: 6, borderRadius: 3 },
  reanalyzeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  reanalyzeText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Analyze CTA
  analyzeCard: {
    backgroundColor: colors.surface, borderRadius: 18, padding: 24, marginHorizontal: 16,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  analyzeIconBox: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  analyzeTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  analyzeSubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  analyzeFeatureRow: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  analyzeFeature: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  analyzeFeatureText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  analyzeButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 14,
    paddingHorizontal: 32, paddingVertical: 13,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  analyzeButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  // Analyzing
  analyzingCard: {
    backgroundColor: colors.surface, borderRadius: 18, padding: 28, marginHorizontal: 16,
    alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border,
  },
  analyzingTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  analyzingHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  analyzingSteps: { width: '100%', gap: 8, marginTop: 4 },
  analyzingStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  analyzingStepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  analyzingStepText: { fontSize: 13, color: colors.textSecondary },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginHorizontal: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: colors.error },
  retryLink: { paddingHorizontal: 8, paddingVertical: 4 },
  retryLinkText: { fontSize: 13, fontWeight: '700', color: colors.error },

  // Sections
  section: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginHorizontal: 16,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconBox: {
    width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sectionCount: {
    fontSize: 12, fontWeight: '700', color: colors.primary,
    backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },

  // Chips
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  chipTech: { backgroundColor: '#D1FAE5' },
  chipTextTech: { color: colors.success },

  // Profile summary
  profileSummaryRow: { flexDirection: 'row', alignItems: 'center' },
  profileStat: { flex: 1, alignItems: 'center', gap: 4 },
  profileStatDivider: { width: 1, height: 44, backgroundColor: colors.border },
  profileStatValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  profileStatLabel: { fontSize: 11, color: colors.textMuted },

  // List rows
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  listIconBox: {
    width: 22, height: 22, borderRadius: 6, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  listText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 21 },

  // Actions
  actionSection: { marginHorizontal: 16, gap: 10 },
  actionSectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  actionBtnPrimary: { borderColor: colors.primary + '40' },
  actionBtnIcon: {
    width: 40, height: 40, borderRadius: 11,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnContent: { flex: 1 },
  actionBtnLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  actionBtnSub: { fontSize: 12, color: colors.textMuted },
  });
}