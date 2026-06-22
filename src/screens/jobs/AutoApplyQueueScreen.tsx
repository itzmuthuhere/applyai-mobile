import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { COLORS, API_ENDPOINTS } from '../../constants';
import apiClient from '../../api/apiClient';
import { AutoApplyQueueItem } from '../../types/api.types';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  PENDING:  { color: '#92400E', bg: '#FEF3C7', icon: 'time-outline',           label: 'Queued' },
  APPLYING: { color: '#1E40AF', bg: '#DBEAFE', icon: 'sync-outline',            label: 'Applying…' },
  APPLIED:  { color: '#065F46', bg: '#D1FAE5', icon: 'checkmark-circle-outline', label: 'Applied' },
  FAILED:   { color: '#991B1B', bg: '#FEE2E2', icon: 'alert-circle-outline',    label: 'Failed' },
  SKIPPED:  { color: '#475569', bg: '#F1F5F9', icon: 'arrow-forward-circle-outline', label: 'Skipped' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function QueueCard({
  item, onRemove,
}: { item: AutoApplyQueueItem; onRemove: (id: number) => void }) {
  const initial = item.company ? item.company[0].toUpperCase() : '?';
  const canRemove = item.status === 'PENDING' || item.status === 'FAILED' || item.status === 'SKIPPED';

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoInitial}>{initial}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.jobTitle} numberOfLines={1}>{item.jobTitle}</Text>
        <Text style={styles.company} numberOfLines={1}>
          {item.company}{item.location ? ` · ${item.location}` : ''}
        </Text>
        <View style={styles.cardMeta}>
          <StatusBadge status={item.status} />
          {item.matchScore != null && (
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>{item.matchScore}% match</Text>
            </View>
          )}
          <Text style={styles.queuedAt}>{dayjs(item.queuedAt).fromNow()}</Text>
        </View>
        {item.tailoredResumeText && (
          <View style={styles.tailoredBadge}>
            <Ionicons name="sparkles" size={11} color={COLORS.primary} />
            <Text style={styles.tailoredText}>Resume tailored</Text>
          </View>
        )}
        {item.appliedAt && (
          <Text style={styles.appliedAt}>Applied {dayjs(item.appliedAt).fromNow()}</Text>
        )}
      </View>
      {canRemove && (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AutoApplyQueueScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<AutoApplyQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!refresh) setIsLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get<AutoApplyQueueItem[]>(API_ENDPOINTS.AUTO_APPLY_QUEUE);
      setItems(data);
    } catch {
      setError('Could not load queue. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = useCallback(async (id: number) => {
    Alert.alert('Remove Job', 'Remove this job from your auto-apply queue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(API_ENDPOINTS.AUTO_APPLY_DELETE(id));
            setItems(prev => prev.filter(i => i.id !== id));
          } catch {
            Alert.alert('Error', 'Could not remove this job. Please try again.');
          }
        },
      },
    ]);
  }, []);

  const counts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1;
    return acc;
  }, {});

  const renderItem = useCallback(({ item }: { item: AutoApplyQueueItem }) => (
    <QueueCard item={item} onRemove={handleRemove} />
  ), [handleRemove]);

  const keyExtractor = useCallback((item: AutoApplyQueueItem) => String(item.id), []);

  return (
    <View style={styles.screen}>
      {/* Summary bar */}
      {items.length > 0 && (
        <View style={styles.summaryBar}>
          {Object.entries(counts).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status];
            if (!cfg) return null;
            return (
              <View key={status} style={[styles.summaryPill, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.summaryCount, { color: cfg.color }]}>{count}</Text>
                <Text style={[styles.summaryLabel, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Extension hint banner */}
      <View style={styles.hintBanner}>
        <Ionicons name="extension-puzzle-outline" size={15} color={COLORS.primary} />
        <Text style={styles.hintText}>
          Install the ApplyAI Chrome extension — it picks up queued jobs and auto-fills applications on Naukri, LinkedIn & Indeed.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={52} color={COLORS.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, items.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { setIsRefreshing(true); load(true); }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Ionicons name="rocket-outline" size={56} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Queue is empty</Text>
              <Text style={styles.emptySubtitle}>
                On the Jobs tab, tap "Select" then "Auto Apply" to queue jobs for automatic application.
              </Text>
              <TouchableOpacity
                style={styles.goToJobsBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.goToJobsText}>Go to Jobs</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  summaryBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  summaryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  summaryCount: { fontSize: 13, fontWeight: '700' },
  summaryLabel: { fontSize: 12, fontWeight: '500' },

  hintBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: COLORS.primaryLight,
  },
  hintText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 17 },

  listContent: { padding: 12, gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardLeft: { paddingTop: 2 },
  logoCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  logoInitial: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  cardBody: { flex: 1, gap: 4 },
  jobTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  company: { fontSize: 12, color: COLORS.textSecondary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  scorePill: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  scoreText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  queuedAt: { fontSize: 11, color: COLORS.textMuted },

  tailoredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
  },
  tailoredText: { fontSize: 11, color: COLORS.primary, fontWeight: '500' },
  appliedAt: { fontSize: 11, color: COLORS.success, marginTop: 2 },

  removeBtn: { padding: 4 },

  centerState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  goToJobsBtn: {
    marginTop: 8, backgroundColor: COLORS.primary,
    paddingHorizontal: 24, paddingVertical: 11, borderRadius: 8,
  },
  goToJobsText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
