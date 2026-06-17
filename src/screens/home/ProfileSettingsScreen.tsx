import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { COLORS, ROUTES, API_ENDPOINTS } from '../../constants';
import { signOut } from '../../store/slices/authSlice';
import { Resume, User } from '../../types/api.types';
import apiClient from '../../api/apiClient';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

export default function ProfileSettingsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const user = useSelector((s: RootState) => s.auth.user);

  const [profile, setProfile] = useState<User | null>(null);
  const [skills, setSkills] = useState(user?.skills ?? '');
  const [savingSkills, setSavingSkills] = useState(false);
  const [loadingCareerPath, setLoadingCareerPath] = useState(false);

  useEffect(() => {
    apiClient.get<User>(API_ENDPOINTS.AUTH_ME)
      .then(r => {
        setProfile(r.data);
        setSkills(r.data.skills ?? '');
      })
      .catch(() => setProfile(user));
  }, []);

  const displayUser = profile ?? user;

  async function handleSaveSkills() {
    setSavingSkills(true);
    try {
      await apiClient.put(API_ENDPOINTS.PROFILE_UPDATE, { skills: skills.trim() });
      Alert.alert('Saved', 'Skills updated.');
      if (profile) setProfile({ ...profile, skills: skills.trim() });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save skills.');
    } finally {
      setSavingSkills(false);
    }
  }

  async function handleCareerPath() {
    setLoadingCareerPath(true);
    try {
      const { data } = await apiClient.get<Resume[]>(API_ENDPOINTS.RESUMES);
      const parsed = data.find(r => r.isParsed && r.isOriginal) ?? data[0];
      if (!parsed) {
        Alert.alert('No resume', 'Upload and parse a resume first.');
        return;
      }
      navigation.navigate('CareerPath', { resumeId: parsed.id });
    } catch {
      Alert.alert('Error', 'Could not load resumes.');
    } finally {
      setLoadingCareerPath(false);
    }
  }

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => dispatch(signOut()) },
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: 'bar-chart-outline', label: 'Analytics', onPress: () => navigation.navigate('Analytics') },
    { icon: 'cash-outline', label: 'Salary Intelligence', onPress: () => navigation.navigate('SalaryIntel') },
    { icon: 'trending-up-outline', label: 'Negotiation Coach', onPress: () => navigation.navigate('NegotiationCoach') },
    { icon: 'ban-outline', label: 'Company Blacklist', onPress: () => navigation.navigate('Blacklist') },
    { icon: 'diamond-outline', label: 'Upgrade Plan', onPress: () => navigation.navigate('Paywall', {}) },
    { icon: 'log-out-outline', label: 'Log Out', onPress: handleLogout, color: COLORS.error },
  ];

  const score = displayUser?.completenessScore ?? 0;
  const hints = displayUser?.completenessHints ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Ionicons name="person-circle-outline" size={72} color={COLORS.primary} />
          <Text style={styles.name}>{displayUser?.name ?? 'User'}</Text>
          <Text style={styles.email}>{displayUser?.email ?? ''}</Text>
        </View>

        {/* Profile completeness */}
        <View style={styles.completenessCard}>
          <View style={styles.completenessHeader}>
            <Text style={styles.completenessLabel}>Profile Completeness</Text>
            <Text style={styles.completenessScore}>{score}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${score}%` as any }]} />
          </View>
          {hints.length > 0 && (
            <View style={styles.hintsList}>
              {hints.map((hint, i) => (
                <View key={i} style={styles.hintRow}>
                  <Ionicons name="chevron-forward-circle-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.hintText}>{hint}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Plan card */}
        <View style={styles.planCard}>
          <Ionicons name="flash-outline" size={20} color={COLORS.warning} />
          <Text style={styles.planText}>{displayUser?.subscriptionPlan ?? 'Free'} Plan</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Paywall', {})}>
            <Text style={styles.upgradeLink}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* Skills */}
        <View style={styles.skillsCard}>
          <Text style={styles.skillsTitle}>My Skills</Text>
          <TextInput
            style={styles.skillsInput}
            placeholder="Java, Spring Boot, React Native…"
            value={skills}
            onChangeText={setSkills}
            multiline
            numberOfLines={3}
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity
            style={[styles.skillsBtn, savingSkills && styles.skillsBtnDisabled]}
            onPress={handleSaveSkills}
            disabled={savingSkills}
          >
            {savingSkills
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.skillsBtnText}>Save Skills</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Career Path */}
        <TouchableOpacity style={styles.careerBtn} onPress={handleCareerPath} disabled={loadingCareerPath}>
          {loadingCareerPath
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Ionicons name="rocket-outline" size={20} color="#fff" />
                <View style={styles.careerBtnText}>
                  <Text style={styles.careerBtnTitle}>View Career Path</Text>
                  <Text style={styles.careerBtnSub}>AI-generated roadmap for your next role</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </>
          }
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuDivider]}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={20} color={item.color ?? COLORS.textSecondary} />
              <Text style={[styles.menuLabel, item.color ? { color: item.color } : {}]}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version}>ApplyAI v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, gap: 14 },

  avatar: { alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 },
  email: { fontSize: 14, color: COLORS.textSecondary },

  completenessCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  completenessHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completenessLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  completenessScore: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  progressTrack: {
    height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
  hintsList: { gap: 6 },
  hintRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  hintText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },

  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  planText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  upgradeLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  skillsCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  skillsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  skillsInput: {
    backgroundColor: COLORS.background, borderRadius: 10, padding: 12,
    fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
    minHeight: 72, textAlignVertical: 'top',
  },
  skillsBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 11,
    alignItems: 'center',
  },
  skillsBtnDisabled: { opacity: 0.6 },
  skillsBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  careerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.secondary, borderRadius: 14, padding: 16,
  },
  careerBtnText: { flex: 1 },
  careerBtnTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  careerBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  menuCard: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary },

  version: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});
