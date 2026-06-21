import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, SafeAreaView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { signOut } from '../../store/slices/authSlice';
import { COLORS } from '../../constants';

const PLAN_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; label: string; accent: string }> = {
  FREE:   { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', icon: 'person-outline',  label: 'Free Plan',   accent: '#94A3B8' },
  HUNTER: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE', icon: 'flash',           label: 'Hunter Plan', accent: '#2563EB' },
  PRO:    { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: 'rocket',           label: 'Pro Plan',    accent: '#D97706' },
};

const REMOTE_LABELS: Record<string, string> = {
  REMOTE: 'Remote', HYBRID: 'Hybrid', ONSITE: 'On-site', ANY: 'Any',
};

function PreferenceChip({ icon, value, color }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string; color: string }) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: color + '14', borderColor: color + '30' }]}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[chipStyles.text, { color }]}>{value}</Text>
    </View>
  );
}
const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  text: { fontSize: 12, fontWeight: '700' },
});

function MenuItem({
  icon, label, value, tint = COLORS.textPrimary, onPress, isLast = false, danger = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  tint?: string;
  onPress?: () => void;
  isLast?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[menuStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: COLORS.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[menuStyles.iconBox, { backgroundColor: (danger ? '#FEF2F2' : '#F1F5F9') }]}>
        <Ionicons name={icon} size={17} color={danger ? COLORS.error : tint} />
      </View>
      <Text style={[menuStyles.label, danger && { color: COLORS.error }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value ? <Text style={menuStyles.value}>{value}</Text> : null}
      {onPress && !danger && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
    </TouchableOpacity>
  );
}
const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  value: { fontSize: 13, color: COLORS.textMuted, marginRight: 6 },
});

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const plan = user?.subscriptionPlan ?? 'FREE';
  const planCfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.FREE;
  const firstName = user?.name?.split(' ')[0] ?? '';
  const score = user?.completenessScore ?? 0;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => {
        setIsSigningOut(true);
        await dispatch(signOut());
      }},
    ]);
  };

  const fmtSalary = (n: number) => {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr/yr`;
    if (n >= 100_000) return `₹${Math.round(n / 100_000)}L/yr`;
    return `₹${n.toLocaleString('en-IN')}/yr`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('ProfileSettings')}
          activeOpacity={0.75}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Cover + Avatar */}
        <View style={styles.coverWrap}>
          <View style={[styles.cover, { backgroundColor: planCfg.accent }]} />
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={[styles.planPill, { backgroundColor: planCfg.bg, borderColor: planCfg.border }]}>
              <Ionicons name={planCfg.icon as any} size={12} color={planCfg.text} />
              <Text style={[styles.planText, { color: planCfg.text }]}>{planCfg.label}</Text>
            </View>
          </View>
        </View>

        {/* Name + headline */}
        <View style={styles.nameSection}>
          <Text style={styles.name}>{user?.name ?? '—'}</Text>
          {user?.headline ? (
            <Text style={styles.headline}>{user.headline}</Text>
          ) : null}
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>

        {/* Profile Completeness */}
        {score < 100 && (
          <TouchableOpacity style={styles.scoreCard} onPress={() => navigation.navigate('ProfileSettings')} activeOpacity={0.85}>
            <View style={styles.scoreLeft}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNum}>{score}%</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreTitle}>Profile Completeness</Text>
              <Text style={styles.scoreSub}>{score < 50 ? 'Add more details to get better job matches' : 'Almost there — complete your profile'}</Text>
              <View style={styles.scoreTrack}>
                <View style={[styles.scoreFill, { width: `${score}%` as any }]} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Job Preferences chips */}
        {(user?.targetRole || user?.targetLocation || user?.minSalary || user?.remotePreference) && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Ionicons name="briefcase-outline" size={15} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Job Preferences</Text>
            </View>
            <View style={styles.chipRow}>
              {user?.targetRole ? <PreferenceChip icon="briefcase-outline" value={user.targetRole} color={COLORS.primary} /> : null}
              {user?.targetLocation ? <PreferenceChip icon="location-outline" value={user.targetLocation} color='#059669' /> : null}
              {user?.minSalary ? <PreferenceChip icon="cash-outline" value={fmtSalary(user.minSalary)} color='#F59E0B' /> : null}
              {user?.remotePreference ? <PreferenceChip icon="home-outline" value={REMOTE_LABELS[user.remotePreference] ?? user.remotePreference} color='#7C3AED' /> : null}
            </View>
          </View>
        )}

        {/* Quick Links */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="document-text-outline"
            label="My Resumes"
            tint={COLORS.primary}
            onPress={() => navigation.navigate('ResumeTab', { screen: 'ResumeList' })}
          />
          <MenuItem
            icon="briefcase-outline"
            label="My Applications"
            tint='#10B981'
            onPress={() => navigation.navigate('ApplicationsTab', { screen: 'ApplicationsList' })}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            tint='#F59E0B'
            onPress={() => navigation.navigate('Notifications')}
          />
          <MenuItem
            icon="star-outline"
            label="Saved Jobs"
            tint='#7C3AED'
            onPress={() => navigation.navigate('JobsTab', { screen: 'SavedJobs' })}
            isLast
          />
        </View>

        {/* Account Info */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="person-circle-outline"
            label="Member Since"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            tint={COLORS.primary}
          />
          <MenuItem
            icon="id-card-outline"
            label="User ID"
            value={`#${user?.id ?? '—'}`}
            tint={COLORS.textSecondary}
            isLast
          />
        </View>

        {/* Upgrade CTA */}
        {plan === 'FREE' && (
          <TouchableOpacity style={styles.upgradeCta} onPress={() => navigation.navigate('Paywall')} activeOpacity={0.85}>
            <View style={styles.upgradeLeft}>
              <View style={styles.upgradeIcon}>
                <Ionicons name="rocket" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.upgradeTitle}>Unlock Pro Features</Text>
                <Text style={styles.upgradeSub}>AI interviews, unlimited apply & more</Text>
              </View>
            </View>
            <View style={styles.upgradePill}>
              <Text style={styles.upgradePillText}>Upgrade</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutBtn, isSigningOut && { opacity: 0.6 }]}
          onPress={handleSignOut}
          disabled={isSigningOut}
          activeOpacity={0.8}
        >
          {isSigningOut ? (
            <ActivityIndicator color={COLORS.error} size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  settingsBtn: { padding: 4 },

  content: { gap: 14 },

  // Cover + Avatar
  coverWrap: { backgroundColor: COLORS.surface },
  cover: { height: 100 },
  avatarRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, marginTop: -36,
  },
  avatarWrap: {
    borderRadius: 50, borderWidth: 4, borderColor: COLORS.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarFallback: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 36, fontWeight: '800' },
  planPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
    marginBottom: 4,
  },
  planText: { fontSize: 12, fontWeight: '800' },

  // Name
  nameSection: { paddingHorizontal: 20, marginTop: -4, gap: 3 },
  name: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary },
  headline: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  email: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  // Score card
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 16,
    marginHorizontal: 16, borderWidth: 1, borderColor: '#BFDBFE',
  },
  scoreLeft: {},
  scoreCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 15, fontWeight: '900', color: '#fff' },
  scoreTitle: { fontSize: 13, fontWeight: '800', color: COLORS.primary, marginBottom: 3 },
  scoreSub: { fontSize: 11, color: COLORS.primary, opacity: 0.8, marginBottom: 7, lineHeight: 15 },
  scoreTrack: { height: 5, backgroundColor: '#BFDBFE', borderRadius: 3, overflow: 'hidden' },
  scoreFill: { height: 5, backgroundColor: COLORS.primary, borderRadius: 3 },

  // Preferences
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 12, marginHorizontal: 16,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Menu
  menuCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginHorizontal: 16,
  },

  // Upgrade CTA
  upgradeCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 16, marginHorizontal: 16,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  upgradeTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  upgradeSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  upgradePill: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  upgradePillText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },

  // Sign out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 16, marginHorizontal: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: COLORS.error },
});
