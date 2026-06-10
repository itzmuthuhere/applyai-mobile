import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView, TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchInterviewPrepPlan } from '../../store/intelligenceSlice';
import { COLORS } from '../../constants';

export default function InterviewPrepPlanScreen() {
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const { applicationId } = route.params as { applicationId: number };
  const { interviewPrepResult, loading, error } = useSelector((s: RootState) => s.intelligence);
  const [interviewDate, setInterviewDate] = useState('');

  useEffect(() => {
    dispatch(fetchInterviewPrepPlan({ applicationId, interviewDate: interviewDate || undefined }));
  }, [dispatch, applicationId]);

  const plan = interviewPrepResult;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Generating your prep plan…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => dispatch(fetchInterviewPrepPlan({ applicationId }))} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!plan) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{plan.targetRole}</Text>
        <Text style={styles.company}>@ {plan.company} · {plan.totalDays} days</Text>

        {plan.companyInsights && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>{plan.companyInsights}</Text>
          </View>
        )}

        {plan.keySkillsToRevise?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skills to Focus On</Text>
            <View style={styles.chips}>
              {plan.keySkillsToRevise.map((s: string, i: number) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionHeader}>Day-by-Day Plan</Text>
        {plan.days?.map((d: any) => (
          <View key={d.day} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View style={styles.dayBadge}><Text style={styles.dayNum}>Day {d.day}</Text></View>
              <Text style={styles.dayFocus}>{d.focus}</Text>
              <Text style={styles.dayHours}>{d.estimatedHours}h</Text>
            </View>
            {d.topics?.map((t: string, i: number) => (
              <Text key={i} style={styles.topic}>• {t}</Text>
            ))}
            {d.practiceQuestions?.length > 0 && (
              <View style={styles.questionsBox}>
                <Text style={styles.qLabel}>Practice</Text>
                {d.practiceQuestions.map((q: string, i: number) => (
                  <Text key={i} style={styles.question}>Q: {q}</Text>
                ))}
              </View>
            )}
          </View>
        ))}

        {plan.systemDesignTopics?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>System Design Topics</Text>
            {plan.systemDesignTopics.map((t: string, i: number) => (
              <Text key={i} style={styles.listItem}>• {t}</Text>
            ))}
          </View>
        )}

        {plan.behavioralQuestions?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Behavioral Questions</Text>
            {plan.behavioralQuestions.map((q: string, i: number) => (
              <Text key={i} style={styles.listItem}>• {q}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 16 },
  scroll: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  company: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16, marginTop: 2 },
  infoCard: {
    backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 12,
    marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  infoText: { fontSize: 13, color: COLORS.primary, lineHeight: 20 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: COLORS.primaryLight, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10, marginTop: 4 },
  dayCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dayBadge: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 },
  dayNum: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dayFocus: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  dayHours: { fontSize: 12, color: COLORS.textSecondary },
  topic: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  questionsBox: { marginTop: 8, backgroundColor: COLORS.background, borderRadius: 8, padding: 10 },
  qLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  question: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 4 },
  listItem: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14 },
  errorText: { color: COLORS.error, fontSize: 15, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
