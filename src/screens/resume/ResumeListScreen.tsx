import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Animated, Platform,
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

function scoreGrade(score: number | null): { label: string; color: string; bg: string; ring: string } {
  if (score === null) return { label: '—', color: COLORS.textMuted, bg: '#F1F5F9', ring: COLORS.border };
  if (score >= 80) return { label: 'Excellent', color: '#065F46', bg: '#D1FAE5', ring: '#10B981' };
  if (score >= 65) return { label: 'Good', color: '#1D4ED8', bg: '#DBEAFE', ring: COLORS.primary };
  if (score >= 50) return { label: 'Fair', color: '#92400E', bg: '#FEF3C7', ring: '#F59E0B' };
  return { label: 'Needs Work', color: '#991B1B', bg: '#FEE2E2', ring: '#EF4444' };
}

// ─── Score gauge ─────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number | null }) {
  const g = scoreGrade(score);
  return (
    <View style={[gaugeStyles.circle, { borderColor: g.ring, backgroundColor: g.bg }]}>
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
        <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.border }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ height: 14, width: '65%', backgroundColor: COLORS.border, borderRadius: 6 }} />
          <View style={{ height: 11, width: '40%', backgroundColor: COLORS.border, borderRadius: 6 }} />
        </View>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.border }} />
      </View>
    </Animated.View>
  );
}

// ─── Resume card ──────────────────────────────────────────────────────────────

function ResumeCard({ item, onPress }: { item: Resume; onPress: () => void }) {
  const g = scoreGrade(item.aiScore);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardRow}>
        {/* Icon */}
        <View style={[styles.fileIcon, { backgroundColor: item.isOriginal ? COLORS.primaryLight : '#F3E8FF' }]}>
          <Ionicons
            name="document-text"
            size={24}
            color={item.isOriginal ? COLORS.primary : '#7C3AED'}
          />
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.versionName} numberOfLines={1}>{item.versionName}</Text>
            {item.isOriginal && (
              <View style={styles.originalBadge}>
                <Text style={styles.originalText}>Original</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateText}>{dayjs(item.createdAt).format('MMM D, YYYY')}</Text>
          <View style={styles.metaRow}>
            {item.isParsed ? (
              <View style={styles.parsedBadge}>
                <Ionicons name="checkmark-circle" size={11} color="#065F46" />
                <Text style={styles.parsedText}>Parsed</Text>
              </View>
            ) : (
              <View style={styles.unparsedBadge}>
                <Ionicons name="ellipse-outline" size={11} color={COLORS.textMuted} />
                <Text style={styles.unparsedText}>Not parsed</Text>
              </View>
            )}
            {item.experienceYears != null && (
              <Text style={styles.expText}>{item.experienceYears} yr exp</Text>
            )}
          </View>
        </View>

        {/* Score gauge */}
        <ScoreGauge score={item.aiScore} />
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
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

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

  useEffect(() => { loadResumes(); }, [loadResumes]);

  const renderItem = useCallback(({ item }: { item: Resume }) => (
    <ResumeCard
      item={item}
      onPress={() => navigation.navigate(ROUTES.RESUME_DETAIL as 'ResumeDetail', { resumeId: item.id })}
    />
  ), [navigation]);

  const keyExtractor = useCallback((item: Resume) => String(item.id), []);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <View style={styles.tipCard}>
          <View style={{ width: 120, height: 14, backgroundColor: COLORS.border, borderRadius: 6, opacity: 0.4 }} />
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3].map(k => <SkeletonCard key={k} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={list}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, list.length === 0 && { flex: 1 }]}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          list.length > 0 ? (
            <View style={styles.tipCard}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.tipText}>
                Upload multiple versions. Use "Tailor Resume" on any job to create a custom copy.
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No resumes yet</Text>
            <Text style={styles.emptySubtitle}>
              Upload your resume and let AI parse, score, and tailor it for each job you apply to.
            </Text>
            <TouchableOpacity
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

      {/* FAB */}
      {list.length > 0 && (
        <TouchableOpacity
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: 14, gap: 12, paddingBottom: 100 },

  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.primaryLight, borderRadius: 12,
    padding: 12, marginHorizontal: 14, marginTop: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  tipText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 19, fontWeight: '500' },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: COLORS.border, gap: 12,
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
  versionName: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  originalBadge: { backgroundColor: COLORS.primaryLight, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  originalText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  dateText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  parsedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  parsedText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  unparsedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  unparsedText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  expText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },

  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    backgroundColor: '#F1F5F9', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  skillChipText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#BFDBFE',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
});
