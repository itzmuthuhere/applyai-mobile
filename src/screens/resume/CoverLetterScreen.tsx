import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, SafeAreaView,
} from 'react-native';
import ResumeDropdown from '../../components/common/ResumeDropdown';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { ResumeStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setResumes } from '../../store/slices/resumeSlice';
import { Resume, CoverLetterResponse } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<ResumeStackParamList, 'CoverLetter'>;

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

export default function CoverLetterScreen() {
  const { params } = useRoute<RouteProps>();
  const dispatch = useDispatch();

  const selectedJob = useSelector((s: RootState) => s.job.selected);
  const resumes = useSelector((s: RootState) => s.resume.list);

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(params.resumeId ?? null);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedResumes = resumes.filter((r) => r.isParsed);

  useEffect(() => {
    if (resumes.length === 0) loadResumes();
  }, []);

  async function loadResumes() {
    setResumesLoading(true);
    try {
      const { data } = await apiClient.get<Resume[]>(API_ENDPOINTS.RESUMES);
      dispatch(setResumes(data));
    } catch {}
    finally { setResumesLoading(false); }
  }

  async function handleGenerate() {
    if (!selectedResumeId) return;
    setIsLoading(true);
    setError(null);
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
      setIsLoading(false);
    }
  }

  const jobTitle = selectedJob?.title ?? `Job #${params.jobId}`;
  const jobCompany = selectedJob?.company ?? '';
  const jColor = jobCompany ? companyColor(jobCompany) : COLORS.primary;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>

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
                <Ionicons name="document-attach-outline" size={14} color={COLORS.primary} />
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
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
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
              <View style={styles.loadingCard}>
                <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.loadingHint}>AI is personalising your letter… ~10 seconds</Text>
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
                    <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.primary} />
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
                <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
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
                  style={styles.copyInlineBtn}
                  onPress={() => Share.share({ message: coverLetter })}
                >
                  <Ionicons name="copy-outline" size={15} color={COLORS.primary} />
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
              style={styles.regenerateBtn}
              onPress={() => { setCoverLetter(null); setSelectedResumeId(params.resumeId ?? null); }}
            >
              <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
              <Text style={styles.regenerateBtnText}>Generate Again</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
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
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  jobIcon: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  jobInitial: { fontSize: 18, fontWeight: '900' },
  jobTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  jobCompany: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  aiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EDE9FE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  aiChipText: { fontSize: 11, fontWeight: '800', color: '#7C3AED' },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  cardHint: { fontSize: 12, color: COLORS.textMuted },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error },

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
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  loadingHint: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

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
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  letterHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.primaryLight,
    borderBottomWidth: 1, borderBottomColor: '#BFDBFE',
  },
  letterHeaderText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  copyInlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.border,
  },
  copyInlineBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  letterText: {
    fontSize: 14, color: COLORS.textPrimary, lineHeight: 23,
    padding: 16,
  },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  shareBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  regenerateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 12, backgroundColor: COLORS.surface,
  },
  regenerateBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
