import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { InterviewStackParamList } from '../../navigation/types';
import { InterviewSession, InterviewQuestion } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<InterviewStackParamList, 'InterviewReport'>;
type Nav = NativeStackNavigationProp<InterviewStackParamList, 'InterviewReport'>;

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
function companyColor(name: string) {
  return COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];
}

const TYPE_LABELS: Record<string, string> = {
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  SITUATIONAL: 'Situational',
  HR: 'HR',
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  TECHNICAL: { bg: '#DBEAFE', text: '#1D4ED8' },
  BEHAVIORAL: { bg: '#D1FAE5', text: '#065F46' },
  SITUATIONAL: { bg: '#FEF3C7', text: '#92400E' },
  HR: { bg: '#EDE9FE', text: '#5B21B6' },
};

function scoreColor(s: number | null) {
  if (s == null) return COLORS.textMuted;
  if (s >= 8) return COLORS.success;
  if (s >= 5) return COLORS.warning;
  return COLORS.error;
}

function scoreLabel(s: number) {
  if (s >= 9) return 'Outstanding';
  if (s >= 7.5) return 'Strong';
  if (s >= 6) return 'Good';
  if (s >= 4) return 'Average';
  return 'Needs Work';
}

function QuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const type = TYPE_COLORS[q.questionType] ?? { bg: COLORS.border, text: COLORS.textSecondary };
  const answered = q.transcript != null;
  const sc = scoreColor(q.aiScore ?? null);

  return (
    <View style={styles.qCard}>
      <TouchableOpacity
        style={styles.qHeader}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.8}
      >
        <View style={styles.qMeta}>
          <View style={styles.qIndexBox}>
            <Text style={styles.qIndex}>Q{index + 1}</Text>
          </View>
          <View style={[styles.qTypeBadge, { backgroundColor: type.bg }]}>
            <Text style={[styles.qTypeText, { color: type.text }]}>
              {TYPE_LABELS[q.questionType] ?? q.questionType}
            </Text>
          </View>
        </View>
        <View style={styles.qRight}>
          {answered ? (
            <Text style={[styles.qScore, { color: sc }]}>
              {q.aiScore != null ? `${q.aiScore}/10` : '—'}
            </Text>
          ) : (
            <View style={styles.skippedBadge}>
              <Text style={styles.skippedText}>Skipped</Text>
            </View>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.textMuted}
          />
        </View>
      </TouchableOpacity>

      <Text style={styles.qText}>{q.question}</Text>

      {expanded && (
        <View style={styles.qExpanded}>
          {answered ? (
            <>
              <Text style={styles.expandLabel}>Your Answer</Text>
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptText}>{q.transcript}</Text>
              </View>
              {q.aiFeedback && (
                <>
                  <Text style={styles.expandLabel}>AI Feedback</Text>
                  <View style={styles.feedbackBox}>
                    <View style={styles.feedbackIconBox}>
                      <Ionicons name="bulb" size={14} color={COLORS.warning} />
                    </View>
                    <Text style={styles.feedbackText}>{q.aiFeedback}</Text>
                  </View>
                </>
              )}
            </>
          ) : (
            <Text style={styles.skippedNote}>This question was not answered.</Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function InterviewReportScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadSession(); }, []);

  async function loadSession() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<InterviewSession>(
        API_ENDPOINTS.INTERVIEW_BY_ID(params.sessionId)
      );
      setSession(data);
    } catch {
      setError('Could not load interview report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading report…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.errorIconBox}>
            <Ionicons name="alert-circle-outline" size={36} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>Could not load report</Text>
          <Text style={styles.errorSub}>{error ?? 'Session not found.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadSession}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const answered = session.questions.filter(q => q.transcript != null).length;
  const total = session.questions.length;
  const isComplete = session.completedAt != null;
  const sc = session.overallScore;
  const color = companyColor(session.company ?? 'A');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: color }]}>
          <View style={styles.heroCompanyBox}>
            <Text style={styles.heroCompanyInitial}>
              {(session.company ?? 'C').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle} numberOfLines={2}>{session.jobTitle}</Text>
            <Text style={styles.heroCompany}>{session.company}</Text>
            <Text style={styles.heroDate}>
              {isComplete
                ? `Completed ${dayjs(session.completedAt).format('MMM D, YYYY')}`
                : `Started ${dayjs(session.createdAt).format('MMM D, YYYY')}`}
            </Text>
          </View>
          {!isComplete && (
            <View style={styles.inProgressBadge}>
              <Ionicons name="time-outline" size={12} color={COLORS.warning} />
              <Text style={styles.inProgressText}>In Progress</Text>
            </View>
          )}
        </View>

        {/* Score + Stats */}
        <View style={styles.scoreCard}>
          {/* Score ring */}
          <View style={styles.ringWrap}>
            <View style={[styles.ringOuter, { borderColor: (sc != null ? scoreColor(sc) : COLORS.border) + '40' }]}>
              <View style={[styles.ringInner, { borderColor: sc != null ? scoreColor(sc) : COLORS.border }]}>
                <Text style={[styles.ringScore, { color: sc != null ? scoreColor(sc) : COLORS.textMuted }]}>
                  {sc != null ? sc.toFixed(1) : '—'}
                </Text>
                {sc != null && <Text style={[styles.ringMax, { color: scoreColor(sc) }]}>/10</Text>}
              </View>
            </View>
            {sc != null && (
              <Text style={[styles.ringLabel, { color: scoreColor(sc) }]}>{scoreLabel(sc)}</Text>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRight}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.statNum}>{answered}</Text>
                <Text style={styles.statLabel}>Answered</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="list-outline" size={16} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.statNum}>{total}</Text>
                <Text style={styles.statLabel}>Total Q's</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, {
                backgroundColor: sc != null && sc >= 7 ? '#D1FAE5' : sc != null && sc >= 5 ? '#FEF3C7' : '#FEE2E2',
              }]}>
                <Ionicons
                  name={sc != null && sc >= 7 ? 'trophy-outline' : 'trending-up-outline'}
                  size={16}
                  color={sc != null ? scoreColor(sc) : COLORS.textMuted}
                />
              </View>
              <View>
                <Text style={[styles.statNum, sc != null && { color: scoreColor(sc) }]}>
                  {sc == null ? '—' : sc >= 7 ? 'Great' : sc >= 5 ? 'Good' : 'Practice'}
                </Text>
                <Text style={styles.statLabel}>Verdict</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Question Breakdown */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="help-circle-outline" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.sectionTitle}>Question Breakdown</Text>
          <Text style={styles.sectionCount}>{answered}/{total}</Text>
        </View>

        {session.questions
          .slice()
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
          .map((q, i) => (
            <QuestionCard key={q.id} q={q} index={i} />
          ))}

        {/* CTA */}
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('InterviewStart', undefined)}
        >
          <Ionicons name="mic-outline" size={18} color="#fff" />
          <Text style={styles.newBtnText}>Start New Interview</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  content: { gap: 14, paddingBottom: 40 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  errorIconBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  errorSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Hero
  hero: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20, flexWrap: 'wrap',
  },
  heroCompanyBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  heroCompanyInitial: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  heroInfo: { flex: 1 },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', marginBottom: 3 },
  heroCompany: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  heroDate: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  inProgressBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  inProgressText: { fontSize: 11, fontWeight: '600', color: COLORS.warning },

  // Score card
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', gap: 20,
    backgroundColor: COLORS.surface, marginHorizontal: 16,
    borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  ringWrap: { alignItems: 'center', gap: 6 },
  ringOuter: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  ringInner: {
    width: 74, height: 74, borderRadius: 37,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  ringScore: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  ringMax: { fontSize: 11, fontWeight: '600' },
  ringLabel: { fontSize: 12, fontWeight: '700' },
  statsRight: { flex: 1, gap: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted },

  // Section head
  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16,
  },
  sectionIconBox: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  sectionCount: {
    fontSize: 12, fontWeight: '700', color: COLORS.primary,
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },

  // Question card
  qCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginHorizontal: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  qHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  qMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qIndexBox: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  qIndex: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  qTypeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  qTypeText: { fontSize: 11, fontWeight: '700' },
  qRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qScore: { fontSize: 14, fontWeight: '800' },
  skippedBadge: { backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  skippedText: { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },
  qText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },

  qExpanded: { marginTop: 12, gap: 8 },
  expandLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  transcriptBox: {
    backgroundColor: COLORS.background, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  transcriptText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  feedbackBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  feedbackIconBox: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  feedbackText: { flex: 1, fontSize: 13, color: '#78350F', lineHeight: 20 },
  skippedNote: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

  // New interview CTA
  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, marginHorizontal: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  newBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
