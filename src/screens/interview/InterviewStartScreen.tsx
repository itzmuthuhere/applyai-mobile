import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { InterviewStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setHistory, setCurrentSession } from '../../store/slices/interviewSlice';
import { InterviewSession, Application } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type Nav = NativeStackNavigationProp<InterviewStackParamList, 'InterviewStart'>;

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  TECHNICAL: { bg: '#DBEAFE', text: '#1D4ED8' },
  BEHAVIORAL: { bg: '#D1FAE5', text: '#065F46' },
  SITUATIONAL: { bg: '#FEF3C7', text: '#92400E' },
  HR: { bg: '#EDE9FE', text: '#5B21B6' },
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <Text style={styles.scorePending}>In Progress</Text>;
  const color =
    score >= 8 ? COLORS.success : score >= 5 ? COLORS.warning : COLORS.error;
  return (
    <View style={[styles.scoreBadge, { borderColor: color }]}>
      <Text style={[styles.scoreText, { color }]}>{score.toFixed(1)}</Text>
      <Text style={[styles.scoreMax, { color }]}>/10</Text>
    </View>
  );
}

export default function InterviewStartScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const history = useSelector((s: RootState) => s.interview.history);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);

  async function loadHistory(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setHistoryLoading(true);
    try {
      const { data } = await apiClient.get<InterviewSession[]>(API_ENDPOINTS.INTERVIEW_HISTORY);
      dispatch(setHistory(data));
    } catch {
      // keep stale
    } finally {
      setHistoryLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function openPicker() {
    setPickerVisible(true);
    setAppsLoading(true);
    try {
      const { data } = await apiClient.get<{ content: Application[] }>(API_ENDPOINTS.APPLICATIONS);
      const list = Array.isArray(data) ? data : data.content ?? [];
      const eligible = list.filter(
        (a) => a.status !== 'WITHDRAWN' && a.status !== 'REJECTED'
      );
      setApplications(eligible);
    } catch {
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  }

  async function handleStartInterview(applicationId: number) {
    setStartingId(applicationId);
    try {
      const { data } = await apiClient.post<InterviewSession>(
        API_ENDPOINTS.INTERVIEW_START,
        { applicationId }
      );
      dispatch(setCurrentSession(data));
      setPickerVisible(false);
      navigation.navigate('InterviewQuestion', {
        sessionId: data.sessionId,
        questionIndex: 0,
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        'Could not start interview. Make sure your resume is analyzed.';
      alert(msg);
    } finally {
      setStartingId(null);
    }
  }

  function renderSession({ item }: { item: InterviewSession }) {
    const answered = item.questions.filter((q) => q.transcript != null).length;
    const total = item.questions.length;
    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() =>
          navigation.navigate('InterviewReport', { sessionId: item.sessionId })
        }
        activeOpacity={0.75}
      >
        <View style={styles.sessionCardTop}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionJob} numberOfLines={1}>
              {item.jobTitle}
            </Text>
            <Text style={styles.sessionCompany} numberOfLines={1}>
              {item.company}
            </Text>
            <Text style={styles.sessionDate}>
              {dayjs(item.createdAt).format('MMM D, YYYY')}
            </Text>
          </View>
          <ScoreBadge score={item.overallScore} />
        </View>
        <View style={styles.sessionProgress}>
          <View
            style={[
              styles.progressFill,
              { width: `${(answered / Math.max(total, 1)) * 100}%` as any },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {answered}/{total} questions answered
        </Text>
        <View style={styles.sessionFooter}>
          <Text style={styles.viewReport}>View Report</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.startBtn} onPress={openPicker} activeOpacity={0.85}>
        <Ionicons name="mic-outline" size={20} color="#fff" />
        <Text style={styles.startBtnText}>Start Mock Interview</Text>
      </TouchableOpacity>

      {historyLoading && history.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
      ) : history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No interviews yet</Text>
          <Text style={styles.emptySubtext}>
            Tap "Start Mock Interview" to practice with AI-generated questions for any of your job applications.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Past Sessions</Text>
          <FlatList
            data={history}
            keyExtractor={(s) => String(s.sessionId)}
            renderItem={renderSession}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadHistory(true)}
                tintColor={COLORS.primary}
              />
            }
          />
        </>
      )}

      {/* Application Picker Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose an Application</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtext}>
              AI will generate 7 tailored questions based on the job and your resume.
            </Text>

            {appsLoading ? (
              <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
            ) : applications.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptySubtext}>
                  No active applications found. Apply to a job first from the Jobs tab.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.appList}>
                {applications.map((app) => (
                  <TouchableOpacity
                    key={app.id}
                    style={[
                      styles.appItem,
                      startingId === app.id && styles.appItemLoading,
                    ]}
                    onPress={() => handleStartInterview(app.id)}
                    disabled={startingId != null}
                    activeOpacity={0.75}
                  >
                    <View style={styles.appItemInfo}>
                      <Text style={styles.appItemJob} numberOfLines={1}>
                        {app.job.title}
                      </Text>
                      <Text style={styles.appItemCompany} numberOfLines={1}>
                        {app.job.company} · {app.job.location}
                      </Text>
                    </View>
                    {startingId === app.id ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    margin: 16,
    borderRadius: 14,
    paddingVertical: 14,
  },
  startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  spinner: { marginTop: 40 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 8,
  },

  list: { paddingHorizontal: 16, paddingBottom: 32 },

  sessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: { flex: 1, marginRight: 12 },
  sessionJob: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sessionCompany: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  sessionDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreText: { fontSize: 18, fontWeight: '800' },
  scoreMax: { fontSize: 11, fontWeight: '600', marginLeft: 1 },
  scorePending: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },

  sessionProgress: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  progressLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 },

  sessionFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  viewReport: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  modalSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  appList: { paddingHorizontal: 16 },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  appItemLoading: { opacity: 0.5 },
  appItemInfo: { flex: 1 },
  appItemJob: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  appItemCompany: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
});
