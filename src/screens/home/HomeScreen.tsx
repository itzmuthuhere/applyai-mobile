import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../store';
import { COLORS } from '../../constants';
import { HomeStackParamList, MainTabParamList } from '../../navigation/types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type HomeNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  FREE:   { bg: '#F1F5F9', text: '#64748B' },
  HUNTER: { bg: '#DBEAFE', text: '#2563EB' },
  PRO:    { bg: '#FEF3C7', text: '#D97706' },
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const user = useSelector((state: RootState) => state.auth.user);
  const resumeCount = useSelector((state: RootState) => state.resume.list.length);
  const applicationCount = useSelector((state: RootState) => state.application.list.length);
  const interviewCount = useSelector((state: RootState) => state.interview.history.length);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const plan = user?.subscriptionPlan ?? 'FREE';
  const planStyle = PLAN_COLORS[plan] ?? PLAN_COLORS.FREE;
  const isEmpty = resumeCount === 0 && applicationCount === 0 && interviewCount === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi {firstName} 👋</Text>
            <View style={[styles.badge, { backgroundColor: planStyle.bg }]}>
              <Text style={[styles.badgeText, { color: planStyle.text }]}>{plan}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.avatarContainer}
            activeOpacity={0.8}
          >
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatCard label="Resumes" value={resumeCount} icon="document-text-outline" />
          <StatCard label="Applications" value={applicationCount} icon="briefcase-outline" />
          <StatCard label="Interviews" value={interviewCount} icon="mic-outline" />
        </View>

        {/* ── Empty / First-time state ── */}
        {isEmpty && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Let's get started 🚀</Text>
            <Text style={styles.emptySubtitle}>
              Follow these steps to land your dream job faster:
            </Text>
            <View style={styles.tipList}>
              <TipRow step="1" text="Upload your resume for AI analysis" />
              <TipRow step="2" text="Browse jobs and check your match score" />
              <TipRow step="3" text="Tailor your resume for top matches" />
              <TipRow step="4" text="Practice interviews with AI coaching" />
            </View>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="cloud-upload-outline"
            label="Upload Resume"
            color="#2563EB"
            onPress={() =>
              navigation.navigate('ResumeTab', {
                screen: 'ResumeList',
              })
            }
          />
          <ActionCard
            icon="search-outline"
            label="Browse Jobs"
            color="#10B981"
            onPress={() =>
              navigation.navigate('JobsTab', {
                screen: 'JobFeed',
              })
            }
          />
          <ActionCard
            icon="mic-circle-outline"
            label="Mock Interview"
            color="#F59E0B"
            onPress={() =>
              navigation.navigate('InterviewTab', {
                screen: 'InterviewStart',
                params: { applicationId: 0 },
              })
            }
          />
          <ActionCard
            icon="list-circle-outline"
            label="Applications"
            color="#8B5CF6"
            onPress={() =>
              navigation.navigate('ApplicationsTab', {
                screen: 'ApplicationsList',
              })
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={COLORS.primary} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIconWrap, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function TipRow({ step, text }: { step: string; text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipStep}>
        <Text style={styles.tipStepText}>{step}</Text>
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  avatarContainer: {
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  tipList: {
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
