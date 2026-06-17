import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_ENDPOINTS } from '../../constants';
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

function diffColor(d: string): string {
  const lower = (d ?? '').toLowerCase();
  if (lower.includes('easy') || lower.includes('low')) return '#D1FAE5';
  if (lower.includes('hard') || lower.includes('high')) return '#FEE2E2';
  return '#FEF9C3';
}

export default function CareerPathScreen() {
  const { params } = useRoute<RouteProps>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CareerPathResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<CareerPathResult>(API_ENDPOINTS.CAREER_PATH, {
        resumeId: params.resumeId,
      });
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to generate career path.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Analysing your career trajectory...</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error ?? 'No result.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current level */}
      <View style={styles.currentCard}>
        <Text style={styles.currentLabel}>Where You Are Now</Text>
        <Text style={styles.levelText}>{result.currentLevel}</Text>
        {result.currentSalaryRange ? (
          <Text style={styles.salaryText}>{result.currentSalaryRange}</Text>
        ) : null}
      </View>

      {/* Next roles */}
      {result.nextRoles.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Next Moves</Text>
          {result.nextRoles.map((role, i) => (
            <View key={i} style={[styles.roleCard, i > 0 && styles.roleDivider]}>
              <View style={styles.roleHeader}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                {role.difficulty ? (
                  <View style={[styles.diffBadge, { backgroundColor: diffColor(role.difficulty) }]}>
                    <Text style={styles.diffText}>{role.difficulty}</Text>
                  </View>
                ) : null}
              </View>
              {(role.timeline || role.salaryRange) ? (
                <Text style={styles.roleMeta}>
                  {[role.timeline, role.salaryRange].filter(Boolean).join(' • ')}
                </Text>
              ) : null}
              {role.skillsNeeded.length > 0 && (
                <View style={styles.chipsRow}>
                  {role.skillsNeeded.map((s, j) => (
                    <View key={j} style={styles.chip}>
                      <Text style={styles.chipText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Skills to learn */}
      {result.skillsToLearnNow.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Learn These Now</Text>
          <View style={styles.chipsRow}>
            {result.skillsToLearnNow.map((s, i) => (
              <View key={i} style={[styles.chip, styles.primaryChip]}>
                <Text style={[styles.chipText, styles.primaryChipText]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Companies hiring */}
      {result.companiesHiring.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Companies Hiring for These Roles</Text>
          <View style={styles.chipsRow}>
            {result.companiesHiring.map((c, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Advice */}
      {result.advice ? (
        <View style={styles.adviceCard}>
          <Ionicons name="bulb-outline" size={18} color={COLORS.warning} style={{ marginTop: 1 }} />
          <Text style={styles.adviceText}>{result.advice}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: COLORS.background },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  errorText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  currentCard: {
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, gap: 6,
  },
  currentLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 },
  levelText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  salaryText: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },

  roleCard: { gap: 6 },
  roleDivider: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginTop: 2 },
  roleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  diffText: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary },
  roleMeta: { fontSize: 13, color: COLORS.textSecondary },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: COLORS.background, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  primaryChip: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  primaryChipText: { color: COLORS.primary, fontWeight: '600' },

  adviceCard: {
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#FCD34D', flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  adviceText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },
});
