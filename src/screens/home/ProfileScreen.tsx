import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, SafeAreaView, ActivityIndicator, Alert, Linking,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { signOut, setAuth } from '../../store/slices/authSlice';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import { API_ENDPOINTS } from '../../constants';
import { FullProfile, Experience, Education, Certification, ProfileHint } from '../../types/api.types';

// ── Plan config ───────────────────────────────────────────────────────────────
const PLAN_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; label: string; accent: string }> = {
  FREE:   { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', icon: 'person-outline',  label: 'Free Plan',   accent: '#94A3B8' },
  HUNTER: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE', icon: 'flash',           label: 'Hunter Plan', accent: '#2563EB' },
  PRO:    { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: 'rocket',           label: 'Pro Plan',    accent: '#D97706' },
};

// ── Profile strength config ───────────────────────────────────────────────────
const STRENGTH_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  Beginner:     { color: '#EF4444', bg: '#FEF2F2', icon: 'leaf-outline' },
  Developing:   { color: '#F97316', bg: '#FFF7ED', icon: 'trending-up-outline' },
  Intermediate: { color: '#EAB308', bg: '#FEFCE8', icon: 'flash-outline' },
  Advanced:     { color: '#3B82F6', bg: '#EFF6FF', icon: 'star-half-outline' },
  Expert:       { color: '#7C3AED', bg: '#F5F3FF', icon: 'star-outline' },
  'All-Star':   { color: '#10B981', bg: '#ECFDF5', icon: 'trophy-outline' },
};

// ── Section → icon map for hints ─────────────────────────────────────────────
const SECTION_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  BASIC:          'person-circle-outline',
  EXPERIENCE:     'briefcase-outline',
  EDUCATION:      'school-outline',
  CERTIFICATIONS: 'ribbon-outline',
  SKILLS:         'code-slash-outline',
  PREFERENCES:    'search-outline',
  SOCIAL:         'share-social-outline',
};

