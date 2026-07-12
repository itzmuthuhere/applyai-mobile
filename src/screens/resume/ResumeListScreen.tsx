import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Animated, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { API_ENDPOINTS, ROUTES } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { ResumeStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setResumes, setLoading, setError, clearError, removeResume, setPrimaryResume } from '../../store/slices/resumeSlice';
import { Resume } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import { decodeFileName } from '../../utils/decodeFileName';
import WebPageContainer from '../../components/common/WebPageContainer';

type Nav = NativeStackNavigationProp<ResumeStackParamList, 'ResumeList'>;

function scoreGrade(score: number | null, colors: AppColors): { label: string; color: string; bg: string; ring: string } {
  if (score === null) return { label: '—', color: colors.textMuted, bg: '#F1F5F9', ring: colors.border };
  if (score >= 80) return { label: 'Excellent', color: '#065F46', bg: '#D1FAE5', ring: '#10B981' };
  if (score >= 65) return { label: 'Good', color: '#1D4ED8', bg: '#DBEAFE', ring: colors.primary };
  if (score >= 50) return { label: 'Fair', color: '#92400E', bg: '#FEF3C7', ring: '#F59E0B' };
  return { label: 'Needs Work', color: '#991B1B', bg: '#FEE2E2', ring: '#EF4444' };
}

// ─── Score gauge ─────────────────────────────────────────────────────────────

function ScoreGauge({ score, itemId }: { score: number | null; itemId?: number }) {
  const colors = useTheme();
  const g = scoreGrade(score, colors);
  return (
    <View
      testID={score === null && itemId != null ? `resume-no-score-${itemId}` : undefined}
      style={[gaugeStyles.circle, { borderColor: g.ring, backgroundColor: g.bg }]}
    >
      <Text style={[gaugeStyles.num, { color: g.color }]}>{score ?? '—'}</Text>
      {score !== null && <Text style={[gaugeStyles.label, { color: g.color }]}>{g.label}</Text>}
    </View>
  );
}
const gaugeStyles = StyleSheet.create({
  circle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  num: { fontSize: 18, fontWeight: '900' },
  label: { fontSize: 8, fontWeight: '700', marginTop: -2 },
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.border }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 14, width: '65%', backgroundColor: colors.border, borderRadius: 6 }} />
          <View style={{ height: 11, width: '40%', backgroundColor: colors.border, borderRadius: 6 }} />
        </View>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.border }} />
      </View>
    </Animated.View>
  );
}

// ─── Resume card ──────────────────────────────────────────────────────────────

