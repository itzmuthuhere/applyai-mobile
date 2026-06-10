import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/apiClient';
import { API_ENDPOINTS, COLORS } from '../../constants';
import { AppDispatch } from '../../store';

type Step = 'upload' | 'parsing' | 'parsed' | 'scoring' | 'scored' | 'done';

export default function OnboardingFlow() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<Step>('upload');
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);

  const handlePickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
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

  if (step === 'upload') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="document-text-outline" size={80} color={COLORS.primary} />
          <Text style={styles.title}>Welcome to ApplyAI</Text>
          <Text style={styles.subtitle}>Upload your resume to get started. We'll parse it and give you an instant score.</Text>
          <TouchableOpacity style={styles.btn} onPress={handlePickResume}>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.btnText}>Upload Resume (PDF)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Main')}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'parsing' || step === 'scoring') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {step === 'parsing' ? 'Parsing your resume…' : 'Scoring your resume…'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'scored' || step === 'done') {
    const scoreColor = score != null && score >= 70 ? COLORS.secondary : score != null && score >= 50 ? COLORS.warning : COLORS.error;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Resume Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNum, { color: scoreColor }]}>{score}</Text>
            <Text style={styles.scoreLabel}>/100</Text>
          </View>

          {strengths.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Strengths</Text>
              {strengths.map((s, i) => (
                <Text key={i} style={styles.strengthItem}>✓ {s}</Text>
              ))}
            </View>
          )}

          {improvements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Improvements</Text>
              {improvements.map((s, i) => (
                <Text key={i} style={styles.improvItem}>• {s}</Text>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.btn} onPress={() => navigation.replace('Main')}>
            <Text style={styles.btnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginTop: 20, marginBottom: 10 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btn: {
    flexDirection: 'row', gap: 8, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skipBtn: { marginTop: 16 },
  skipText: { color: COLORS.textMuted, fontSize: 14 },
  loadingText: { marginTop: 16, fontSize: 15, color: COLORS.textSecondary },
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.surface,
    borderWidth: 4, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
    marginVertical: 20,
  },
  scoreNum: { fontSize: 42, fontWeight: '800' },
  scoreLabel: { fontSize: 14, color: COLORS.textMuted },
  section: { width: '100%', marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  strengthItem: { fontSize: 13, color: COLORS.secondary, marginBottom: 3 },
  improvItem: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 3 },
});
