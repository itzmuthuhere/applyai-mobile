import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Alert, TextInput, ActivityIndicator, Image,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { setAuth, signOut } from '../../store/slices/authSlice';
import { toggleMode, setAccent } from '../../store/slices/themeSlice';
import { API_ENDPOINTS } from '../../constants';
import { User, RemotePreference } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import { useTheme, useThemeSettings } from '../../theme/ThemeContext';
import { AppColors, AccentColor, ACCENT_PRESETS } from '../../theme/themes';

const REMOTE_OPTIONS: { label: string; value: RemotePreference; icon: string }[] = [
  { label: 'Remote', value: 'REMOTE', icon: 'wifi-outline' },
  { label: 'Hybrid', value: 'HYBRID', icon: 'git-branch-outline' },
  { label: 'Onsite', value: 'ONSITE', icon: 'business-outline' },
  { label: 'Any', value: 'ANY', icon: 'globe-outline' },
];

const SALARY_PRESETS = [
  { label: '₹5L', value: 500_000 },
  { label: '₹8L', value: 800_000 },
  { label: '₹12L', value: 1_200_000 },
  { label: '₹15L', value: 1_500_000 },
  { label: '₹20L', value: 2_000_000 },
  { label: '₹30L', value: 3_000_000 },
  { label: '₹50L', value: 5_000_000 },
];

