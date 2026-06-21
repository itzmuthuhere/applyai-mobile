import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, SafeAreaView,
} from 'react-native';
import ResumeDropdown from '../../components/common/ResumeDropdown';
import { useRoute, useNavigation, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { ResumeStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { addResume, setResumes } from '../../store/slices/resumeSlice';
import { Resume, TailoredResumeResponse } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<ResumeStackParamList, 'TailorResume'>;
type Nav = NativeStackNavigationProp<ResumeStackParamList, 'TailorResume'>;

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

export default function TailorResumeScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const selectedJob = useSelector((s: RootState) => s.job.selected);
  const resumes = useSelector((s: RootState) => s.resume.list);

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(params.resumeId ?? null);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TailoredResumeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedResumes = resumes.filter((r) => r.isParsed);

  useEffect(() => {
    if (resumes.length === 0) loadResumes();
  }, []);

  useEffect(() => {
    if (selectedResumeId !== null && resumes.length > 0) {
      const isParsed = parsedResumes.some((r) => r.id === selectedResumeId);
      if (!isParsed) setSelectedResumeId(null);
    }
  }, [resumes]);

  async function loadResumes() {
    setResumesLoading(true);
    try {
      const { data } = await apiClient.get<Resume[]>(API_ENDPOINTS.RESUMES);
      dispatch(setResumes(data));
    } catch {}
    finally { setResumesLoading(false); }
  }

  async function handleTailor() {
    if (!selectedResumeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<TailoredResumeResponse>(
        API_ENDPOINTS.TAILOR,
        { resumeId: selectedResumeId, jobId: params.jobId }
      );
      setResult(data);
      dispatch(addResume({
        id: data.newResumeId,
        versionName: data.versionName,
        fileUrl: '',
        aiScore: null,
        isOriginal: false,
        isParsed: true,
        createdAt: new Date().toISOString(),
      }));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.response?.data?.error ?? 'Tailoring failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const jobTitle = selectedJob?.title ?? `Job #${params.jobId}`;
  const jobCompany = selectedJob?.company ?? '';
  const jColor = jobCompany ? companyColor(jobCompany) : COLORS.primary;
  const noJob = !params.jobId;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="color-wand" size={28} color="#fff" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Tailor Resume</Text>
            <Text style={styles.heroSub}>AI rewrites your resume to match this role</Text>
          </View>
        </View>

        {/* Job context */}
        {noJob ? (
          <View style={styles.noJobBanner}>
            <Ionicons name="warning-outline" size={16} color='#D97706' />
            <Text style={styles.noJobText}>
              No job selected — open a job and tap "Tailor Resume" from there.
            </Text>
          </View>
        ) : (
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
              <Ionicons name="color-wand" size={12} color={COLORS.primary} />
              <Text style={styles.aiChipText}>AI Tailor</Text>
            </View>
          </View>
        )}

        {!result && (
          <>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Select Resume to Tailor</Text>
              </View>
              <Text style={styles.cardHint}>Only analyzed resumes can be tailored for a role</Text>
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
              style={[styles.tailorBtn, (!selectedResumeId || !params.jobId || isLoading) && styles.tailorBtnDisabled]}
              onPress={handleTailor}
              disabled={!selectedResumeId || !params.jobId || isLoading}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.tailorBtnText}>AI is rewriting your resume…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="color-wand-outline" size={18} color="#fff" />
                  <Text style={styles.tailorBtnText}>Tailor Resume with AI</Text>
                </>
              )}
            </TouchableOpacity>

            {isLoading && (
              <View style={styles.loadingCard}>
                <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.loadingHint}>Rewriting your resume for this role… ~15 seconds</Text>
              </View>
            )}

            {/* How it works */}
            {!isLoading && (
              <View style={styles.howCard}>
                <View style={styles.howHead}>
                  <Ionicons name="information-circle-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.howTitle}>How it works</Text>
                </View>
                {[
                  { step: '1', text: 'AI reads the job description keywords and requirements' },
                  { step: '2', text: 'Rewrites your bullet points to match the role' },
                  { step: '3', text: 'Saves the tailored version as a new resume copy' },
                ].map((item) => (
                  <View key={item.step} style={styles.howRow}>
                    <View style={styles.howStepDot}>
                      <Text style={styles.howStepNum}>{item.step}</Text>
                    </View>
                    <Text style={styles.howText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {result && (
          <>
            {/* Success banner */}
            <View style={styles.successBanner}>
              <View style={styles.successLeft}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Resume tailored successfully!</Text>
                <Text style={styles.successSub}>A new version has been saved to your resume library</Text>
              </View>
            </View>

            {/* New version card */}
            <View style={styles.versionCard}>
              <View style={styles.versionIconBox}>
                <Ionicons name="document-text" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.versionLabel}>New Version Created</Text>
                <Text style={styles.versionName}>{result.versionName}</Text>
              </View>
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark" size={12} color={COLORS.success} />
                <Text style={styles.savedBadgeText}>Saved</Text>
              </View>
            </View>

            {/* Changes made */}
            {result.changes.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Ionicons name="git-compare-outline" size={14} color='#059669' />
                  <Text style={[styles.cardTitle, { color: '#065F46' }]}>Changes Made</Text>
                </View>
                {result.changes.map((change, i) => (
                  <View key={i} style={styles.changeRow}>
                    <View style={styles.changeDot} />
                    <Text style={styles.changeText}>{change}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tailored content */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Ionicons name="document-outline" size={14} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Tailored Content</Text>
                <TouchableOpacity
                  style={styles.copyInlineBtn}
                  onPress={() => Share.share({ message: result.tailoredText })}
                >
                  <Ionicons name="copy-outline" size={13} color={COLORS.primary} />
                  <Text style={styles.copyInlineBtnText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.tailoredText} selectable>{result.tailoredText}</Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => Share.share({ message: result.tailoredText })}
            >
              <Ionicons name="share-outline" size={18} color={COLORS.primary} />
              <Text style={styles.shareBtnText}>Share / Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'ResumeTab' }))}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.doneBtnText}>View My Resumes</Text>
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
    backgroundColor: COLORS.primary, borderRadius: 18, padding: 18,
  },
  heroIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 3 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  noJobBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  noJobText: { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '500' },

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
    backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  aiChipText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  cardHint: { fontSize: 12, color: COLORS.textMuted },
  copyInlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, backgroundColor: COLORS.background,
  },
  copyInlineBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error },

  tailorBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  tailorBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  tailorBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  loadingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  loadingHint: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

  howCard: {
    backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE', gap: 10,
  },
  howHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  howTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howStepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  howStepNum: { fontSize: 11, fontWeight: '900', color: '#fff' },
  howText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 19 },

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

  versionCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  versionIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  versionLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  versionName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  savedBadgeText: { fontSize: 11, fontWeight: '700', color: '#065F46' },

  changeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  changeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669', marginTop: 7, flexShrink: 0 },
  changeText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  tailoredText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 21 },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 12, backgroundColor: COLORS.surface,
  },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
