import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, SafeAreaView,
} from 'react-native';
import ResumeDropdown from '../../components/common/ResumeDropdown';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { JobsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setResumes } from '../../store/slices/resumeSlice';
import WebPageContainer from '../../components/common/WebPageContainer';
import { Resume, CoverLetterResponse } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<JobsStackParamList, 'CoverLetter'>;

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

export default function CoverLetterScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { params } = useRoute<RouteProps>();
  const dispatch = useDispatch();

  const selectedJob = useSelector((s: RootState) => s.job.selected);
  const resumes = useSelector((s: RootState) => s.resume.list);

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(params.resumeId ?? null);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWarmup, setShowWarmup] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedResumes = resumes.filter((r) => r.isParsed);

  useEffect(() => {
    if (resumes.length === 0) loadResumes();
  }, []);

  async function loadResumes() {
    setResumesLoading(true);
    try {
      const { data } = await apiClient.get<{ content: Resume[] } | Resume[]>(API_ENDPOINTS.RESUMES);
      const list = Array.isArray(data) ? data : (data.content ?? []);
      dispatch(setResumes(list));
    } catch {}
    finally { setResumesLoading(false); }
  }

  async function handleGenerate() {
    if (!selectedResumeId) return;
    setIsLoading(true);
    setError(null);
    const warmupTimer = setTimeout(() => setShowWarmup(true), 5000);
    try {
      const { data } = await apiClient.post<CoverLetterResponse>(
        API_ENDPOINTS.COVER_LETTER,
        { resumeId: selectedResumeId, jobId: params.jobId },
        { timeout: 90000 }
      );
      setCoverLetter(data.coverLetter);
    } catch (e: any) {
      if (!e?.response) {
        setError('Server is warming up. Wait 10 seconds and tap Generate again.');
      } else {
        const msg = e?.response?.data?.message ?? e?.response?.data?.error;
        setError(msg ?? 'Generation failed. Try again.');
      }
    } finally {
      clearTimeout(warmupTimer);
      setShowWarmup(false);
      setIsLoading(false);
    }
  }

  const jobTitle = selectedJob?.title ?? `Job #${params.jobId}`;
  const jobCompany = selectedJob?.company ?? '';
  const jColor = jobCompany ? companyColor(jobCompany) : colors.primary;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebPageContainer maxWidth={720} style={{ gap: 12 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="document-text" size={28} color="#fff" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Cover Letter</Text>
            <Text style={styles.heroSub}>AI writes a tailored letter in seconds</Text>
          </View>
        </View>

        {/* Job context */}
        <View style={styles.jobCard}>
          <View style={[styles.jobIcon, { backgroundColor: jColor + '18', borderColor: jColor + '30' }]}>
            <Text style={[styles.jobInitial, { color: jColor }]}>
              {jobCompany ? jobCompany[0].toUpperCase() : 'J'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle} numberOfLines={1}>{jobTitle}</Text>
            {jobCompany ? <Text style={styles.jobCompany}>{jobCompany}</Text> : null}
          </View>
          <View style={styles.aiChip}>
            <Ionicons name="sparkles" size={12} color='#7C3AED' />
            <Text style={styles.aiChipText}>AI</Text>
          </View>
        </View>

        {!coverLetter && (
          <>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Ionicons name="document-attach-outline" size={14} color={colors.primary} />
                <Text style={styles.cardTitle}>Select Resume</Text>
              </View>
              <Text style={styles.cardHint}>Only analyzed resumes can generate a cover letter</Text>
              <ResumeDropdown
                resumes={parsedResumes}
                selectedId={selectedResumeId}
                onSelect={setSelectedResumeId}
                loading={resumesLoading}
              />
            </View>

            {error && (
              <View testID="cover-letter-error" style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              testID="generate-btn"
              style={[styles.generateBtn, (!selectedResumeId || isLoading) && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={!selectedResumeId || isLoading}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.generateBtnText}>Writing your letter…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={18} color="#fff" />
                  <Text style={styles.generateBtnText}>Generate Cover Letter</Text>
                </>
              )}
            </TouchableOpacity>

            {isLoading && (
              <View testID="cover-letter-loading" style={styles.loadingCard}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.loadingHint}>AI is personalising your letter… ~10 seconds</Text>
              </View>
            )}

            {isLoading && showWarmup && (
              <View testID="warmup-message" style={styles.loadingCard}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.loadingHint}>Server warming up — please wait a moment…</Text>
              </View>
            )}

            {/* What to expect */}
            {!isLoading && (
              <View style={styles.expectCard}>
                <View style={styles.expectHead}>
                  <Ionicons name="bulb-outline" size={14} color='#D97706' />
                  <Text style={styles.expectTitle}>What you'll get</Text>
                </View>
                {[
                  'Personalised opening that references the job title',
                  'Highlights your relevant skills from your resume',
                  'Professional closing with a strong call-to-action',
                ].map((t, i) => (
                  <View key={i} style={styles.expectRow}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
                    <Text style={styles.expectText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {coverLetter && (
          <>
            {/* Success banner */}
            <View style={styles.successBanner}>
              <View style={styles.successLeft}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Cover letter ready!</Text>
                <Text style={styles.successSub}>Copy or share before leaving — it's not saved</Text>
              </View>
            </View>

            {/* Cover letter text */}
            <View style={styles.letterCard}>
              <View style={styles.letterHeader}>
                <Text style={styles.letterHeaderText}>Cover Letter</Text>
                <TouchableOpacity
                  testID="copy-btn"
                  style={styles.copyInlineBtn}
                  onPress={() => Share.share({ message: coverLetter })}
                >
                  <Ionicons name="copy-outline" size={15} color={colors.primary} />
                  <Text style={styles.copyInlineBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.letterText} selectable>{coverLetter}</Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => Share.share({ message: coverLetter })}
            >
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Share / Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="regenerate-btn"
              style={styles.regenerateBtn}
              onPress={() => { setCoverLetter(null); setSelectedResumeId(params.resumeId ?? null); handleGenerate(); }}
            >
              <Ionicons name="refresh-outline" size={16} color={colors.primary} />
              <Text style={styles.regenerateBtnText}>Generate Again</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 32 }} />
        </WebPageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 14, gap: 12 },

  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#7C3AED', borderRadius: 18, padding: 18,
  },
  heroIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 3 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  jobCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  jobIcon: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  jobInitial: { fontSize: 18, fontWeight: '900' },
  jobTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  jobCompany: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  aiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  aiChipText: { fontSize: 11, fontWeight: '800', color: '#7C3AED' },

  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  cardHint: { fontSize: 12, color: colors.textMuted },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: colors.error },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 15,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  generateBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  generateBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  loadingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  loadingHint: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },

  expectCard: {
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#FCD34D', gap: 8,
  },
  expectHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expectTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  expectRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  expectText: { flex: 1, fontSize: 13, color: '#78350F', lineHeight: 19 },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#D1FAE5', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#6EE7B7',
  },
  successLeft: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#A7F3D0', alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 15, fontWeight: '800', color: '#065F46' },
  successSub: { fontSize: 12, color: '#047857', marginTop: 2 },

  letterCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  letterHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1, borderBottomColor: '#BFDBFE',
  },
  letterHeaderText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  copyInlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.border,
  },
  copyInlineBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  letterText: {
    fontSize: 14, color: colors.textPrimary, lineHeight: 23,
    padding: 16,
  },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  shareBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  regenerateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: 14,
    paddingVertical: 12, backgroundColor: colors.surface,
  },
  regenerateBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  });
}