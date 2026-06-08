import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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

function ScoreRing({ score }: { score: number | null }) {
  const display = score != null ? score.toFixed(1) : '—';
  const color =
    score == null
      ? COLORS.textMuted
      : score >= 8
      ? COLORS.success
      : score >= 5
      ? COLORS.warning
      : COLORS.error;

  return (
    <View style={[styles.ring, { borderColor: color }]}>
      <Text style={[styles.ringScore, { color }]}>{display}</Text>
      {score != null && <Text style={[styles.ringMax, { color }]}>/10</Text>}
      <Text style={styles.ringLabel}>Overall</Text>
    </View>
  );
}

function QuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const type = TYPE_COLORS[q.questionType] ?? { bg: COLORS.border, text: COLORS.textSecondary };
  const answered = q.transcript != null;

  const scoreColor =
    q.aiScore == null
      ? COLORS.textMuted
      : q.aiScore >= 8
      ? COLORS.success
      : q.aiScore >= 5
      ? COLORS.warning
      : COLORS.error;

  return (
    <View style={styles.qCard}>
      <TouchableOpacity
        style={styles.qHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}
      >
        <View style={styles.qMeta}>
          <Text style={styles.qIndex}>Q{index + 1}</Text>
          <View style={[styles.qTypeBadge, { backgroundColor: type.bg }]}>
            <Text style={[styles.qTypeText, { color: type.text }]}>
              {TYPE_LABELS[q.questionType] ?? q.questionType}
            </Text>
          </View>
        </View>
        <View style={styles.qRight}>
          {answered ? (
            <Text style={[styles.qScore, { color: scoreColor }]}>
              {q.aiScore != null ? `${q.aiScore}/10` : '—'}
            </Text>
          ) : (
            <Text style={styles.qSkipped}>Skipped</Text>
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
                    <Ionicons
                      name="bulb-outline"
                      size={14}
                      color={COLORS.warning}
                      style={styles.feedbackIcon}
                    />
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

  useEffect(() => {
    loadSession();
  }, []);

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading report…</Text>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={COLORS.error} />
        <Text style={styles.errorText}>{error ?? 'Session not found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadSession}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const answered = session.questions.filter((q) => q.transcript != null).length;
  const total = session.questions.length;
  const isComplete = session.completedAt != null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.jobTitle} numberOfLines={2}>
          {session.jobTitle}
        </Text>
        <Text style={styles.company}>{session.company}</Text>
        <Text style={styles.date}>
          {isComplete
            ? `Completed ${dayjs(session.completedAt).format('MMM D, YYYY [at] h:mm A')}`
            : `Started ${dayjs(session.createdAt).format('MMM D, YYYY')}`}
        </Text>

        {!isComplete && (
          <View style={styles.inProgressBadge}>
            <Ionicons name="time-outline" size={13} color={COLORS.warning} />
            <Text style={styles.inProgressText}>In Progress</Text>
          </View>
        )}
      </View>

      {/* Score + Summary */}
      <View style={styles.summaryRow}>
        <ScoreRing score={session.overallScore} />

        <View style={styles.summaryStats}>
          <View style={styles.statRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
            <Text style={styles.statLabel}>{answered} answered</Text>
          </View>
          <View style={styles.statRow}>
            <Ionicons name="list-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.statLabel}>{total} total questions</Text>
          </View>
          {session.overallScore != null && (
            <View style={styles.statRow}>
              <Ionicons
                name={
                  session.overallScore >= 7
                    ? 'trophy-outline'
                    : session.overallScore >= 5
                    ? 'thumbs-up-outline'
                    : 'trending-up-outline'
                }
                size={16}
                color={
                  session.overallScore >= 7
                    ? COLORS.success
                    : session.overallScore >= 5
                    ? COLORS.warning
                    : COLORS.error
                }
              />
              <Text
                style={[
                  styles.statLabel,
                  {
                    color:
                      session.overallScore >= 7
                        ? COLORS.success
                        : session.overallScore >= 5
                        ? COLORS.warning
                        : COLORS.error,
                  },
                ]}
              >
                {session.overallScore >= 7
                  ? 'Strong performance'
                  : session.overallScore >= 5
                  ? 'Good — room to grow'
                  : 'Keep practicing'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Questions */}
      <Text style={styles.sectionTitle}>Question Breakdown</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 12 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center', marginTop: 12 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  company: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  date: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#FFFBEB',
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inProgressText: { fontSize: 12, fontWeight: '600', color: COLORS.warning },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 20,
  },
  ring: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  ringMax: { fontSize: 11, fontWeight: '600' },
  ringLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },

  summaryStats: { flex: 1, gap: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  qCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qIndex: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  qTypeBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  qTypeText: { fontSize: 11, fontWeight: '600' },
  qRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qScore: { fontSize: 13, fontWeight: '700' },
  qSkipped: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  qText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },

  qExpanded: { marginTop: 12, gap: 8 },
  expandLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  transcriptBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transcriptText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },

  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  feedbackIcon: { marginTop: 1 },
  feedbackText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  skippedNote: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
  },
  newBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
