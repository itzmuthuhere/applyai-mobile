import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { HomeStackParamList } from '../../navigation/types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<HomeStackParamList, 'CareerPath'>;

interface NextRole {
  title: string;
  timeline: string;
  salaryRange: string;
  skillsNeeded: string[];
  difficulty: string;
}

interface CareerPathResult {
  currentLevel: string;
  currentSalaryRange: string;
  nextRoles: NextRole[];
  skillsToLearnNow: string[];
  companiesHiring: string[];
  advice: string;
}

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

function difficultyConfig(d: string): { label: string; bg: string; text: string } {
  const l = (d ?? '').toLowerCase();
  if (l.includes('easy') || l.includes('low'))
    return { label: d, bg: '#D1FAE5', text: '#065F46' };
  if (l.includes('hard') || l.includes('high'))
    return { label: d, bg: '#FEE2E2', text: '#991B1B' };
  return { label: d, bg: '#FEF9C3', text: '#92400E' };
}

function SkillChip({ skill, primary }: { skill: string; primary?: boolean }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={[styles.chip, primary && styles.chipPrimary]}>
      <Text style={[styles.chipText, primary && styles.chipTextPrimary]}>{skill}</Text>
    </View>
  );
}

export default function CareerPathScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { params } = useRoute<RouteProps>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CareerPathResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      let resumeId = params?.resumeId;
      if (!resumeId) {
        const { data: resumes } = await apiClient.get<any[]>(API_ENDPOINTS.RESUMES);
        const best = resumes.find((r: any) => r.isParsed && r.isOriginal) ?? resumes[0];
        if (!best) {
          setError('Please upload and parse a resume first to generate your career path.');
          setLoading(false);
          return;
        }
        resumeId = best.id;
      }
      const { data } = await apiClient.post<CareerPathResult>(API_ENDPOINTS.CAREER_PATH, { resumeId });
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to generate career path.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Analysing your career trajectory...</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={52} color={colors.error} />
        <Text style={styles.errorText}>{error ?? 'No result.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Ionicons name="refresh-outline" size={16} color="#fff" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Current level hero */}
        <View style={styles.currentCard}>
          <View style={styles.currentLeft}>
            <View style={styles.youAreHereDot}>
              <Ionicons name="location" size={14} color={colors.primary} />
            </View>
            <Text style={styles.currentLabel}>You are here</Text>
            <Text style={styles.currentLevel}>{result.currentLevel}</Text>
            {result.currentSalaryRange ? (
              <View style={styles.currentSalaryRow}>
                <Ionicons name="cash-outline" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.currentSalary}>{result.currentSalaryRange}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.currentRightDecor}>
            <Ionicons name="trending-up" size={56} color="rgba(255,255,255,0.12)" />
          </View>
        </View>

        {/* Next roles - roadmap */}
        {result.nextRoles.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="map-outline" size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>Your Career Roadmap</Text>
            </View>
            {result.nextRoles.map((role, i) => {
              const diff = difficultyConfig(role.difficulty);
              return (
                <View key={i} style={styles.roadmapStep}>
                  {/* Step connector */}
                  <View style={styles.stepLeft}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    {i < result.nextRoles.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  {/* Step content */}
                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepTitle}>{role.title}</Text>
                      {role.difficulty ? (
                        <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
                          <Text style={[styles.diffText, { color: diff.text }]}>{diff.label}</Text>
                        </View>
                      ) : null}
                    </View>
                    {(role.timeline || role.salaryRange) ? (
                      <View style={styles.stepMeta}>
                        {role.timeline ? (
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                            <Text style={styles.metaText}>{role.timeline}</Text>
                          </View>
                        ) : null}
                        {role.salaryRange ? (
                          <View style={styles.metaItem}>
                            <Ionicons name="cash-outline" size={11} color={colors.textMuted} />
                            <Text style={styles.metaText}>{role.salaryRange}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                    {role.skillsNeeded.length > 0 && (
                      <View style={styles.chipsRow}>
                        {role.skillsNeeded.map((s, j) => (
                          <SkillChip key={j} skill={s} />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Skills to learn */}
        {result.skillsToLearnNow.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="school-outline" size={16} color='#7C3AED' />
              <Text style={styles.cardTitle}>Learn These Now</Text>
            </View>
            <View style={styles.chipsRow}>
              {result.skillsToLearnNow.map((s, i) => (
                <SkillChip key={i} skill={s} primary />
              ))}
            </View>
          </View>
        )}

        {/* Companies hiring */}
        {result.companiesHiring.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="business-outline" size={16} color='#059669' />
              <Text style={styles.cardTitle}>Companies Actively Hiring</Text>
            </View>
            <View style={styles.companiesGrid}>
              {result.companiesHiring.map((c, i) => {
                const color = companyColor(c);
                return (
                  <View key={i} style={[styles.companyCard, { borderLeftColor: color }]}>
                    <View style={[styles.companyDot, { backgroundColor: color }]}>
                      <Text style={styles.companyInitial}>{c[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.companyName} numberOfLines={1}>{c}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Advice */}
        {result.advice ? (
          <View style={styles.adviceCard}>
            <View style={styles.adviceLeft}>
              <Ionicons name="bulb" size={20} color='#D97706' />
            </View>
            <Text style={styles.adviceText}>{result.advice}</Text>
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 14, gap: 12 },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 14, padding: 32, backgroundColor: colors.background,
  },
  loadingText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  currentCard: {
    backgroundColor: colors.primary, borderRadius: 20, padding: 22,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
  },
  currentLeft: { flex: 1, gap: 6 },
  currentRightDecor: { position: 'absolute', right: 12, top: 12 },
  youAreHereDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  currentLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 },
  currentLevel: { fontSize: 22, fontWeight: '900', color: '#fff' },
  currentSalaryRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  currentSalary: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },

  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 14,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

  roadmapStep: { flexDirection: 'row', gap: 12 },
  stepLeft: { alignItems: 'center', width: 28 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText: { fontSize: 12, fontWeight: '900', color: '#fff' },
  stepLine: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4, marginBottom: -12 },
  stepContent: { flex: 1, paddingBottom: 14, gap: 6 },
  stepHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  stepMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textMuted },
  diffBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  diffText: { fontSize: 11, fontWeight: '700' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: '#F1F5F9', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  chipPrimary: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipTextPrimary: { color: colors.primary, fontWeight: '700' },

  companiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  companyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
  },
  companyDot: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  companyInitial: { fontSize: 11, fontWeight: '800', color: '#fff' },
  companyName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },

  adviceCard: {
    backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#FCD34D', flexDirection: 'row', gap: 12, alignItems: 'flex-start',
  },
  adviceLeft: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  adviceText: { flex: 1, fontSize: 14, color: '#78350F', lineHeight: 22 },
  });
}