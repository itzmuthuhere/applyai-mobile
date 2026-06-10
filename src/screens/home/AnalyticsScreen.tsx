import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchAnalyticsOverview, fetchResumePerformance } from '../../store/analyticsSlice';
import { COLORS } from '../../constants';

export default function AnalyticsScreen() {
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
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Analytics</Text>

        {overview && (
          <>
            <View style={styles.row}>
              <StatCard label="Total Applied" value={overview.totalApplications} />
              <StatCard label="Pending" value={overview.pendingApplications} />
            </View>
            <View style={styles.row}>
              <StatCard label="Interviews" value={overview.interviewsScheduled} />
              <StatCard label="Offers" value={overview.offersReceived} />
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Avg Match Score</Text>
              <Text style={styles.bigNumber}>{overview.averageMatchScore}%</Text>
            </View>

            {overview.topAppliedRoles.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Applied Roles</Text>
                {overview.topAppliedRoles.map((r, i) => (
                  <Text key={i} style={styles.listItem}>• {r}</Text>
                ))}
              </View>
            )}

            {overview.applicationsByMonth.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Applications by Month</Text>
                {overview.applicationsByMonth.map((m, i) => (
                  <View key={i} style={styles.barRow}>
                    <Text style={styles.barLabel}>{m.month}</Text>
                    <View style={[styles.bar, { width: Math.min(m.count * 12, 200) }]} />
                    <Text style={styles.barCount}>{m.count}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {resumePerformance.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resume Performance</Text>
            {resumePerformance.map((r) => (
              <View key={r.resumeId} style={styles.resumeRow}>
                <Text style={styles.resumeName} numberOfLines={1}>{r.fileName}</Text>
                <Text style={styles.resumeStat}>{r.totalApplications} apps · {r.interviewRate}% interview rate</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  statValue: { fontSize: 32, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  bigNumber: { fontSize: 40, fontWeight: '700', color: COLORS.secondary },
  listItem: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  barLabel: { width: 48, fontSize: 12, color: COLORS.textSecondary },
  bar: { height: 12, backgroundColor: COLORS.primary, borderRadius: 6, marginHorizontal: 8 },
  barCount: { fontSize: 12, color: COLORS.textSecondary },
  resumeRow: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 8 },
  resumeName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  resumeStat: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  errorText: { color: COLORS.error, fontSize: 16 },
});