function ResumeCard({ item, onPress, onLongPress, deleting, onSetPrimary, settingPrimary, isPrimary }: {
  item: Resume; onPress: () => void; onLongPress: () => void; deleting: boolean;
  onSetPrimary: (resume: Resume) => void; settingPrimary: boolean; isPrimary: boolean;
}) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const g = scoreGrade(item.aiScore, colors);
  return (
    <TouchableOpacity
      testID={`resume-card-${item.id}`}
      style={[styles.card, deleting && { opacity: 0.5 }]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={deleting}
      delayLongPress={350}
      activeOpacity={0.8}
    >
      <View style={styles.cardRow}>
        {/* Icon */}
        <View style={[styles.fileIcon, { backgroundColor: item.isOriginal ? colors.primaryLight : '#F3E8FF' }]}>
          <Ionicons
            name="document-text"
            size={24}
            color={item.isOriginal ? colors.primary : '#7C3AED'}
          />
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.versionName} numberOfLines={1}>{decodeFileName(item.versionName)}</Text>
            {item.isOriginal && (
              <View style={styles.originalBadge}>
                <Text style={styles.originalText}>Original</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateText}>{dayjs(item.createdAt).format('MMM D, YYYY')}</Text>
          <View style={styles.metaRow}>
            {item.isParsed ? (
              <View testID={`parsed-badge-${item.id}`} style={styles.parsedBadge}>
                <Ionicons name="checkmark-circle" size={11} color="#065F46" />
                <Text style={styles.parsedText}>Parsed</Text>
              </View>
            ) : (
              <View style={styles.unparsedBadge}>
                <Ionicons name="ellipse-outline" size={11} color={colors.textMuted} />
                <Text style={styles.unparsedText}>Not parsed</Text>
              </View>
            )}
            {item.experienceYears != null && (
              <Text style={styles.expText}>{item.experienceYears} yr exp</Text>
            )}
          </View>
        </View>

        {/* Score gauge */}
        <ScoreGauge score={item.aiScore} itemId={item.id} />
      </View>

      {/* Skills preview */}
      {item.skills && (
        <View style={styles.skillsRow}>
          {item.skills.replace(/[\[\]"]/g, '').split(',').slice(0, 5).map((s, i) => (
            <View key={i} style={styles.skillChip}>
              <Text style={styles.skillChipText} numberOfLines={1}>{s.trim()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Job-matching selector — which resume is actually used for AI job matching.
          Uses the computed isPrimary (single-winner tiebreak), not the raw isOriginal
          flag directly — older accounts can have multiple resumes stuck with
          isOriginal=true from before uploads/set-primary started enforcing exclusivity
          server-side, which would otherwise show every one of them as "primary" and
          hide the selector on all of them (BUG-MOB-013). */}
      {isPrimary ? (
        <View testID={`matching-indicator-${item.id}`} style={styles.matchingRow}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.matchingText}>Used for job matching</Text>
        </View>
      ) : item.isParsed ? (
        <TouchableOpacity
          testID={`set-primary-btn-${item.id}`}
          style={styles.setPrimaryBtn}
          onPress={() => onSetPrimary(item)}
          disabled={settingPrimary}
          activeOpacity={0.8}
        >
          {settingPrimary ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
              <Text style={styles.setPrimaryText}>Use for job matching</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ResumeListScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();
  const { list, isLoading, error } = useSelector((s: RootState) => s.resume);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null);

  // Single-winner tiebreak — list is createdAt DESC, so this is "the newest resume
  // still flagged isOriginal", matching what JobFeedScreen/JobDetailScreen already use
  // to pick the resume for AI matching. Needed because accounts with resumes uploaded
  // before the isOriginal-exclusivity fix (BUG-060) can have several rows simultaneously
  // flagged isOriginal=true.
  const primaryResumeId = (list.find(r => r.isParsed && r.isOriginal) ?? list.find(r => r.isOriginal))?.id ?? null;

  const loadResumes = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(clearError());
    try {
      const res = await apiClient.get<{ content: Resume[] } | Resume[]>(API_ENDPOINTS.RESUMES);
      const list = Array.isArray(res.data) ? res.data : (res.data.content ?? []);
      dispatch(setResumes(list));
    } catch {
      dispatch(setError('Failed to load resumes.'));
    }
  }, [dispatch]);

  useEffect(() => { loadResumes(); }, [loadResumes]);

  const deleteResume = useCallback(async (resume: Resume) => {
    setDeletingId(resume.id);
    try {
      await apiClient.delete(API_ENDPOINTS.RESUME_BY_ID(resume.id));
      dispatch(removeResume(resume.id));
    } catch (e: any) {
      const message = e?.response?.data?.error ?? 'Could not delete this resume. Please try again.';
      Alert.alert('Delete failed', message);
    } finally {
      setDeletingId(null);
    }
  }, [dispatch]);

  const handleSetPrimary = useCallback(async (resume: Resume) => {
    setSettingPrimaryId(resume.id);
    try {
      await apiClient.put(API_ENDPOINTS.RESUME_SET_PRIMARY(resume.id));
      dispatch(setPrimaryResume(resume.id));
    } catch (e: any) {
      const message = e?.response?.data?.error ?? 'Could not switch resumes. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSettingPrimaryId(null);
    }
  }, [dispatch]);

  const confirmDelete = useCallback((resume: Resume) => {
    Alert.alert(
      'Delete resume?',
      `"${decodeFileName(resume.versionName)}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteResume(resume) },
      ]
    );
  }, [deleteResume]);

  const renderItem = useCallback(({ item }: { item: Resume }) => (
    <ResumeCard
      item={item}
      onPress={() => navigation.navigate(ROUTES.RESUME_DETAIL as 'ResumeDetail', { resumeId: item.id })}
      onLongPress={() => confirmDelete(item)}
      deleting={deletingId === item.id}
      onSetPrimary={handleSetPrimary}
      settingPrimary={settingPrimaryId === item.id}
      isPrimary={item.id === primaryResumeId}
    />
  ), [navigation, confirmDelete, deletingId, handleSetPrimary, settingPrimaryId, primaryResumeId]);

  const keyExtractor = useCallback((item: Resume) => String(item.id), []);

  if (isLoading) {
    return (
      <View testID="resumes-loading" style={styles.screen}>
        <View style={styles.tipCard}>
          <View style={{ width: 120, height: 14, backgroundColor: colors.border, borderRadius: 6, opacity: 0.4 }} />
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3].map(k => <SkeletonCard key={k} />)}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View testID="resumes-error" style={styles.screen}>
        <View style={[styles.tipCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          <Text style={[styles.tipText, { color: '#991B1B' }]}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <WebPageContainer maxWidth={720}>
      <FlatList
        data={list}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, list.length === 0 && { flex: 1 }]}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          list.length > 0 ? (
            <View style={styles.tipCard}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.tipText}>
                Upload multiple versions. Use "Tailor Resume" on any job to create a custom copy.
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View testID="resumes-empty-state" style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No resumes yet</Text>
            <Text style={styles.emptySubtitle}>
              Upload your resume and let AI parse, score, and tailor it for each job you apply to.
            </Text>
            <TouchableOpacity
              testID="upload-resume-btn"
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('ResumeUpload')}
              activeOpacity={0.85}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Upload Resume</Text>
            </TouchableOpacity>
          </View>
        }
      />
      </WebPageContainer>

      {/* FAB */}
      {list.length > 0 && (
        <TouchableOpacity
          testID="upload-resume-btn"
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ResumeUpload')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 14, gap: 12, paddingBottom: 100 },

  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.primaryLight, borderRadius: 12,
    padding: 12, marginHorizontal: 14, marginTop: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  tipText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 19, fontWeight: '500' },

  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: colors.border, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  fileIcon: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  versionName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  originalBadge: { backgroundColor: colors.primaryLight, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  originalText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  dateText: { fontSize: 12, color: colors.textMuted, marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  parsedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  parsedText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  unparsedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  unparsedText: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  expText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: '#F1F5F9', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  skillChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },

  matchingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border,
  },
  matchingText: { fontSize: 12, fontWeight: '700', color: colors.success },
  setPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border,
  },
  setPrimaryText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#BFDBFE',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  });
}