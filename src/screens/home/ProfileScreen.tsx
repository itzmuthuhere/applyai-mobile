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
import { FullProfile, Experience, Education, Certification } from '../../types/api.types';

const PLAN_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; label: string; accent: string }> = {
  FREE:   { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', icon: 'person-outline',  label: 'Free Plan',   accent: '#94A3B8' },
  HUNTER: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE', icon: 'flash',           label: 'Hunter Plan', accent: '#2563EB' },
  PRO:    { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: 'rocket',           label: 'Pro Plan',    accent: '#D97706' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthLabel(m: number | null | undefined, y: number | null | undefined): string {
  if (!y) return '';
  if (!m) return `${y}`;
  return `${MONTHS[(m - 1) % 12]} ${y}`;
}

function SectionHeader({ icon, title, onAdd, colors }: {
  icon: React.ComponentProps<typeof Ionicons>['name']; title: string; onAdd?: () => void; colors: AppColors;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, marginBottom: 8 }, { borderBottomColor: colors.border }]}>
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
      // use cached store user on error
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
        {/* Hero card */}
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

        {/* Completeness */}
        {score < 100 && (
          <TouchableOpacity style={[styles.card, styles.scoreCard]} onPress={goToSettings} activeOpacity={0.85} testID="completeness-card">
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNum}>{score}%</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreTitle}>Profile Completeness</Text>
              <Text style={styles.scoreSub}>{(p?.completenessHints ?? []).slice(0, 2).join(' · ') || 'Complete your profile'}</Text>
              <View style={styles.scoreTrack}>
                <View style={[styles.scoreFill, { width: `${score}%` as any }]} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Bio */}
        {p?.bio ? (
          <View style={styles.card}>
            <SectionHeader icon="person-outline" title="About" colors={colors} />
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textSecondary }}>{p.bio}</Text>
          </View>
        ) : null}

        {/* Experience */}
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

        {/* Education */}
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

        {/* Certifications */}
        {(p?.certifications?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <SectionHeader icon="ribbon-outline" title="Certifications" onAdd={goToSettings} colors={colors} />
            {p!.certifications.map((cert, i) => (
              <CertItem key={cert.id} cert={cert} isLast={i === (p!.certifications.length - 1)} colors={colors} />
            ))}
          </View>
        )}

        {/* Skills */}
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

        {/* Job Preferences */}
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

        {/* Social Links */}
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

        {/* Quick Links */}
        <View style={styles.menuCard}>
          <QuickLink icon="document-text-outline" label="My Resumes" tint={colors.primary} onPress={() => navigation.navigate('ResumeTab', { screen: 'ResumeList' })} colors={colors} />
          <QuickLink icon="briefcase-outline" label="My Applications" tint="#10B981" onPress={() => navigation.navigate('ApplicationsTab', { screen: 'ApplicationsList' })} colors={colors} />
          <QuickLink icon="star-outline" label="Saved Jobs" tint="#7C3AED" onPress={() => navigation.navigate('JobsTab', { screen: 'SavedJobs' })} colors={colors} />
          <QuickLink icon="notifications-outline" label="Notifications" tint="#F59E0B" onPress={() => navigation.navigate('Notifications')} colors={colors} isLast />
        </View>

        {/* Account Info */}
        <View style={styles.menuCard}>
          <InfoRow icon="person-circle-outline" label="Member Since" value={p?.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} colors={colors} />
          <InfoRow icon="id-card-outline" label="User ID" value={`#${p?.id ?? '—'}`} colors={colors} isLast />
        </View>

        {/* Upgrade CTA */}
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

        {/* Sign Out */}
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
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={17} color={colors.textSecondary} />
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.textMuted }}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    content: { gap: 12, paddingBottom: 16 },
    heroCard: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    cover: { height: 90 },
    heroRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 4, marginTop: -36 },
    avatarWrap: { borderRadius: 52, borderWidth: 4, borderColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
    avatar: { width: 90, height: 90, borderRadius: 45 },
    avatarFallback: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { color: '#fff', fontSize: 38, fontWeight: '800' },
    planPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 4 },
    planText: { fontSize: 12, fontWeight: '800' },
    heroInfo: { paddingHorizontal: 20, paddingTop: 10, gap: 2 },
    name: { fontSize: 24, fontWeight: '900', color: colors.textPrimary },
    headline: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 2 },
    locationText: { fontSize: 13, color: colors.textMuted },
    email: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    followStat: { fontSize: 13, color: colors.textSecondary },
    followNum: { fontWeight: '800', color: colors.textPrimary },
    editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 16, marginTop: 12, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: colors.primary, alignSelf: 'flex-start' },
    editProfileBtnText: { fontSize: 13, fontWeight: '700' },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, gap: 4 },
    scoreCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.primaryLight, borderColor: '#BFDBFE' },
    scoreCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    scoreNum: { fontSize: 15, fontWeight: '900', color: '#fff' },
    scoreTitle: { fontSize: 13, fontWeight: '800', color: colors.primary, marginBottom: 3 },
    scoreSub: { fontSize: 11, color: colors.primary, opacity: 0.8, marginBottom: 6, lineHeight: 15 },
    scoreTrack: { height: 5, backgroundColor: '#BFDBFE', borderRadius: 3, overflow: 'hidden' },
    scoreFill: { height: 5, backgroundColor: colors.primary, borderRadius: 3 },
    menuCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginHorizontal: 16 },
    upgradeCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primary, borderRadius: 16, padding: 16, marginHorizontal: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 16, marginHorizontal: 16, borderWidth: 1, borderColor: '#FECACA' },
    signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  });
}
