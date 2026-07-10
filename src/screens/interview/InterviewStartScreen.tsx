import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, ScrollView, Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { InterviewStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setHistory, setCurrentSession } from '../../store/slices/interviewSlice';
import { InterviewSession, Application } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type Nav = NativeStackNavigationProp<InterviewStackParamList, 'InterviewStart'>;

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

const TYPE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  TECHNICAL:   { bg: '#DBEAFE', text: '#1D4ED8', label: 'Technical' },
  BEHAVIORAL:  { bg: '#D1FAE5', text: '#065F46', label: 'Behavioral' },
  SITUATIONAL: { bg: '#FEF3C7', text: '#92400E', label: 'Situational' },
  HR:          { bg: '#EDE9FE', text: '#5B21B6', label: 'HR Round' },
};

function scoreColor(score: number | null, colors: AppColors) {
  if (score == null) return colors.textMuted;
  if (score >= 8) return '#059669';
  if (score >= 5) return '#D97706';
  return '#EF4444';
}

function SkeletonSession() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={[styles.sessionCard, { opacity }]}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.border }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 13, width: '60%', backgroundColor: colors.border, borderRadius: 6 }} />
          <View style={{ height: 11, width: '40%', backgroundColor: colors.border, borderRadius: 6 }} />
        </View>
        <View style={{ width: 48, height: 34, borderRadius: 8, backgroundColor: colors.border }} />
      </View>
      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }} />
    </Animated.View>
  );
}