// ── Month helper ──────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthLabel(m: number | null | undefined, y: number | null | undefined): string {
  if (!y) return '';
  if (!m) return `${y}`;
  return `${MONTHS[(m - 1) % 12]} ${y}`;
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, onAdd, colors }: {
  icon: React.ComponentProps<typeof Ionicons>['name']; title: string; onAdd?: () => void; colors: AppColors;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon} size={16} color={colors.primary} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{title}</Text>
      </View>
      {onAdd && (
        <TouchableOpacity onPress={onAdd} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function EmptyState({ label, onAdd, colors }: { label: string; onAdd?: () => void; colors: AppColors }) {
  return (
    <TouchableOpacity onPress={onAdd} activeOpacity={0.7} style={{ paddingVertical: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
      <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Profile Strength Card ─────────────────────────────────────────────────────
function ProfileStrengthCard({ score, label, hints, onEditProfile, onSeeAll, colors }: {
  score: number; label: string; hints: ProfileHint[];
  onEditProfile: () => void; onSeeAll: () => void; colors: AppColors;
}) {
  const cfg = STRENGTH_CONFIG[label] ?? STRENGTH_CONFIG['Developing'];
  const isAllStar = label === 'All-Star';
  const nextLabel = nextStrengthLabel(label);
  const shownHints = hints.slice(0, 3); // show top 3

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, overflow: 'hidden' }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Profile Strength</Text>
        </View>
        {!isAllStar && hints.length > 3 && (
          <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>See all →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar + label */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: cfg.color + '40' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: cfg.color, letterSpacing: 0.5 }} testID="strength-label">{label.toUpperCase()}</Text>
            </View>
            {!isAllStar && nextLabel && (
              <Text style={{ fontSize: 12, color: colors.textMuted }}>→ {nextLabel}</Text>
            )}
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: cfg.color }} testID="strength-score">{score}%</Text>
        </View>

        {/* Bar track */}
        <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: cfg.color, width: `${score}%` as any }} testID="strength-bar" />
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: colors.border }} />

      {/* Content */}
      {isAllStar ? (
        <TouchableOpacity onPress={onEditProfile} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }} activeOpacity={0.8} testID="all-star-banner">
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#047857' }}>Your profile is complete!</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>You're discoverable to recruiters. Keep it updated.</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ) : (
        <View style={{ paddingBottom: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, paddingHorizontal: 16, paddingVertical: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {nextLabel ? `Complete these to reach ${nextLabel}` : 'Complete your profile'}
          </Text>
          {shownHints.map((hint, i) => (
            <TouchableOpacity
              key={hint.key}
              onPress={onEditProfile}
              activeOpacity={0.7}
              testID={`hint-${hint.key}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11, borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: colors.border }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ionicons name={SECTION_ICON[hint.section] as any} size={15} color={cfg.color} />
              </View>
              <Text style={{ flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '500' }}>{hint.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: cfg.color }}>+{hint.points}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>pts</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 2 }} />
              </View>
            </TouchableOpacity>
          ))}
          {hints.length > 3 && (
            <TouchableOpacity onPress={onSeeAll} style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: colors.border }} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600', textAlign: 'center' }}>
                +{hints.length - 3} more items to complete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function nextStrengthLabel(current: string): string | null {
  const levels = ['Beginner', 'Developing', 'Intermediate', 'Advanced', 'Expert', 'All-Star'];
  const idx = levels.indexOf(current);
  return idx >= 0 && idx < levels.length - 1 ? levels[idx + 1] : null;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const storeUser = useSelector((s: RootState) => s.auth.user);
  const storeJwt = useSelector((s: RootState) => s.auth.jwt);

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadProfile = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await apiClient.get<FullProfile>(API_ENDPOINTS.PROFILE);
      setProfile(data);
      if (storeJwt) dispatch(setAuth({ jwt: storeJwt, user: data }));
    } catch {
      // fall back to cached store user
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeJwt, dispatch]);

  useEffect(() => { loadProfile(); }, []);
  useFocusEffect(useCallback(() => { loadProfile(true); }, [loadProfile]));

  const handleRefresh = () => { setRefreshing(true); loadProfile(true); };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => {
        setSigningOut(true);
        await dispatch(signOut());
      }},
    ]);
  };

  const p = profile ?? (storeUser as FullProfile | null);
  const plan = p?.subscriptionPlan ?? 'FREE';
  const planCfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.FREE;
  const firstName = p?.name?.split(' ')[0] ?? '';
  const score = p?.completenessScore ?? 0;
  const strengthLabel = p?.profileStrengthLabel ?? 'Beginner';
  const hints = p?.completenessHints ?? [];
  const goToSettings = () => navigation.navigate('ProfileSettings');

  const fmtSalary = (n: number) => {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr/yr`;
    if (n >= 100_000) return `₹${Math.round(n / 100_000)}L/yr`;
    return `₹${n.toLocaleString('en-IN')}/yr`;
  };

  if (loading && !p) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} testID="profile-screen">
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Profile</Text>
        <TouchableOpacity style={{ padding: 4 }} onPress={goToSettings} activeOpacity={0.75} testID="settings-btn">
          <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* ── Hero card ──────────────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={[styles.cover, { backgroundColor: planCfg.accent }]} />
          <View style={styles.heroRow}>
            <View style={styles.avatarWrap}>
              {p?.profilePicture ? (
                <Image source={{ uri: p.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
              )}
            </View>
            <View style={[styles.planPill, { backgroundColor: planCfg.bg, borderColor: planCfg.border }]}>
              <Ionicons name={planCfg.icon as any} size={12} color={planCfg.text} />
              <Text style={[styles.planText, { color: planCfg.text }]}>{planCfg.label}</Text>
            </View>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.name} testID="profile-name">{p?.name ?? '—'}</Text>
            {p?.headline ? <Text style={styles.headline}>{p.headline}</Text> : null}
            {(p?.city || p?.country) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.locationText}>{[p.city, p.country].filter(Boolean).join(', ')}</Text>
              </View>
            ) : null}
            <Text style={styles.email}>{p?.email ?? '—'}</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
              <Text style={styles.followStat}><Text style={styles.followNum}>{p?.followersCount ?? 0}</Text> Followers</Text>
              <Text style={styles.followStat}><Text style={styles.followNum}>{p?.followingCount ?? 0}</Text> Following</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn} onPress={goToSettings} activeOpacity={0.8}>
            <Ionicons name="pencil-outline" size={14} color={colors.primary} />
            <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── Profile Strength ───────────────────────────────────────────────── */}
        <ProfileStrengthCard
          score={score}
          label={strengthLabel}
          hints={hints}
          onEditProfile={goToSettings}
          onSeeAll={goToSettings}
          colors={colors}
        />

        {/* ── Bio ───────────────────────────────────────────────────────────── */}
        {p?.bio ? (
          <View style={styles.card}>
            <SectionHeader icon="person-outline" title="About" colors={colors} />
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary }}>{p.bio}</Text>
          </View>
        ) : null}

        {/* ── Experience ────────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionHeader icon="briefcase-outline" title="Experience" onAdd={goToSettings} colors={colors} />
          {(p?.experience?.length ?? 0) > 0 ? (
            p!.experience.map((exp, i) => (
              <ExperienceItem key={exp.id} exp={exp} isLast={i === (p!.experience.length - 1)} colors={colors} />
            ))
          ) : (
            <EmptyState label="Add work experience" onAdd={goToSettings} colors={colors} />
          )}
        </View>

        {/* ── Education ─────────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionHeader icon="school-outline" title="Education" onAdd={goToSettings} colors={colors} />
          {(p?.education?.length ?? 0) > 0 ? (
            p!.education.map((edu, i) => (
              <EducationItem key={edu.id} edu={edu} isLast={i === (p!.education.length - 1)} colors={colors} />
            ))
          ) : (
            <EmptyState label="Add education" onAdd={goToSettings} colors={colors} />
          )}
        </View>

        {/* ── Certifications ────────────────────────────────────────────────── */}
        {(p?.certifications?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <SectionHeader icon="ribbon-outline" title="Certifications" onAdd={goToSettings} colors={colors} />
            {p!.certifications.map((cert, i) => (
              <CertItem key={cert.id} cert={cert} isLast={i === (p!.certifications.length - 1)} colors={colors} />
            ))}
          </View>
        )}

        {/* ── Skills ────────────────────────────────────────────────────────── */}
        {p?.skills ? (
          <View style={styles.card}>
            <SectionHeader icon="code-slash-outline" title="Skills" colors={colors} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
              {p.skills.split(',').map((s, i) => s.trim() && (
                <View key={i} style={{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.primaryLight }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>{s.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Job Preferences ───────────────────────────────────────────────── */}
        {(p?.targetRole || p?.targetLocation || p?.minSalary || p?.remotePreference) && (
          <View style={styles.card}>
            <SectionHeader icon="search-outline" title="Job Preferences" colors={colors} />
            <View style={{ gap: 2 }}>
              {p?.targetRole ? <PrefRow icon="briefcase-outline" label="Role" value={p.targetRole} colors={colors} /> : null}
              {p?.targetLocation ? <PrefRow icon="location-outline" label="Location" value={p.targetLocation} colors={colors} /> : null}
              {p?.minSalary ? <PrefRow icon="cash-outline" label="Min. Salary" value={fmtSalary(p.minSalary)} colors={colors} /> : null}
              {p?.remotePreference ? <PrefRow icon="wifi-outline" label="Work Mode" value={p.remotePreference} colors={colors} /> : null}
            </View>
          </View>
        )}

        {/* ── Social Links ──────────────────────────────────────────────────── */}
        {(p?.linkedinUrl || p?.githubUrl || p?.portfolioUrl || p?.twitterUrl) && (
          <View style={styles.card}>
            <SectionHeader icon="share-social-outline" title="Social Links" colors={colors} />
            <View style={{ gap: 10 }}>
              {p?.linkedinUrl && <SocialLinkRow icon="logo-linkedin" label="LinkedIn" url={p.linkedinUrl} color="#0A66C2" />}
              {p?.githubUrl && <SocialLinkRow icon="logo-github" label="GitHub" url={p.githubUrl} color={colors.textPrimary} />}
              {p?.portfolioUrl && <SocialLinkRow icon="globe-outline" label="Portfolio" url={p.portfolioUrl} color="#10B981" />}
              {p?.twitterUrl && <SocialLinkRow icon="logo-twitter" label="Twitter / X" url={p.twitterUrl} color="#1DA1F2" />}
            </View>
          </View>
        )}

        {/* ── Quick Links ───────────────────────────────────────────────────── */}
        <View style={styles.menuCard}>
          <QuickLink icon="document-text-outline" label="My Resumes"      tint={colors.primary} onPress={() => navigation.navigate('ResumeTab', { screen: 'ResumeList' })}         colors={colors} />
          <QuickLink icon="briefcase-outline"     label="My Applications" tint="#10B981"        onPress={() => navigation.navigate('ApplicationsTab', { screen: 'ApplicationsList' })} colors={colors} />
          <QuickLink icon="star-outline"          label="Saved Jobs"      tint="#7C3AED"        onPress={() => navigation.navigate('JobsTab', { screen: 'SavedJobs' })}              colors={colors} />
          <QuickLink icon="notifications-outline" label="Notifications"   tint="#F59E0B"        onPress={() => navigation.navigate('Notifications')} isLast colors={colors} />
        </View>

        {/* ── Account Info ──────────────────────────────────────────────────── */}
        <View style={styles.menuCard}>
          <InfoRow icon="person-circle-outline" label="Member Since" value={p?.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} colors={colors} />
          <InfoRow icon="id-card-outline"       label="User ID"      value={`#${p?.id ?? '—'}`} colors={colors} isLast />
        </View>

        {/* ── Upgrade CTA ───────────────────────────────────────────────────── */}
        {plan === 'FREE' && (
          <TouchableOpacity style={styles.upgradeCta} onPress={() => navigation.navigate('Paywall')} activeOpacity={0.85}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="rocket" size={20} color="#fff" />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Unlock Pro Features</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>AI interviews, unlimited apply & more</Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>Upgrade</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Sign Out ──────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.signOutBtn, signingOut && { opacity: 0.6 }]}
          onPress={handleSignOut} disabled={signingOut} activeOpacity={0.8} testID="sign-out-btn"
        >
          {signingOut
            ? <ActivityIndicator color="#EF4444" size="small" />
            : <><Ionicons name="log-out-outline" size={20} color="#EF4444" /><Text style={styles.signOutText}>Sign Out</Text></>}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ExperienceItem({ exp, isLast, colors }: { exp: Experience; isLast: boolean; colors: AppColors }) {
  const start = monthLabel(exp.startMonth, exp.startYear);
  const end = exp.current ? 'Present' : monthLabel(exp.endMonth, exp.endYear);
  return (
    <View style={[{ flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' }, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ionicons name="briefcase-outline" size={18} color="#2563EB" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{exp.title}</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</Text>
        {(start || end) ? <Text style={{ fontSize: 12, color: colors.textMuted }}>{start}{end ? ` – ${end}` : ''}</Text> : null}
        {exp.description ? <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginTop: 2 }} numberOfLines={2}>{exp.description}</Text> : null}
      </View>
    </View>
  );
}

function EducationItem({ edu, isLast, colors }: { edu: Education; isLast: boolean; colors: AppColors }) {
  const end = edu.current ? 'Present' : edu.endYear?.toString() ?? '';
  return (
    <View style={[{ flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' }, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ionicons name="school-outline" size={18} color="#10B981" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{edu.school}</Text>
        {(edu.degree || edu.fieldOfStudy) ? <Text style={{ fontSize: 13, color: colors.textSecondary }}>{[edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ')}</Text> : null}
        {(edu.startYear || end) ? <Text style={{ fontSize: 12, color: colors.textMuted }}>{edu.startYear}{edu.startYear && end ? ` – ${end}` : end}</Text> : null}
        {edu.grade ? <Text style={{ fontSize: 12, color: colors.textMuted }}>Grade: {edu.grade}</Text> : null}
      </View>
    </View>
  );
}

function CertItem({ cert, isLast, colors }: { cert: Certification; isLast: boolean; colors: AppColors }) {
  return (
    <View style={[{ flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' }, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ionicons name="ribbon-outline" size={18} color="#F59E0B" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{cert.name}</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>{cert.issuer}</Text>
        {cert.issueDate ? <Text style={{ fontSize: 12, color: colors.textMuted }}>Issued {cert.issueDate}</Text> : null}
        {cert.credentialId ? <Text style={{ fontSize: 12, color: colors.textMuted }}>ID: {cert.credentialId}</Text> : null}
      </View>
    </View>
  );
}

function PrefRow({ icon, label, value, colors }: { icon: any; label: string; value: string; colors: AppColors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500', width: 70 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '600', flex: 1 }}>{value}</Text>
    </View>
  );
}

function SocialLinkRow({ icon, label, url, color }: { icon: any; label: string; url: string; color: string }) {
  const display = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  return (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => Linking.openURL(url).catch(() => {})} activeOpacity={0.7}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: color + '18', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>{label}</Text>
        <Text style={{ fontSize: 13, color, fontWeight: '600' }} numberOfLines={1}>{display}</Text>
      </View>
      <Ionicons name="open-outline" size={14} color="#94A3B8" />
    </TouchableOpacity>
  );
}

function QuickLink({ icon, label, tint, onPress, isLast = false, colors }: { icon: any; label: string; tint: string; onPress: () => void; isLast?: boolean; colors: AppColors }) {
  return (
    <TouchableOpacity
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      onPress={onPress} activeOpacity={0.7}
    >
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: tint + '14', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function InfoRow({ icon, label, value, isLast = false, colors }: { icon: any; label: string; value: string; isLast?: boolean; colors: AppColors }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 }, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe:           { flex: 1, backgroundColor: colors.background },
    navBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    navTitle:       { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    content:        { paddingTop: 12, paddingBottom: 8, gap: 12 },
    heroCard:       { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    cover:          { height: 64 },
    heroRow:        { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -30 },
    avatarWrap:     { position: 'relative' },
    avatar:         { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: colors.surface },
    avatarFallback: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface },
    avatarInitial:  { color: '#fff', fontSize: 26, fontWeight: '800' },
    planPill:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    planText:       { fontSize: 12, fontWeight: '700' },
    heroInfo:       { padding: 16, paddingTop: 10, gap: 2 },
    name:           { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
    headline:       { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    locationText:   { fontSize: 13, color: colors.textMuted },
    email:          { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    followStat:     { fontSize: 13, color: colors.textSecondary },
    followNum:      { fontWeight: '700', color: colors.textPrimary },
    editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 16, marginTop: 4, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryLight, justifyContent: 'center' },
    editProfileBtnText: { fontSize: 13, fontWeight: '700' },
    card:           { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
    menuCard:       { backgroundColor: colors.surface, marginHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    upgradeCta:     { marginHorizontal: 16, borderRadius: 16, padding: 16, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    signOutBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, marginHorizontal: 16, borderWidth: 1, borderColor: '#FCA5A5' },
    signOutText:    { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  });
}
