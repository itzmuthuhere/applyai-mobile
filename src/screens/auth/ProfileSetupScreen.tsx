import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, SafeAreaView, Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { RootState } from '../../store';
import { setAuth } from '../../store/slices/authSlice';
import { FullProfile, RemotePreference } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import WebPageContainer from '../../components/common/WebPageContainer';

const REMOTE_OPTIONS: { value: RemotePreference; label: string }[] = [
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ONSITE', label: 'Onsite' },
  { value: 'ANY', label: 'Any' },
];

export default function ProfileSetupScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const dispatch = useDispatch();
  const jwt = useSelector((s: RootState) => s.auth.jwt);
  const userName = useSelector((s: RootState) => s.auth.user?.name) ?? '';

  const [targetRole, setTargetRole] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [remotePreference, setRemotePreference] = useState<RemotePreference>('ANY');
  const [isSaving, setIsSaving] = useState(false);

  const canSubmit = targetRole.trim().length > 0 && targetLocation.trim().length > 0;

  async function handleContinue() {
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    try {
      const { data } = await apiClient.put<FullProfile>(API_ENDPOINTS.PROFILE, {
        targetRole: targetRole.trim(),
        targetLocation: targetLocation.trim(),
        minSalary: minSalary ? parseInt(minSalary, 10) : undefined,
        remotePreference,
      });
      if (jwt) dispatch(setAuth({ jwt, user: data }));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebPageContainer maxWidth={480}>
          <View style={styles.card}>
            <Text style={styles.title}>
              {userName ? `Hi ${userName.split(' ')[0]}, let's find your next role` : "Let's find your next role"}
            </Text>
            <Text style={styles.subtitle}>
              A few quick details so we can match and auto-apply to the right jobs for you.
            </Text>

            <Text style={styles.label}>Target job role</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Senior Java Developer"
              placeholderTextColor={colors.textMuted}
              value={targetRole}
              onChangeText={setTargetRole}
            />

            <Text style={styles.label}>Preferred location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bengaluru"
              placeholderTextColor={colors.textMuted}
              value={targetLocation}
              onChangeText={setTargetLocation}
            />

            <Text style={styles.label}>Minimum salary (₹/yr, optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1200000"
              placeholderTextColor={colors.textMuted}
              value={minSalary}
              onChangeText={setMinSalary}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Work preference</Text>
            <View style={styles.pillRow}>
              {REMOTE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  testID={`remote-pref-${opt.value}`}
                  style={[styles.pill, remotePreference === opt.value && styles.pillActive]}
                  onPress={() => setRemotePreference(opt.value)}
                >
                  <Text style={[styles.pillText, remotePreference === opt.value && styles.pillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              testID="profile-setup-continue-btn"
              style={[styles.continueBtn, (!canSubmit || isSaving) && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!canSubmit || isSaving}
            >
              {isSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.continueBtnText}>Continue</Text>}
            </TouchableOpacity>
          </View>
        </WebPageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    card: {
      backgroundColor: colors.surface, borderRadius: 18, padding: 24,
      borderWidth: 1, borderColor: colors.border,
    },
    title: { fontSize: 19, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
    subtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, marginTop: 12 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 13, paddingVertical: 11, fontSize: 14,
      color: colors.textPrimary, backgroundColor: colors.background,
    },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background,
    },
    pillActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    pillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    pillTextActive: { color: colors.primary },
    continueBtn: {
      marginTop: 24, backgroundColor: colors.primary, borderRadius: 12,
      paddingVertical: 14, alignItems: 'center',
    },
    continueBtnDisabled: { opacity: 0.5 },
    continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
