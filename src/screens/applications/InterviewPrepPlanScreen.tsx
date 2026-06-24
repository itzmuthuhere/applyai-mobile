import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { fetchInterviewPrepPlan } from '../../store/intelligenceSlice';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

const HOUR_COLORS = ['#D1FAE5', '#DBEAFE', '#EDE9FE', '#FEF3C7', '#FEE2E2'];
const hourColor = (i: number) => HOUR_COLORS[i % HOUR_COLORS.length];
const hourTextColor = ['#065F46', '#1D4ED8', '#5B21B6', '#92400E', '#991B1B'];
const hourText = (i: number) => hourTextColor[i % hourTextColor.length];

function SectionHead({ icon, title, color = '#2563EB' }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; color?: string }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.sectionHead}>
      <View style={[styles.sectionIconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function InterviewPrepPlanScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { applicationId } = route.params as { applicationId: number };
  const { interviewPrepResult: plan, loading, error } = useSelector((s: RootState) => s.intelligence);

  useEffect(() => {
    dispatch(fetchInterviewPrepPlan({ applicationId }));
  }, [dispatch, applicationId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Crafting your personalised prep plan…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={52} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => dispatch(fetchInterviewPrepPlan({ applicationId }))}
        >
          <Ionicons name="refresh-outline" size={16} color="#fff" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!plan) return null;

  const color = companyColor(plan.company ?? 'A');
  const totalHours = plan.days?.reduce((sum: number, d: any) => sum + (d.estimatedHours ?? 0), 0) ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Hero header */}
        <View style={styles.heroCard}>
          <View style={[styles.companyBadge, { backgroundColor: color + '18', borderColor: color + '30' }]}>
            <Text style={[styles.companyInitial, { color }]}>{(plan.company ?? 'C')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroRole} numberOfLines={2}>{plan.targetRole}</Text>
            <Text style={styles.heroCompany}>@ {plan.company}</Text>
          </View>
          <View style={styles.heroStats}>
            <Text style={styles.heroStatNum}>{plan.totalDays}</Text>
            <Text style={styles.heroStatLabel}>Days</Text>
          </View>
          <View style={[styles.heroStatsDivider]} />
          <View style={styles.heroStats}>
            <Text style={styles.heroStatNum}>{totalHours}</Text>
            <Text style={styles.heroStatLabel}>Hours</Text>
          </View>
        </View>

        {/* Company insights */}
        {plan.companyInsights ? (
          <View style={styles.insightCard}>
            <View style={styles.insightLeft}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
            </View>
            <Text style={styles.insightText}>{plan.companyInsights}</Text>
          </View>
        ) : null}

        {/* Skills to focus */}
        {plan.keySkillsToRevise?.length > 0 && (
          <View style={styles.card}>
            <SectionHead icon="code-slash-outline" title="Skills to Focus On" color={colors.primary} />
            <View style={styles.chipsWrap}>
              {plan.keySkillsToRevise.map((s: string, i: number) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Day-by-day */}
        {plan.days?.length > 0 && (
          <View style={styles.card}>
            <SectionHead icon="calendar-outline" title="Day-by-Day Plan" color='#7C3AED' />
            <View style={styles.timelineWrap}>
              {plan.days.map((d: any, i: number) => (
                <View key={d.day} style={styles.timelineRow}>
                  {/* Left: day number + line */}
                  <View style={styles.timelineLeft}>
                    <View style={[styles.dayCircle, { backgroundColor: color }]}>
                      <Text style={styles.dayCircleText}>{d.day}</Text>
                    </View>
                    {i < plan.days.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  {/* Right: content */}
                  <View style={styles.timelineContent}>
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayFocus}>{d.focus}</Text>
                      {d.estimatedHours ? (
                        <View style={[styles.hourBadge, { backgroundColor: hourColor(i) }]}>
                          <Text style={[styles.hourBadgeText, { color: hourText(i) }]}>{d.estimatedHours}h</Text>
                        </View>
                      ) : null}
                    </View>

                    {d.topics?.length > 0 && (
                      <View style={styles.topicsList}>
                        {d.topics.map((t: string, j: number) => (
                          <View key={j} style={styles.topicRow}>
                            <View style={[styles.topicDot, { backgroundColor: color }]} />
                            <Text style={styles.topicText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {d.practiceQuestions?.length > 0 && (
                      <View style={styles.practiceBox}>
                        <View style={styles.practiceHeader}>
                          <Ionicons name="help-circle-outline" size={13} color='#7C3AED' />
                          <Text style={styles.practiceLabel}>Practice Questions</Text>
                        </View>
                        {d.practiceQuestions.map((q: string, j: number) => (
                          <Text key={j} style={styles.practiceQ}>Q{j + 1}: {q}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* System Design */}
        {plan.systemDesignTopics?.length > 0 && (
          <View style={styles.card}>
            <SectionHead icon="git-network-outline" title="System Design Topics" color='#059669' />
            {plan.systemDesignTopics.map((t: string, i: number) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: '#059669' }]} />
                <Text style={styles.bulletText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Behavioral */}
        {plan.behavioralQuestions?.length > 0 && (
          <View style={styles.card}>
            <SectionHead icon="mic-outline" title="Behavioral Questions" color='#D97706' />
            {plan.behavioralQuestions.map((q: string, i: number) => (
              <View key={i} style={styles.bqRow}>
                <Text style={styles.bqNum}>Q{i + 1}</Text>
                <Text style={styles.bqText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 14, gap: 12 },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32,
    backgroundColor: colors.background,
  },
  loadingText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  heroCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  companyBadge: {
    width: 52, height: 52, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  companyInitial: { fontSize: 22, fontWeight: '900' },
  heroRole: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  heroCompany: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  heroStats: { alignItems: 'center', gap: 2 },
  heroStatsDivider: { width: 1, height: 28, backgroundColor: colors.border },
  heroStatNum: { fontSize: 20, fontWeight: '900', color: colors.primary },
  heroStatLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },

  insightCard: {
    backgroundColor: colors.primaryLight, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  insightLeft: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  insightText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 20 },

  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIconBox: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#BFDBFE',
  },
  skillChipText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  timelineWrap: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 32 },
  dayCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  dayCircleText: { fontSize: 13, fontWeight: '900', color: '#fff' },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: 16, gap: 8 },

  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  dayFocus: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  hourBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  hourBadgeText: { fontSize: 11, fontWeight: '700' },

  topicsList: { gap: 5 },
  topicRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  topicDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 7, flexShrink: 0 },
  topicText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  practiceBox: {
    backgroundColor: colors.background, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#EDE9FE', gap: 6,
  },
  practiceHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  practiceLabel: { fontSize: 11, fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.4 },
  practiceQ: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  bqRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  bqNum: {
    width: 24, height: 24, borderRadius: 6, backgroundColor: '#FEF3C7',
    textAlign: 'center', lineHeight: 24, fontSize: 11, fontWeight: '800', color: '#92400E', flexShrink: 0,
  },
  bqText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20, paddingTop: 2 },
  });
}