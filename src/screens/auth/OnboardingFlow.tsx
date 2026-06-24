import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/apiClient';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { AppDispatch } from '../../store';

type Step = 'upload' | 'parsing' | 'parsed' | 'scoring' | 'scored' | 'done';

function LoadingStep({ label }: { label: string }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <View style={styles.loadingIconBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.loadingTitle}>{label}</Text>
        <Text style={styles.loadingHint}>Hang tight — AI is working its magic</Text>
        <View style={styles.loadingSteps}>
          {['Reading your resume', 'Extracting skills & experience', 'Generating your score'].map((s, i) => (
            <View key={i} style={styles.loadingStep}>
              <View style={[styles.loadingStepDot, { backgroundColor: colors.primary + (i === 0 ? 'FF' : '60') }]} />
              <Text style={styles.loadingStepText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function OnboardingFlow() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<Step>('upload');
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const handlePickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      setFileName(file.name ?? 'resume.pdf');
      const form = new FormData();
      form.append('file', { uri: file.uri, name: file.name, type: 'application/pdf' } as any);

      setStep('parsing');
      const uploadRes = await apiClient.post(API_ENDPOINTS.RESUME_UPLOAD, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const rid = uploadRes.data.id;
      setResumeId(rid);

      await apiClient.post(API_ENDPOINTS.RESUME_PARSE, { resumeId: rid });
      setStep('parsed');

      setStep('scoring');
      const scoreRes = await apiClient.post(API_ENDPOINTS.RESUME_SCORE, { resumeId: rid });
      setScore(scoreRes.data.score);
      setStrengths(scoreRes.data.strengths ?? []);
      setImprovements(scoreRes.data.improvements ?? []);
      setStep('scored');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Something went wrong');
      setStep('upload');
    }
  };

  if (step === 'parsing' || step === 'scoring') {
    return (
      <LoadingStep
        label={step === 'parsing' ? 'Parsing your resume…' : 'Scoring your resume…'}
      />
    );
  }

  if (step === 'scored' || step === 'done') {
    const sc = score ?? 0;
    const sColor = sc >= 70 ? colors.success : sc >= 50 ? colors.warning : colors.error;
    const sBg = sc >= 70 ? '#D1FAE5' : sc >= 50 ? '#FEF3C7' : '#FEE2E2';
    const sLabel = sc >= 80 ? 'Excellent' : sc >= 65 ? 'Good' : sc >= 50 ? 'Average' : 'Needs Work';

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.scoreScroll}>
          {/* Hero */}
          <View style={[styles.scoreHero, { backgroundColor: sColor }]}>
            <View style={styles.scoreRingOuter}>
              <View style={[styles.scoreRingInner, { borderColor: sColor + '60' }]}>
                <View style={[styles.scoreCircle, { borderColor: sColor }]}>
                  <Text style={[styles.scoreNum, { color: sColor }]}>{sc}</Text>
                  <Text style={[styles.scoreOutOf, { color: sColor }]}>/100</Text>
                </View>
              </View>
            </View>
            <Text style={styles.scoreGrade}>{sLabel}</Text>
            <Text style={styles.scoreSubtitle}>AI Resume Score</Text>
          </View>

          {/* File info */}
          {fileName ? (
            <View style={styles.fileRow}>
              <View style={styles.fileIconBox}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <Text style={styles.fileNameText} numberOfLines={1}>{fileName}</Text>
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.uploadedText}>Uploaded</Text>
              </View>
            </View>
          ) : null}

          {/* Strengths */}
          {strengths.length > 0 && (
            <View style={[styles.resultCard, { borderLeftColor: colors.success }]}>
              <View style={styles.resultCardHead}>
                <View style={[styles.resultCardIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="thumbs-up" size={16} color={colors.success} />
                </View>
                <Text style={styles.resultCardTitle}>Your Strengths</Text>
              </View>
              {strengths.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.resultRow}>
                  <View style={[styles.resultDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.resultText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Improvements */}
          {improvements.length > 0 && (
            <View style={[styles.resultCard, { borderLeftColor: colors.warning }]}>
              <View style={styles.resultCardHead}>
                <View style={[styles.resultCardIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="trending-up" size={16} color={colors.warning} />
                </View>
                <Text style={styles.resultCardTitle}>Quick Wins</Text>
              </View>
              {improvements.slice(0, 3).map((s, i) => (
                <View key={i} style={styles.resultRow}>
                  <View style={[styles.resultDot, { backgroundColor: colors.warning }]} />
                  <Text style={styles.resultText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Next steps */}
          <View style={styles.nextCard}>
            <Text style={styles.nextTitle}>What's next?</Text>
            {[
              { icon: 'briefcase-outline' as const, text: 'Browse AI-matched jobs' },
              { icon: 'color-wand-outline' as const, text: 'Tailor your resume for a job' },
              { icon: 'mic-outline' as const, text: 'Practice mock interviews' },
            ].map((item, i) => (
              <View key={i} style={styles.nextRow}>
                <View style={styles.nextIconBox}>
                  <Ionicons name={item.icon} size={16} color={colors.primary} />
                </View>
                <Text style={styles.nextRowText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.dashBtn} onPress={() => navigation.replace('Main')}>
            <Ionicons name="home-outline" size={18} color="#fff" />
            <Text style={styles.dashBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  // Upload step
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.uploadScreen}>
        {/* Header */}
        <View style={styles.uploadHeader}>
          <View style={styles.uploadHeaderBadge}>
            <Text style={styles.uploadHeaderBadgeText}>Step 1 of 1</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.replace('Main')} style={styles.skipLink}>
            <Text style={styles.skipLinkText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.uploadHero}>
          <View style={styles.uploadHeroIconBg}>
            <View style={styles.uploadHeroIconFg}>
              <Ionicons name="cloud-upload" size={36} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.uploadTitle}>Upload Your Resume</Text>
          <Text style={styles.uploadSubtitle}>
            Get an instant AI score, skill breakdown, and personalized tips — in under 15 seconds.
          </Text>
        </View>

        {/* What you'll get */}
        <View style={styles.whatYouGetCard}>
          <Text style={styles.whatYouGetTitle}>What you'll get instantly</Text>
          {[
            { icon: 'analytics-outline' as const, color: colors.primary, text: 'ATS score (0–100)' },
            { icon: 'code-slash-outline' as const, color: '#059669', text: 'Skills & tech stack detected' },
            { icon: 'trending-up-outline' as const, color: colors.warning, text: 'Personalized improvement tips' },
          ].map((item, i) => (
            <View key={i} style={styles.whatRow}>
              <View style={[styles.whatIconBox, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <Text style={styles.whatText}>{item.text}</Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.uploadBtn} onPress={handlePickResume} activeOpacity={0.85}>
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.uploadBtnText}>Upload Resume (PDF)</Text>
        </TouchableOpacity>

        <Text style={styles.uploadHint}>PDF only · Max 5 MB · Secure & private</Text>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 16,
  },
  loadingIconBox: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  loadingTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  loadingHint: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  loadingSteps: { width: '100%', gap: 8, marginTop: 8 },
  loadingStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingStepDot: { width: 7, height: 7, borderRadius: 4 },
  loadingStepText: { fontSize: 14, color: colors.textSecondary },

  // Score screen
  scoreScroll: { flex: 1, paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  scoreHero: {
    borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24,
    alignItems: 'center', gap: 10,
  },
  scoreRingOuter: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  scoreRingInner: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 5, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  scoreOutOf: { fontSize: 11, fontWeight: '600' },
  scoreGrade: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  scoreSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  fileIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  fileNameText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  uploadedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  uploadedText: { fontSize: 12, color: colors.success, fontWeight: '600' },

  resultCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, gap: 10,
  },
  resultCardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultCardIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  resultCardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  resultDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  resultText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  nextCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  nextTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextIconBox: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  nextRowText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },

  dashBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  dashBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Upload screen
  uploadScreen: { flex: 1, padding: 20, gap: 20 },
  uploadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  uploadHeaderBadge: {
    backgroundColor: colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  uploadHeaderBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  skipLink: { paddingHorizontal: 8, paddingVertical: 6 },
  skipLinkText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },

  uploadHero: { alignItems: 'center', gap: 12, marginTop: 16 },
  uploadHeroIconBg: {
    width: 110, height: 110, borderRadius: 30,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  uploadHeroIconFg: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  uploadTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', letterSpacing: -0.3 },
  uploadSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  whatYouGetCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  whatYouGetTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  whatRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  whatIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  whatText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 17,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  uploadBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  uploadHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  });
}