import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  SafeAreaView, Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { fetchAnalyticsOverview, fetchResumePerformance } from '../../store/analyticsSlice';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';

const STAT_CONFIG: Array<{
  key: keyof ReturnType<typeof buildStats>;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
}> = [
  { key: 'totalApplications', label: 'Applied', icon: 'send-outline', color: '#2563EB', bg: '#DBEAFE' },
  { key: 'pendingApplications', label: 'Pending', icon: 'hourglass-outline', color: '#F59E0B', bg: '#FEF3C7' },
  { key: 'interviewsScheduled', label: 'Interviews', icon: 'mic-outline', color: '#10B981', bg: '#D1FAE5' },
  { key: 'offersReceived', label: 'Offers', icon: 'trophy-outline', color: '#7C3AED', bg: '#EDE9FE' },
];

function buildStats(o: any) {
  return {
    totalApplications: o?.totalApplications ?? 0,
    pendingApplications: o?.pendingApplications ?? 0,
    interviewsScheduled: o?.interviewsScheduled ?? 0,
    offersReceived: o?.offersReceived ?? 0,
  };
}

function SkeletonBlock({ width, height }: { width: number | string; height: number }) {
  const colors = useTheme();
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
    <Animated.View
      style={{ width: width as any, height, borderRadius: 8, backgroundColor: colors.border, opacity }}
    />
  );
}