function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${Math.round(n / 100_000)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function ProfileSettingsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const storeUser = useSelector((s: RootState) => s.auth.user);
  const storeJwt = useSelector((s: RootState) => s.auth.jwt);
  const colors = useTheme();
  const { isDark, accent } = useThemeSettings();
  const styles = makeStyles(colors);

  const [profile, setProfile] = useState<User | null>(storeUser);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCareerPath, setLoadingCareerPath] = useState(false);

  const [name, setName] = useState(storeUser?.name ?? '');
  const [headline, setHeadline] = useState(storeUser?.headline ?? '');
  const [targetRole, setTargetRole] = useState(storeUser?.targetRole ?? '');
  const [targetLocation, setTargetLocation] = useState(storeUser?.targetLocation ?? '');
  const [minSalary, setMinSalary] = useState<number | null>(storeUser?.minSalary ?? null);
  const [remotePreference, setRemotePreference] = useState<RemotePreference | null>(storeUser?.remotePreference ?? null);
  const [skills, setSkills] = useState(storeUser?.skills ?? '');
  const [isHr, setIsHr] = useState(storeUser?.role === 'HR');

  useEffect(() => {
    apiClient.get<User>(API_ENDPOINTS.AUTH_ME)
      .then(r => {
        setProfile(r.data);
        setName(r.data.name ?? '');
        setHeadline(r.data.headline ?? '');
        setTargetRole(r.data.targetRole ?? '');
        setTargetLocation(r.data.targetLocation ?? '');
        setMinSalary(r.data.minSalary ?? null);
        setRemotePreference(r.data.remotePreference ?? null);
        setSkills(r.data.skills ?? '');
        setIsHr(r.data.role === 'HR');
      })
      .catch(() => {});
  }, []);

  const displayUser = profile ?? storeUser;

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: name.trim() || undefined,
        headline: headline.trim() || undefined,
        targetRole: targetRole.trim() || undefined,
        targetLocation: targetLocation.trim() || undefined,
        minSalary: minSalary ?? undefined,
        remotePreference: remotePreference ?? undefined,
        skills: skills.trim() || undefined,
        role: isHr ? 'HR' : 'JOBSEEKER',
      };
      const { data } = await apiClient.put<User>(API_ENDPOINTS.PROFILE_UPDATE, payload);
      setProfile(data);
      if (storeJwt) dispatch(setAuth({ jwt: storeJwt, user: data }));
      setEditMode(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCareerPath() {
    setLoadingCareerPath(true);
    try {
      const { data } = await apiClient.get<any[]>(API_ENDPOINTS.RESUMES);
      const parsed = data.find((r: any) => r.isParsed && r.isOriginal) ?? data[0];
      if (!parsed) { Alert.alert('No resume', 'Upload and parse a resume first.'); return; }
      navigation.navigate('CareerPath', { resumeId: parsed.id });
    } catch {
      Alert.alert('Error', 'Could not load resumes.');
    } finally {
      setLoadingCareerPath(false);
    }
  }

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => dispatch(signOut()) },
    ]);
  };

  const score = displayUser?.completenessScore ?? 0;
  const hints = displayUser?.completenessHints ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={editMode ? handleSave : () => setEditMode(true)} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.headerAction}>{editMode ? 'Save' : 'Edit'}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.coverBanner} />
          <View style={styles.avatarWrapper}>
            {displayUser?.profilePicture ? (
              <Image source={{ uri: displayUser.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{(displayUser?.name ?? 'U').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={[styles.scoreRingSmall, {
              borderColor: score >= 80 ? '#10B981' : score >= 50 ? colors.primary : '#F59E0B',
            }]}>
              <Text style={[styles.scoreRingText, {
                color: score >= 80 ? '#10B981' : score >= 50 ? colors.primary : '#F59E0B',
              }]}>{score}%</Text>
            </View>
          </View>
          <View style={styles.heroInfo}>
            {editMode ? (
              <TextInput style={styles.nameInput} value={name} onChangeText={setName}
                placeholder="Your name" placeholderTextColor={colors.textMuted} />
            ) : (
              <Text style={styles.nameText}>{displayUser?.name ?? 'User'}</Text>
            )}
            {editMode ? (
              <TextInput style={styles.headlineInput} value={headline} onChangeText={setHeadline}
                placeholder="e.g. Senior Java Developer at Bank of America"
                placeholderTextColor={colors.textMuted} maxLength={200} />
            ) : displayUser?.headline ? (
              <Text style={styles.headlineText}>{displayUser.headline}</Text>
            ) : (
              <TouchableOpacity onPress={() => setEditMode(true)}>
                <Text style={styles.addHeadline}>+ Add headline</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.emailText}>{displayUser?.email}</Text>
            {!editMode && (
              <TouchableOpacity style={styles.editInlineBtn} onPress={() => setEditMode(true)}>
                <Ionicons name="pencil-outline" size={13} color={colors.primary} />
                <Text style={styles.editInlineBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Profile Completeness */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Completeness</Text>
            <Text style={[styles.scoreText, score >= 80 && { color: colors.success }]}>{score}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: `${score}%` as any,
              backgroundColor: score >= 80 ? colors.success : colors.primary,
            }]} />
          </View>
          {hints.length > 0 && (
            <View style={styles.hintsList}>
              {hints.slice(0, 3).map((hint, i) => (
                <View key={i} style={styles.hintRow}>
                  <Ionicons name="alert-circle-outline" size={13} color={colors.warning} />
                  <Text style={styles.hintText}>{hint}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Job Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Job Preferences</Text>
          <Field label="Target Role" icon="briefcase-outline" value={targetRole}
            placeholder="e.g. Senior Java Developer" editMode={editMode} onChangeText={setTargetRole} colors={colors} />
          <View style={styles.divider} />
          <Field label="Target Location" icon="location-outline" value={targetLocation}
            placeholder="e.g. Bengaluru, Remote" editMode={editMode} onChangeText={setTargetLocation} colors={colors} />
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.fieldLabel}>Min. Salary</Text>
            <Text style={styles.fieldValue}>{minSalary ? fmt(minSalary) : '—'}</Text>
          </View>
          {editMode && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {SALARY_PRESETS.map(p => (
                <TouchableOpacity key={p.value}
                  style={[styles.presetChip, minSalary === p.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setMinSalary(p.value === minSalary ? null : p.value)}>
                  <Text style={[styles.presetChipText, minSalary === p.value && { color: '#fff', fontWeight: '700' }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Ionicons name="wifi-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.fieldLabel}>Work Mode</Text>
            <Text style={styles.fieldValue}>{remotePreference ?? '—'}</Text>
          </View>
          {editMode && (
            <View style={styles.remoteOptions}>
              {REMOTE_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.value}
                  style={[styles.remoteChip, remotePreference === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setRemotePreference(remotePreference === opt.value ? null : opt.value)}>
                  <Ionicons name={opt.icon as any} size={13}
                    color={remotePreference === opt.value ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.remoteChipText, remotePreference === opt.value && { color: '#fff', fontWeight: '600' }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Skills */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Skills</Text>
            <Ionicons name="code-slash-outline" size={16} color={colors.textSecondary} />
          </View>
          {editMode ? (
            <>
              <TextInput style={styles.skillsInput} value={skills} onChangeText={setSkills}
                placeholder="Java, Spring Boot, React Native, PostgreSQL…"
                placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
              <Text style={styles.skillsHint}>Separate skills with commas</Text>
            </>
          ) : skills ? (
            <View style={styles.skillsWrap}>
              {skills.split(',').map((s, i) => s.trim() && (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{s.trim()}</Text>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <Text style={styles.addSkills}>+ Add your skills</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Type (HR) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Account Type</Text>
              <Text style={styles.hrSubtitle}>
                {isHr ? 'HR mode: post and manage job openings' : 'Job seeker mode: browse and apply to jobs'}
              </Text>
            </View>
          </View>
          <View style={styles.hrRow}>
            <View style={styles.hrLeft}>
              <Ionicons name={isHr ? 'business-outline' : 'person-outline'} size={20}
                color={isHr ? '#059669' : colors.primary} />
              <Text style={[styles.hrModeText, { color: isHr ? '#059669' : colors.primary }]}>
                {isHr ? 'HR / Recruiter' : 'Job Seeker'}
              </Text>
            </View>
            {editMode && (
              <Switch value={isHr} onValueChange={setIsHr}
                trackColor={{ false: colors.border, true: '#059669' }} thumbColor="#fff" />
            )}
          </View>
          {isHr && (
            <TouchableOpacity style={styles.hrPostBtn}
              onPress={() => navigation.navigate('JobsTab', { screen: 'HrPostJob' })}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.hrPostBtnText}>Post a New Job</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Appearance ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Appearance</Text>

          {/* Dark mode toggle */}
          <View style={styles.themeRow}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.themeLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={styles.themeSub}>Change how ApplyAI looks</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={() => { dispatch(toggleMode()); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          {/* Accent color picker */}
          <View>
            <Text style={styles.accentLabel}>Accent Color</Text>
            <View style={styles.accentRow}>
              {(Object.entries(ACCENT_PRESETS) as [AccentColor, { label: string; primary: string }][]).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.accentDot, { backgroundColor: val.primary },
                    accent === key && styles.accentDotActive]}
                  onPress={() => dispatch(setAccent(key))}
                  activeOpacity={0.8}
                >
                  {accent === key && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Plan */}
        <View style={[styles.card, styles.planCard]}>
          <View style={styles.planLeft}>
            <Ionicons name="flash-outline" size={20} color={colors.warning} />
            <View>
              <Text style={styles.planTitle}>{displayUser?.subscriptionPlan ?? 'Free'} Plan</Text>
              <Text style={styles.planSub}>
                {displayUser?.subscriptionPlan === 'FREE'
                  ? 'Upgrade to unlock unlimited applications'
                  : 'Full access unlocked'}
              </Text>
            </View>
          </View>
          {displayUser?.subscriptionPlan === 'FREE' && (
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate('Paywall', {})}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Career Path */}
        <TouchableOpacity style={styles.careerBtn} onPress={handleCareerPath} disabled={loadingCareerPath}>
          {loadingCareerPath ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="rocket-outline" size={20} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.careerBtnTitle}>AI Career Path</Text>
                <Text style={styles.careerBtnSub}>Get your AI-generated career roadmap</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menuCard}>
          {[
            { icon: 'bar-chart-outline', label: 'Analytics', route: 'Analytics' },
            { icon: 'cash-outline', label: 'Salary Intelligence', route: 'SalaryIntel' },
            { icon: 'trending-up-outline', label: 'Negotiation Coach', route: 'NegotiationCoach' },
            { icon: 'ban-outline', label: 'Company Blacklist', route: 'Blacklist' },
            { icon: 'bookmark-outline', label: 'Saved Jobs', route: null, tab: 'JobsTab', screen: 'SavedJobs' },
            { icon: 'notifications-outline', label: 'Job Alerts', route: null, tab: 'JobsTab', screen: 'JobAlerts' },
          ].map((item, i, arr) => (
            <TouchableOpacity key={i}
              style={[styles.menuItem, i < arr.length - 1 && styles.menuDivider]}
              onPress={() => {
                if (item.tab) navigation.navigate(item.tab, { screen: item.screen });
                else navigation.navigate(item.route!);
              }}>
              <Ionicons name={item.icon as any} size={20} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ApplyAI v1.0.0</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, icon, value, placeholder, editMode, onChangeText, colors }: {
  label: string; icon: any; value: string; placeholder: string;
  editMode: boolean; onChangeText: (t: string) => void; colors: AppColors;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>{label}</Text>
        {!editMode && <Text style={{ fontSize: 14, color: colors.textPrimary, fontWeight: '500', textAlign: 'right', flexShrink: 1 }}>{value || '—'}</Text>}
      </View>
      {editMode && (
        <TextInput
          style={{ backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border }}
          value={value} onChangeText={onChangeText} placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
        />
      )}
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 16, gap: 12, paddingTop: 12 },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    headerAction: { fontSize: 15, fontWeight: '700', color: colors.primary },

    heroCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    coverBanner: { height: 88, backgroundColor: colors.primary, opacity: 0.85 },
    avatarWrapper: { marginTop: -44, marginLeft: 16, position: 'relative', width: 88, alignSelf: 'flex-start' },
    avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.surface },
    avatarFallback: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface },
    avatarInitial: { color: '#fff', fontSize: 34, fontWeight: '800' },
    scoreRingSmall: { position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, borderWidth: 2.5, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    scoreRingText: { fontSize: 9, fontWeight: '800' },
    heroInfo: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 18, alignItems: 'flex-start', gap: 4 },
    nameText: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
    nameInput: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, borderBottomWidth: 1.5, borderBottomColor: colors.primary, paddingBottom: 2, minWidth: 200 },
    headlineText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    headlineInput: { fontSize: 13, color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 2, minWidth: 260, maxWidth: 320 },
    addHeadline: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    emailText: { fontSize: 12, color: colors.textMuted },
    editInlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
    editInlineBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },

    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.border },

    scoreText: { fontSize: 15, fontWeight: '800', color: colors.primary },
    progressTrack: { height: 7, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: 7, borderRadius: 4 },
    hintsList: { gap: 6 },
    hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    hintText: { flex: 1, fontSize: 12, color: colors.textSecondary },

    fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    fieldLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    fieldValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', textAlign: 'right', flexShrink: 1 },

    presetsRow: { marginTop: 6 },
    presetChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.surfaceAlt },
    presetChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

    remoteOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    remoteChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
    remoteChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

    skillsInput: { backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: 72, textAlignVertical: 'top' },
    skillsHint: { fontSize: 11, color: colors.textMuted },
    skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillChip: { backgroundColor: colors.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    skillChipText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    addSkills: { fontSize: 14, color: colors.primary, fontWeight: '600' },

    hrSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    hrRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    hrLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    hrModeText: { fontSize: 15, fontWeight: '700' },
    hrPostBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#059669', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
    hrPostBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // Appearance
    themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    themeLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    themeSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    accentLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 10 },
    accentRow: { flexDirection: 'row', gap: 14 },
    accentDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    accentDotActive: { borderWidth: 3, borderColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },

    planCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    planLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    planTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    planSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    upgradeBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
    upgradeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    careerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.secondary, borderRadius: 14, padding: 16 },
    careerBtnTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
    careerBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

    menuCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 12 },
    menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    menuLabel: { flex: 1, fontSize: 15, color: colors.textPrimary },

    signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#FCA5A5' },
    signOutText: { fontSize: 15, fontWeight: '700', color: colors.error },
    version: { textAlign: 'center', fontSize: 12, color: colors.textMuted },
  });
}
