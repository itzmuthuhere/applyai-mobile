import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { BottomTabBarProps, BottomTabBar } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS } from '../constants';
import { RootState } from '../store';

export const SIDEBAR_WIDTH = 232;

const LABELS: Record<string, string> = {
  HomeTab: 'Home',
  FeedTab: 'Feed',
  JobsTab: 'Jobs',
  ResumeTab: 'Resumes',
  ApplicationsTab: 'Applications',
  InterviewTab: 'Interview',
};

// Custom tab bar: on a wide web viewport this renders a persistent left
// sidebar instead of the bottom bar (a bottom tab strip stretched across a
// 1900px browser window doesn't read as a web app). Below the desktop
// breakpoint — including native and a narrow mobile-browser window — it
// renders the stock BottomTabBar unchanged, so mobile behavior/appearance
// is completely untouched.
export default function WebSidebar(props: BottomTabBarProps) {
  const { isDesktopWeb } = useResponsive();
  const user = useSelector((s: RootState) => s.auth.user);

  if (!isDesktopWeb) return <BottomTabBar {...props} />;

  const { state, descriptors, navigation } = props;
  const initial = (user?.name?.trim().charAt(0) ?? '?').toUpperCase();

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>AI</Text>
        </View>
        <Text style={styles.appName}>ApplyAI</Text>
      </View>

      <View style={styles.navList}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const iconFn = options.tabBarIcon;
          const color = focused ? COLORS.primary : COLORS.textSecondary;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.75}
              style={[styles.navItem, focused && styles.navItemActive]}
            >
              {iconFn?.({ focused, color, size: 20 })}
              <Text style={[styles.navLabel, { color: focused ? COLORS.primary : COLORS.textPrimary }]}>
                {LABELS[route.name] ?? route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('HomeTab', { screen: 'Profile' })}
      >
        {user?.profilePicture ? (
          <Image source={{ uri: user.profilePicture }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.userName} numberOfLines={1}>{user?.name ?? 'Account'}</Text>
          <Text style={styles.userPlan} numberOfLines={1}>{user?.subscriptionPlan ?? 'FREE'} Plan</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    position: 'fixed' as any,
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 20,
    paddingHorizontal: 16,
    zIndex: 50,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28, paddingHorizontal: 4 },
  logoBadge: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  appName: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.3 },

  navList: { flex: 1, gap: 4 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
  },
  navItemActive: { backgroundColor: COLORS.primaryLight },
  navLabel: { fontSize: 14, fontWeight: '700' },

  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: 16, paddingHorizontal: 4,
  },
  avatarImg: { width: 34, height: 34, borderRadius: 17 },
  avatarCircle: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 13, fontWeight: '800' },
  userName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  userPlan: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
});