function SessionCard({ item, onPress }: { item: InterviewSession; onPress: () => void }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const answered = item.questions.filter(q => q.transcript != null).length;
  const total = item.questions.length;
  const progress = total > 0 ? answered / total : 0;
  const color = companyColor(item.company ?? 'A');
  const sc = scoreColor(item.overallScore, colors);

  return (
    <TouchableOpacity style={styles.sessionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.sessionTop}>
        <View style={[styles.sessionLogo, { backgroundColor: color + '18', borderColor: color + '30' }]}>
          <Text style={[styles.sessionLogoText, { color }]}>
            {(item.company ?? 'A').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.sessionMeta}>
          <Text style={styles.sessionJob} numberOfLines={1}>{item.jobTitle}</Text>
          <Text style={styles.sessionCompany} numberOfLines={1}>{item.company}</Text>
          <Text style={styles.sessionDate}>{dayjs(item.createdAt).format('MMM D, YYYY')}</Text>
        </View>
        <View style={styles.scoreWrap}>
          {item.overallScore != null ? (
            <>
              <Text style={[styles.scoreNum, { color: sc }]}>{item.overallScore.toFixed(1)}</Text>
              <Text style={[styles.scoreMax, { color: sc }]}>/10</Text>
            </>
          ) : (
            <Text style={styles.scorePending}>—</Text>
          )}
        </View>
      </View>

      <View style={styles.progressOuter}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>
      <View style={styles.sessionFooter}>
        <Text style={styles.progressLabel}>{answered}/{total} answered</Text>
        <View style={styles.viewRow}>
          <Text style={styles.viewReport}>View Report</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function InterviewStartScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const history = useSelector((s: RootState) => s.interview.history);

  const allApplications = useSelector((s: RootState) => s.application.list);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);

  async function loadHistory(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setHistoryLoading(true);
    try {
      const { data } = await apiClient.get<{ content: InterviewSession[] } | InterviewSession[]>(API_ENDPOINTS.INTERVIEW_HISTORY);
      const sessions = Array.isArray(data) ? data : (data.content ?? []);
      dispatch(setHistory(sessions));
    } catch {}
    finally {
      setHistoryLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { loadHistory(); }, []));

  async function openPicker() {
    // Pre-populate from Redux immediately so the user sees something right away
    const reduxFiltered = allApplications.filter(a => a.status !== 'WITHDRAWN');
    setApplications(reduxFiltered);
    setPickerVisible(true);
    setAppsLoading(reduxFiltered.length === 0); // only show spinner if Redux is empty
    try {
      const { data } = await apiClient.get<{ content: Application[] }>(
        `${API_ENDPOINTS.APPLICATIONS}?page=0&size=100`
      );
      const list = Array.isArray(data) ? data : (data.content ?? []);
      setApplications(list.filter(a => a.status !== 'WITHDRAWN'));
    } catch {
      // API failed — keep Redux data already shown, do not clear to empty
    } finally {
      setAppsLoading(false);
    }
  }

  async function handleStartInterview(applicationId: number) {
    setStartingId(applicationId);
    try {
      const { data } = await apiClient.post<InterviewSession>(
        API_ENDPOINTS.INTERVIEW_START, { applicationId }
      );
      dispatch(setCurrentSession(data));
      setPickerVisible(false);
      navigation.navigate('InterviewQuestion', { sessionId: data.sessionId, questionIndex: 0 });
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Could not start interview. Make sure your resume is analyzed.');
    } finally {
      setStartingId(null);
    }
  }

  // Stats
  const completedSessions = history.filter(s => s.overallScore != null);
  const avgScore = completedSessions.length > 0
    ? completedSessions.reduce((a, s) => a + (s.overallScore ?? 0), 0) / completedSessions.length
    : null;
  const bestScore = completedSessions.length > 0
    ? Math.max(...completedSessions.map(s => s.overallScore ?? 0))
    : null;

  const renderSession = useCallback(({ item }: { item: InterviewSession }) => (
    <SessionCard
      item={item}
      onPress={() => navigation.navigate('InterviewReport', { sessionId: item.sessionId })}
    />
  ), [navigation]);

  const keyExtractor = useCallback((s: InterviewSession) => String(s.sessionId), []);

  const ListHeader = (
    <>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="mic" size={28} color="#fff" />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>AI Mock Interviews</Text>
          <Text style={styles.heroSub}>7 tailored questions per role · instant AI feedback</Text>
        </View>
      </View>

      {/* Stats */}
      {history.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{history.length}</Text>
            <Text style={styles.statLbl}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, avgScore != null && { color: scoreColor(avgScore, colors) }]}>
              {avgScore != null ? avgScore.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLbl}>Avg Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, bestScore != null && { color: scoreColor(bestScore, colors) }]}>
              {bestScore != null ? bestScore.toFixed(1) : '—'}
            </Text>
            <Text style={styles.statLbl}>Best</Text>
          </View>
        </View>
      )}

      {/* Tips */}
      <View style={styles.tipsCard}>
        {[
          { icon: 'checkmark-circle', text: 'AI analyzes your answers for confidence & clarity' },
          { icon: 'star', text: 'Score improves with each practice session' },
          { icon: 'people', text: 'Questions adapt to your actual job + resume' },
        ].map((t, i) => (
          <View key={i} style={styles.tipRow}>
            <Ionicons name={t.icon as any} size={15} color={colors.primary} />
            <Text style={styles.tipText}>{t.text}</Text>
          </View>
        ))}
      </View>

      {/* Start button */}
      <TouchableOpacity style={styles.startBtn} onPress={openPicker} activeOpacity={0.85}>
        <Ionicons name="mic-circle" size={22} color="#fff" />
        <Text style={styles.startBtnText}>Start Mock Interview</Text>
        <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>

      {history.length > 0 && (
        <Text style={styles.sectionLabel}>PAST SESSIONS ({history.length})</Text>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {historyLoading && history.length === 0 ? (
        <>
          {ListHeader}
          <View style={styles.listPad}>
            {[1, 2].map(k => <SkeletonSession key={k} />)}
          </View>
        </>
      ) : (
        <FlatList
          data={history}
          keyExtractor={keyExtractor}
          renderItem={renderSession}
          contentContainerStyle={[styles.listPad, history.length === 0 && { flex: 1 }]}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} tintColor={colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptySubtext}>
                Tap "Start Mock Interview" above to practice with AI-generated questions for any of your job applications.
              </Text>
            </View>
          }
        />
      )}

      {/* Application Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose a Job Application</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>
              AI will generate 7 tailored questions based on the job description and your resume.
            </Text>
            {appsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40, marginBottom: 40 }} />
            ) : applications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={36} color={colors.textMuted} />
                <Text style={styles.emptySubtext}>No active applications found. Apply to a job first.</Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
                {applications.map(app => {
                  const c = companyColor(app.job.company ?? 'A');
                  return (
                    <TouchableOpacity
                      key={app.id}
                      style={[styles.appRow, startingId === app.id && { opacity: 0.5 }]}
                      onPress={() => handleStartInterview(app.id)}
                      disabled={startingId != null}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.appLogo, { backgroundColor: c + '18' }]}>
                        <Text style={[styles.appLogoText, { color: c }]}>
                          {(app.job.company ?? 'A').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.appInfo}>
                        <Text style={styles.appTitle} numberOfLines={1}>{app.job.title}</Text>
                        <Text style={styles.appCompany} numberOfLines={1}>{app.job.company} · {app.job.location}</Text>
                      </View>
                      {startingId === app.id
                        ? <ActivityIndicator size="small" color={colors.primary} />
                        : <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      }
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listPad: { padding: 14, paddingBottom: 40 },

  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.primary, borderRadius: 18,
    padding: 18, marginBottom: 12,
  },
  heroIcon: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 19, fontWeight: '900', color: '#fff', marginBottom: 3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 19 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    padding: 16, marginBottom: 12,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  statLbl: { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },

  tipsCard: {
    backgroundColor: colors.primaryLight, borderRadius: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
    padding: 14, gap: 8, marginBottom: 14,
  },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { flex: 1, fontSize: 13, color: colors.primary, fontWeight: '500', lineHeight: 18 },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, marginBottom: 20,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  startBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  sessionCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sessionLogo: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sessionLogoText: { fontSize: 18, fontWeight: '800' },
  sessionMeta: { flex: 1 },
  sessionJob: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  sessionCompany: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  sessionDate: { fontSize: 11, color: colors.textMuted },
  scoreWrap: { flexDirection: 'row', alignItems: 'baseline' },
  scoreNum: { fontSize: 20, fontWeight: '900' },
  scoreMax: { fontSize: 11, fontWeight: '600' },
  scorePending: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },

  progressOuter: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  sessionFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: colors.textSecondary },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewReport: { fontSize: 12, fontWeight: '700', color: colors.primary },

  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, marginTop: 20 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '78%', paddingBottom: 24,
  },
  handle: {
    width: 38, height: 4, backgroundColor: colors.border,
    borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  sheetSub: { fontSize: 13, color: colors.textSecondary, paddingHorizontal: 20, paddingVertical: 12 },

  appRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  appLogo: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  appLogoText: { fontSize: 18, fontWeight: '800' },
  appInfo: { flex: 1 },
  appTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  appCompany: { fontSize: 12, color: colors.textSecondary },
  });
}