function StatCard({ label, value, icon, color, bg }: { label: string; value: number; icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <View style={[styles.statIconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function AnalyticsScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const { overview, resumePerformance, loading, error } = useSelector(
    (s: RootState) => s.analytics
  );

  useEffect(() => {
    dispatch(fetchAnalyticsOverview());
    dispatch(fetchResumePerformance());
  }, [dispatch]);

  if (loading && !overview) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={{ height: 8 }} />
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4].map(k => (
              <Animated.View key={k} style={[styles.statCard, { borderTopColor: colors.border }]}>
                <SkeletonBlock width={36} height={36} />
                <SkeletonBlock width={40} height={28} />
                <SkeletonBlock width={56} height={12} />
              </Animated.View>
            ))}
          </View>
          <View style={[styles.card, { gap: 14 }]}>
            <SkeletonBlock width="50%" height={16} />
            <SkeletonBlock width="100%" height={32} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = buildStats(overview);
  const maxMonth = Math.max(...(overview?.applicationsByMonth?.map((m: any) => m.count) ?? [1]), 1);
  const successRate = stats.totalApplications > 0
    ? Math.round((stats.offersReceived / stats.totalApplications) * 100)
    : 0;
  const interviewRate = stats.totalApplications > 0
    ? Math.round((stats.interviewsScheduled / stats.totalApplications) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Stat cards */}
        <View style={styles.statsGrid}>
          {STAT_CONFIG.map(cfg => (
            <StatCard
              key={cfg.key}
              label={cfg.label}
              value={stats[cfg.key]}
              icon={cfg.icon}
              color={cfg.color}
              bg={cfg.bg}
            />
          ))}
        </View>

        {/* Match score + funnel */}
        {overview && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="funnel-outline" size={15} color={colors.primary} />
              <Text style={styles.cardTitle}>Application Funnel</Text>
            </View>

            {/* Score gauge */}
            {overview.averageMatchScore != null && (
              <View style={styles.scoreRow}>
                <View style={styles.scoreGauge}>
                  <Text style={styles.scoreValue}>{Math.round(overview.averageMatchScore)}%</Text>
                  <Text style={styles.scoreLabel}>Avg Match</Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreGauge}>
                  <Text style={[styles.scoreValue, { color: '#10B981' }]}>{interviewRate}%</Text>
                  <Text style={styles.scoreLabel}>Interview Rate</Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreGauge}>
                  <Text style={[styles.scoreValue, { color: '#7C3AED' }]}>{successRate}%</Text>
                  <Text style={styles.scoreLabel}>Offer Rate</Text>
                </View>
              </View>
            )}

            {/* Funnel bars */}
            <View style={styles.funnelBars}>
              {[
                { label: 'Applied', value: stats.totalApplications, color: colors.primary },
                { label: 'Pending', value: stats.pendingApplications, color: '#F59E0B' },
                { label: 'Interview', value: stats.interviewsScheduled, color: '#10B981' },
                { label: 'Offer', value: stats.offersReceived, color: '#7C3AED' },
              ].map(item => (
                <View key={item.label} style={styles.funnelRow}>
                  <Text style={styles.funnelLabel}>{item.label}</Text>
                  <View style={{ flex: 1 }}>
                    <ProgressBar value={item.value} max={stats.totalApplications} color={item.color} />
                  </View>
                  <Text style={[styles.funnelCount, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Monthly activity */}
        {overview != null && (overview.applicationsByMonth?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="bar-chart-outline" size={15} color='#059669' />
              <Text style={styles.cardTitle}>Monthly Activity</Text>
            </View>
            <View style={styles.chartArea}>
              {overview.applicationsByMonth.map((m: any, i: number) => {
                const barH = Math.max(Math.round((m.count / maxMonth) * 80), 4);
                return (
                  <View key={i} style={styles.chartCol}>
                    <Text style={styles.chartCount}>{m.count > 0 ? m.count : ''}</Text>
                    <View style={[styles.chartBar, { height: barH }]} />
                    <Text style={styles.chartMonth}>{m.month?.slice(0, 3) ?? ''}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Top roles */}
        {overview != null && (overview.topAppliedRoles?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="briefcase-outline" size={15} color='#D97706' />
              <Text style={styles.cardTitle}>Top Roles Applied</Text>
            </View>
            {overview.topAppliedRoles.map((r: string, i: number) => (
              <View key={i} style={styles.roleRow}>
                <View style={[styles.roleDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.roleText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Resume performance */}
        {resumePerformance.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="document-text-outline" size={15} color='#7C3AED' />
              <Text style={styles.cardTitle}>Resume Performance</Text>
            </View>
            {resumePerformance.map((r: any) => (
              <View key={r.resumeId} style={styles.resumeItem}>
                <View style={styles.resumeIconBox}>
                  <Ionicons name="document-outline" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resumeName} numberOfLines={1}>{r.fileName}</Text>
                  <View style={styles.resumeStats}>
                    <Text style={styles.resumeStat}>{r.totalApplications} apps</Text>
                    <View style={styles.statDot} />
                    <Text style={styles.resumeStat}>{r.interviewRate}% interviews</Text>
                  </View>
                </View>
                <View style={[styles.rateTag, { backgroundColor: r.interviewRate >= 30 ? '#D1FAE5' : colors.primaryLight }]}>
                  <Text style={[styles.rateTagText, { color: r.interviewRate >= 30 ? '#065F46' : colors.primary }]}>
                    {r.interviewRate}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 14, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, borderTopWidth: 3, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 28, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreGauge: { flex: 1, alignItems: 'center', gap: 4 },
  scoreValue: { fontSize: 22, fontWeight: '900', color: colors.primary },
  scoreLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  scoreDivider: { width: 1, height: 36, backgroundColor: colors.border },

  funnelBars: { gap: 10 },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  funnelLabel: { width: 64, fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  funnelCount: { width: 24, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  progressTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  chartArea: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 8, height: 110, paddingTop: 24,
  },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartCount: { fontSize: 9, color: colors.textMuted, fontWeight: '700' },
  chartBar: { width: '100%', backgroundColor: colors.primary + '90', borderRadius: 4 },
  chartMonth: { fontSize: 9, color: colors.textMuted, fontWeight: '500' },

  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  roleText: { fontSize: 13, color: colors.textSecondary },

  resumeItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  resumeIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  resumeName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  resumeStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resumeStat: { fontSize: 11, color: colors.textMuted },
  statDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.border },
  rateTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  rateTagText: { fontSize: 12, fontWeight: '800' },
  });
}