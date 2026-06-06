import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { signOut } from '../../store/slices/authSlice';
import { COLORS } from '../../constants';

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  FREE:   { bg: '#F1F5F9', text: '#64748B' },
  HUNTER: { bg: '#DBEAFE', text: '#2563EB' },
  PRO:    { bg: '#FEF3C7', text: '#D97706' },
};

const REMOTE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
  ANY: 'Any',
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const plan = user?.subscriptionPlan ?? 'FREE';
  const planStyle = PLAN_COLORS[plan] ?? PLAN_COLORS.FREE;
  const firstName = user?.name?.split(' ')[0] ?? '';

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          await dispatch(signOut());
          // AppNavigator detects jwt = null and switches to AuthNavigator automatically
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Nav bar ── */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Profile</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name ── */}
        <View style={styles.avatarSection}>
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{user?.name ?? '—'}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
          <View style={[styles.planBadge, { backgroundColor: planStyle.bg }]}>
            <Text style={[styles.planBadgeText, { color: planStyle.text }]}>
              {plan} PLAN
            </Text>
          </View>
        </View>

        {/* ── Job Preferences ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Preferences</Text>
          <InfoRow
            icon="briefcase-outline"
            label="Target Role"
            value={user?.targetRole ?? 'Not set'}
            dim={!user?.targetRole}
          />
          <InfoRow
            icon="location-outline"
            label="Target Location"
            value={user?.targetLocation ?? 'Not set'}
            dim={!user?.targetLocation}
          />
          <InfoRow
            icon="cash-outline"
            label="Min. Salary"
            value={
              user?.minSalary
                ? `₹${user.minSalary.toLocaleString('en-IN')}`
                : 'Not set'
            }
            dim={!user?.minSalary}
          />
          <InfoRow
            icon="home-outline"
            label="Work Mode"
            value={
              user?.remotePreference
                ? REMOTE_LABELS[user.remotePreference] ?? user.remotePreference
                : 'Not set'
            }
            dim={!user?.remotePreference}
            isLast
          />
        </View>

        {/* ── Account Info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <InfoRow
            icon="person-outline"
            label="User ID"
            value={`#${user?.id ?? '—'}`}
            dim={false}
          />
          <InfoRow
            icon="calendar-outline"
            label="Member Since"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'
            }
            dim={false}
            isLast
          />
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity
          style={[styles.signOutButton, isSigningOut && styles.signOutDisabled]}
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
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  dim,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  dim: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Ionicons name={icon} size={18} color={COLORS.textSecondary} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, dim && styles.infoValueDim]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  navSpacer: {
    width: 32,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  planBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingTop: 14,
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  infoValueDim: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  signOutDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});
