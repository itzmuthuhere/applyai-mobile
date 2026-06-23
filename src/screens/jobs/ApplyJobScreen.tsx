import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, SafeAreaView, Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { JobsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setResumes } from '../../store/slices/resumeSlice';
import { addApplication } from '../../store/slices/applicationSlice';
import { Resume, Application } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import ResumeDropdown from '../../components/common/ResumeDropdown';

type RouteProps = RouteProp<JobsStackParamList, 'ApplyJob'>;
type Nav = NativeStackNavigationProp<JobsStackParamList, 'ApplyJob'>;

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

export default function ApplyJobScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const selectedJob = useSelector((s: RootState) => s.job.selected);
  const resumes = useSelector((s: RootState) => s.resume.list);

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumesLoading, setResumesLoading] = useState(resumes.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarmup, setShowWarmup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { if (resumes.length === 0) loadResumes(); }, []);
  useEffect(() => { setError(null); setSubmitted(false); }, [params.jobId]);

  async function loadResumes() {
    setResumesLoading(true);
    try {
      const { data } = await apiClient.get<Resume[]>(API_ENDPOINTS.RESUMES);
      dispatch(setResumes(data));
    } catch {}
    finally { setResumesLoading(false); }
  }

  async function handleApply() {
    if (!selectedResumeId) return;
    setIsSubmitting(true);
    setError(null);
    const warmupTimer = setTimeout(() => setShowWarmup(true), 5000);
    try {
      const body: Record<string, unknown> = { jobId: params.jobId, resumeId: selectedResumeId };
      if (coverLetter.trim()) body.coverLetter = coverLetter.trim();
      const { data } = await apiClient.post<Application>(API_ENDPOINTS.APPLICATIONS_APPLY, body, { timeout: 60000 });
      dispatch(addApplication(data));
      setSubmitted(true);
    } catch (e: any) {
      const status = e?.response?.status;
      const serverMsg: string | undefined = e?.response?.data?.error ?? e?.response?.data?.message;
      if (status === 409) {
        setSubmitted(true);
      } else if (!e?.response) {
        try {
          const { data: apps } = await apiClient.get<Application[]>(API_ENDPOINTS.APPLICATIONS);
          if (apps.some(a => a.job.id === params.jobId)) { setSubmitted(true); return; }
        } catch {}
        setError('Server is warming up — your application may already be submitted. Check the Applications tab or tap Submit again.');
      } else if (serverMsg) {
        setError(serverMsg);
      } else {
        setError('Failed to submit application. Please try again.');
      }
    } finally {
      clearTimeout(warmupTimer);
      setShowWarmup(false);
      setIsSubmitting(false);
    }
  }

  const jobTitle = selectedJob?.title ?? `Job #${params.jobId}`;
  const jobCompany = selectedJob?.company ?? '';
  const jColor = jobCompany ? companyColor(jobCompany) : COLORS.primary;

  // ── Loading Guard ─────────────────────────────────────────────────────────
  if (resumesLoading && resumes.length === 0) {
    return (
      <SafeAreaView testID="apply-loading" style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Success State ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView testID="apply-success" style={styles.safe}>
        <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          {/* Success illustration */}
          <View style={styles.successBurst}>
            <View style={[styles.successRing2, { backgroundColor: '#D1FAE5' }]} />
            <View style={[styles.successRing1, { backgroundColor: '#A7F3D0' }]} />
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={44} color="#fff" />
            </View>
          </View>

          <Text style={styles.successTitle}>Application Sent!</Text>
          <Text style={styles.successSub}>
            Your application for{' '}
            <Text style={styles.successJobName}>{jobTitle}</Text>
            {jobCompany ? ` at ${jobCompany}` : ''}
            {'\n'}has been submitted successfully.
          </Text>

          {/* What happens next */}
          <View style={styles.nextCard}>
            <View style={styles.nextHead}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.nextTitle}>What happens next?</Text>
            </View>
            {[
              { icon: 'eye-outline' as const, text: 'The recruiter reviews your application' },
              { icon: 'mail-outline' as const, text: 'You\'ll receive a status update in the app' },
              { icon: 'calendar-outline' as const, text: 'Track progress in My Applications' },
            ].map((item, i) => (
              <View key={i} style={styles.nextRow}>
                <View style={styles.nextIconBox}>
                  <Ionicons name={item.icon} size={14} color={COLORS.primary} />
                </View>
                <Text style={styles.nextText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.viewAppsBtn}
            onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'ApplicationsTab' }))}
            activeOpacity={0.85}
          >
            <Ionicons name="list-outline" size={18} color="#fff" />
            <Text style={styles.viewAppsBtnText}>View My Applications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToJobsBtn}
            onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'JobsTab' }))}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={16} color={COLORS.primary} />
            <Text style={styles.backToJobsText}>Continue Browsing Jobs</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Job context hero */}
        <View style={styles.jobHero}>
          <View style={[styles.jobIcon, { backgroundColor: jColor + '18', borderColor: jColor + '30' }]}>
            <Text style={[styles.jobInitial, { color: jColor }]}>
              {jobCompany ? jobCompany[0].toUpperCase() : 'J'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle} numberOfLines={2}>{jobTitle}</Text>
            {jobCompany ? <Text style={styles.jobCompany}>{jobCompany}</Text> : null}
          </View>
          <View style={styles.applyChip}>
            <Ionicons name="send" size={11} color={COLORS.primary} />
            <Text style={styles.applyChipText}>Apply</Text>
          </View>
        </View>

        {/* Resume section */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIconBox, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="document-attach-outline" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>Select Resume</Text>
          </View>
          <Text style={styles.sectionHint}>Only analyzed resumes are available. Upload and parse a resume first if none appear.</Text>
          <ResumeDropdown
            resumes={resumes.filter(r => r.isParsed)}
            selectedId={selectedResumeId}
            onSelect={id => { setSelectedResumeId(id); setError(null); }}
            loading={resumesLoading}
            placeholder="Choose a resume…"
          />

          {/* AI tip */}
          {selectedResumeId && (
            <TouchableOpacity
              style={styles.aiTip}
              onPress={() => navigation.navigate('TailorResume', { jobId: params.jobId })}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles-outline" size={14} color="#7C3AED" />
              <Text style={styles.aiTipText}>
                Boost your chances — <Text style={{ fontWeight: '800' }}>Tailor this resume</Text> to the job first
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#7C3AED" />
            </TouchableOpacity>
          )}
        </View>

        {/* Cover letter section */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="document-text-outline" size={14} color="#7C3AED" />
            </View>
            <Text style={styles.sectionTitle}>Cover Letter <Text style={styles.optional}>(optional)</Text></Text>
          </View>
          <TextInput
            testID="cover-letter-input"
            style={styles.textArea}
            placeholder="Paste or write your cover letter here…&#10;&#10;Tip: Use our AI Cover Letter generator for a personalised letter."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            value={coverLetter}
            onChangeText={setCoverLetter}
          />
          {!coverLetter && (
            <TouchableOpacity
              style={styles.generateCoverLetterBtn}
              onPress={() => navigation.navigate('CoverLetter', { jobId: params.jobId })}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles-outline" size={14} color="#7C3AED" />
              <Text style={styles.generateCoverLetterText}>Generate AI Cover Letter</Text>
              <Ionicons name="arrow-forward" size={14} color="#7C3AED" />
            </TouchableOpacity>
          )}
        </View>

        {/* Error */}
        {error && (
          <View testID="apply-error" style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          testID="apply-submit-btn"
          style={[styles.submitBtn, (!selectedResumeId || isSubmitting) && styles.submitBtnDisabled]}
          onPress={handleApply}
          disabled={!selectedResumeId || isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitBtnText}>Submitting…</Text>
            </>
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Application</Text>
            </>
          )}
        </TouchableOpacity>

        {isSubmitting && showWarmup && (
          <View testID="warmup-message" style={styles.submittingNote}>
            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.submittingNoteText}>Server is warming up — this may take up to 30 seconds</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 14 },

  // Job hero
  jobHero: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  jobIcon: {
    width: 48, height: 48, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  jobInitial: { fontSize: 20, fontWeight: '900' },
  jobTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 20 },
  jobCompany: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  applyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  applyChipText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },

  // Sections
  section: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  sectionHint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  optional: { fontSize: 12, fontWeight: '400', color: COLORS.textMuted },

  // AI tip
  aiTip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F3FF', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#EDE9FE',
  },
  aiTipText: { flex: 1, fontSize: 12, color: '#5B21B6', lineHeight: 17 },

  // Text area
  textArea: {
    backgroundColor: COLORS.background, borderRadius: 12, padding: 14,
    fontSize: 14, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border,
    minHeight: 130, textAlignVertical: 'top',
  },
  generateCoverLetterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F3FF', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#EDE9FE',
  },
  generateCoverLetterText: { flex: 1, fontSize: 13, color: '#5B21B6', fontWeight: '700' },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  submittingNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
  },
  submittingNoteText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },

  // Success
  successScroll: { flex: 1, alignItems: 'center', padding: 32, gap: 20 },
  successBurst: { alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 8 },
  successRing2: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
  successRing1: { position: 'absolute', width: 110, height: 110, borderRadius: 55 },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, marginTop: 70 },
  successSub: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23 },
  successJobName: { fontWeight: '800', color: COLORS.textPrimary },

  nextCard: {
    backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#BFDBFE', alignSelf: 'stretch', gap: 10,
  },
  nextHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  nextTitle: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextIconBox: { width: 26, height: 26, borderRadius: 7, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nextText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 19 },

  viewAppsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14,
    alignSelf: 'stretch',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  viewAppsBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  backToJobsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 12, alignSelf: 'stretch',
    borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.surface,
  },
  backToJobsText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
