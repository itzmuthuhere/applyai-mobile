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
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import { AutoApplyQueueItem } from '../../types/api.types';
import WebPageContainer from '../../components/common/WebPageContainer';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  PENDING:  { color: '#92400E', bg: '#FEF3C7', icon: 'time-outline',           label: 'Queued' },
  APPLYING: { color: '#1E40AF', bg: '#DBEAFE', icon: 'sync-outline',            label: 'Applying…' },
  APPLIED:  { color: '#065F46', bg: '#D1FAE5', icon: 'checkmark-circle-outline', label: 'Applied' },
  FAILED:   { color: '#991B1B', bg: '#FEE2E2', icon: 'alert-circle-outline',    label: 'Failed' },
  SKIPPED:  { color: '#475569', bg: '#F1F5F9', icon: 'arrow-forward-circle-outline', label: 'Skipped' },
};

function isRemovable(status: string) {
  return status === 'PENDING' || status === 'FAILED' || status === 'SKIPPED';
}

function StatusBadge({ status }: { status: string }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function QueueCard({
  item, onRemove, selectMode, selected, onToggleSelect,
}: {
  item: AutoApplyQueueItem;
  onRemove: (id: number) => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: number) => void;
}) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const initial = item.company ? item.company[0].toUpperCase() : '?';
  const canRemove = isRemovable(item.status);

  const body = (
    <>
      {selectMode && (
        <View style={styles.checkWrap}>
          <View style={[
            styles.checkCircle,
            selected && styles.checkCircleActive,
            !canRemove && styles.checkCircleDisabled,
          ]}>
            {selected && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
        </View>
      )}
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
        <View style={styles.tagRow}>
          {item.tailoredResumeText && (
            <View style={styles.tailoredBadge}>
              <Ionicons name="sparkles" size={11} color={colors.primary} />
              <Text style={styles.tailoredText}>Resume tailored</Text>
            </View>
          )}
          {item.tailoredCoverLetterText && (
            <View style={styles.tailoredBadge}>
              <Ionicons name="document-text" size={11} color={colors.primary} />
              <Text style={styles.tailoredText}>Cover letter ready</Text>
            </View>
          )}
        </View>
        {item.appliedAt && (
          <Text style={styles.appliedAt}>Applied {dayjs(item.appliedAt).fromNow()}</Text>
        )}
      </View>
      {!selectMode && canRemove && (
        <TouchableOpacity
          testID={`remove-btn-${item.id}`}
          style={styles.removeBtn}
          onPress={() => onRemove(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      )}
    </>
  );

  if (selectMode) {
    return (
      <TouchableOpacity
        testID={`queue-card-${item.id}`}
        style={styles.card}
        activeOpacity={canRemove ? 0.7 : 1}
        disabled={!canRemove}
        onPress={() => onToggleSelect(item.id)}
      >
        {body}
      </TouchableOpacity>
    );
  }
  return <View style={styles.card}>{body}</View>;
}

export default function AutoApplyQueueScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<AutoApplyQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkRemoving, setIsBulkRemoving] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (!refresh) setIsLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get<any>(API_ENDPOINTS.AUTO_APPLY_QUEUE);
      setItems(Array.isArray(data) ? data : (data.content ?? []));
    } catch {
      setError('Could not load queue. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

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

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(items.filter(i => isRemovable(i.status)).map(i => i.id)));
  }, [items]);

  const handleBulkRemove = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Remove Jobs',
      `Remove ${selectedIds.size} job${selectedIds.size === 1 ? '' : 's'} from your auto-apply queue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            setIsBulkRemoving(true);
            const ids = Array.from(selectedIds);
            try {
              await apiClient.delete(API_ENDPOINTS.AUTO_APPLY_DELETE_BATCH, { data: { ids } });
              setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
              exitSelectMode();
            } catch {
              Alert.alert('Error', 'Could not remove these jobs. Please try again.');
            } finally {
              setIsBulkRemoving(false);
            }
          },
        },
      ],
    );
  }, [selectedIds, exitSelectMode]);

  const counts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1;
    return acc;
  }, {});

  const renderItem = useCallback(({ item }: { item: AutoApplyQueueItem }) => (
    <QueueCard
      item={item}
      onRemove={handleRemove}
      selectMode={selectMode}
      selected={selectedIds.has(item.id)}
      onToggleSelect={handleToggleSelect}
    />
  ), [handleRemove, selectMode, selectedIds, handleToggleSelect]);

  const keyExtractor = useCallback((item: AutoApplyQueueItem) => String(item.id), []);

  return (
    <View style={styles.screen}>
      <WebPageContainer maxWidth={760}>
      {/* Select toggle row */}
      {items.length > 0 && (
        <View testID="queue-select-row" style={styles.selectRow}>
          <Text style={styles.selectRowTitle}>
            {selectMode ? `${selectedIds.size} selected` : `${items.length} job${items.length === 1 ? '' : 's'}`}
          </Text>
          {!selectMode ? (
            <TouchableOpacity testID="queue-select-toggle" onPress={() => setSelectMode(true)} style={styles.selectToggleBtn}>
              <Text style={styles.selectToggleText}>Select</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity testID="queue-cancel-select-btn" onPress={exitSelectMode} style={styles.selectToggleBtn}>
              <Text style={styles.selectToggleText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Summary bar */}
      {items.length > 0 && !selectMode && (
        <View testID="queue-summary-bar" style={styles.summaryBar}>
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
      {!selectMode && (
        <View testID="extension-hint-banner" style={styles.hintBanner}>
          <Ionicons name="extension-puzzle-outline" size={15} color={colors.primary} />
          <Text style={styles.hintText}>
            Install the ApplyAI Chrome extension — it picks up queued jobs and auto-fills applications on Naukri, LinkedIn & Indeed.
          </Text>
        </View>
      )}

      {isLoading ? (
        <View testID="queue-loading"><ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} /></View>
      ) : error ? (
        <View testID="queue-error" style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} />
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
          contentContainerStyle={[styles.listContent, items.length === 0 && { flex: 1 }, selectMode && { paddingBottom: 90 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { setIsRefreshing(true); load(true); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View testID="queue-empty-state" style={styles.centerState}>
              <Ionicons name="rocket-outline" size={56} color={colors.border} />
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

      {/* Bulk action bar */}
      {selectMode && (
        <View testID="queue-bulk-bar" style={styles.bulkBar}>
          <TouchableOpacity testID="queue-select-all-btn" onPress={handleSelectAll} style={styles.bulkSecondaryBtn}>
            <Text style={styles.bulkSecondaryText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="queue-bulk-remove-btn"
            style={[styles.bulkRemoveBtn, (selectedIds.size === 0 || isBulkRemoving) && styles.bulkRemoveBtnDisabled]}
            onPress={handleBulkRemove}
            disabled={selectedIds.size === 0 || isBulkRemoving}
          >
            {isBulkRemoving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.bulkRemoveText}>
                  Remove{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
      </WebPageContainer>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  selectRowTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  selectToggleBtn: { padding: 4 },
  selectToggleText: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  summaryBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
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
    backgroundColor: colors.primaryLight,
  },
  hintText: { flex: 1, fontSize: 12, color: colors.primary, lineHeight: 17 },

  listContent: { padding: 12, gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  checkWrap: { paddingTop: 2 },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkCircleDisabled: { opacity: 0.35 },
  cardLeft: { paddingTop: 2 },
  logoCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  logoInitial: { fontSize: 16, fontWeight: '700', color: colors.primary },
  cardBody: { flex: 1, gap: 4 },
  jobTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  company: { fontSize: 12, color: colors.textSecondary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  scorePill: {
    backgroundColor: colors.background,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  scoreText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  queuedAt: { fontSize: 11, color: colors.textMuted },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tailoredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
  },
  tailoredText: { fontSize: 11, color: colors.primary, fontWeight: '500' },
  appliedAt: { fontSize: 11, color: colors.success, marginTop: 2 },

  removeBtn: { padding: 4 },

  centerState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  errorText: { fontSize: 14, color: colors.error, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, backgroundColor: colors.primary,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  goToJobsBtn: {
    marginTop: 8, backgroundColor: colors.primary,
    paddingHorizontal: 24, paddingVertical: 11, borderRadius: 8,
  },
  goToJobsText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  bulkBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 8,
  },
  bulkSecondaryBtn: {
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  bulkSecondaryText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  bulkRemoveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.error, borderRadius: 10, paddingVertical: 12,
  },
  bulkRemoveBtnDisabled: { opacity: 0.5 },
  bulkRemoveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  });
}
