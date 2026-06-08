import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { COLORS, API_ENDPOINTS, ROUTES } from '../../constants';
import { ResumeStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setResumes, setLoading, setError } from '../../store/slices/resumeSlice';
import { Resume } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type Nav = NativeStackNavigationProp<ResumeStackParamList, 'ResumeList'>;

export default function ResumeListScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const { list, isLoading, error } = useSelector((s: RootState) => s.resume);

  const loadResumes = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));
    try {
      const res = await apiClient.get<Resume[]>(API_ENDPOINTS.RESUMES);
      dispatch(setResumes(res.data));
    } catch {
      dispatch(setError('Failed to load resumes.'));
    }
  }, [dispatch]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const scoreColor = (score: number | null) => {
    if (score === null) return COLORS.textMuted;
    if (score >= 75) return COLORS.success;
    if (score >= 50) return COLORS.warning;
    return COLORS.error;
  };

  const scoreBg = (score: number | null) => {
    if (score === null) return '#F1F5F9';
    if (score >= 75) return '#D1FAE5';
    if (score >= 50) return '#FEF3C7';
    return '#FEE2E2';
  };

  const renderItem = ({ item }: { item: Resume }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate(ROUTES.RESUME_DETAIL as 'ResumeDetail', { resumeId: item.id })}
    >
      <View style={styles.cardLeft}>
        <View style={styles.fileIconWrap}>
          <Ionicons name="document-text" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.versionName} numberOfLines={1}>{item.versionName}</Text>
          <Text style={styles.createdAt}>{dayjs(item.createdAt).format('MMM D, YYYY')}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        {item.isOriginal && (
          <View style={styles.originalBadge}>
            <Text style={styles.originalText}>Original</Text>
          </View>
        )}
        <View style={[styles.scoreBadge, { backgroundColor: scoreBg(item.aiScore) }]}>
          <Text style={[styles.scoreText, { color: scoreColor(item.aiScore) }]}>
            {item.aiScore !== null ? `${item.aiScore}` : '—'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const renderSkeleton = () => (
    <>
      {[1, 2, 3].map((k) => (
        <View key={k} style={[styles.card, styles.skeletonCard]}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonLines}>
            <View style={styles.skeletonLine1} />
            <View style={styles.skeletonLine2} />
          </View>
        </View>
      ))}
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.border} />
      <Text style={styles.emptyTitle}>No resumes yet</Text>
      <Text style={styles.emptySubtitle}>Upload your first resume to get started</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('ResumeUpload')}
      >
        <Text style={styles.emptyButtonText}>Upload Resume</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyWrap}>
      <Ionicons name="cloud-offline-outline" size={64} color={COLORS.error} />
      <Text style={styles.emptyTitle}>Failed to load resumes</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadResumes}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Resumes</Text>
        <Text style={styles.headerCount}>{list.length} version{list.length !== 1 ? 's' : ''}</Text>
      </View>

      {isLoading ? (
        <View style={styles.listContent}>{renderSkeleton()}</View>
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, list.length === 0 && styles.listEmpty]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadResumes} tintColor={COLORS.primary} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ResumeUpload')}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  headerCount: { fontSize: 14, color: COLORS.textSecondary },

  listContent: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  fileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardText: { flex: 1 },
  versionName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  createdAt: { fontSize: 12, color: COLORS.textMuted },

  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  originalBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  originalText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  scoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: { fontSize: 13, fontWeight: '700' },

  // Skeleton
  skeletonCard: { opacity: 0.5 },
  skeletonIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.border, marginRight: 12 },
  skeletonLines: { flex: 1, gap: 8 },
  skeletonLine1: { height: 14, borderRadius: 6, backgroundColor: COLORS.border, width: '60%' },
  skeletonLine2: { height: 11, borderRadius: 6, backgroundColor: COLORS.border, width: '35%' },

  // Empty / Error
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  retryButton: {
    marginTop: 16,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  retryText: { color: COLORS.error, fontWeight: '600', fontSize: 15 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
