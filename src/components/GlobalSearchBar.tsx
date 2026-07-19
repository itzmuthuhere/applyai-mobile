import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, API_ENDPOINTS } from '../constants';
import { RootState, AppDispatch } from '../store';
import apiClient from '../api/apiClient';
import { setUnreadCount } from '../store/slices/notificationSlice';

interface Props {
  topInset: number;
}

export default function GlobalSearchBar({ topInset }: Props) {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const unreadCount = useSelector((s: RootState) => s.socialNotifications.unreadCount);
  const initial = (user?.name?.trim().charAt(0) ?? '?').toUpperCase();

  // This used to only be fetched inside FeedScreen, which is no longer reachable
  // now that the social feed tab is hidden — without this, the bell badge would
  // never populate even for real job-related notifications (interview scheduled,
  // offer received, etc). The bar is globally mounted, so fetch on mount here.
  useEffect(() => {
    apiClient.get(API_ENDPOINTS.SOCIAL_NOTIFICATIONS_UNREAD)
      .then(({ data }) => dispatch(setUnreadCount(data.count ?? 0)))
      .catch(() => {});
  }, []);

  const openSearch = () => {
    navigation.navigate('Main', {
      screen: 'JobsTab',
      params: { screen: 'JobFeed' },
    });
  };

  const openProfile = () => {
    navigation.navigate('Main', {
      screen: 'HomeTab',
      params: { screen: 'Profile' },
    });
  };

  const openNotifications = () => {
    navigation.navigate('Main', {
      screen: 'HomeTab',
      params: { screen: 'Notifications' },
    });
  };

  return (
    <View style={[styles.wrapper, { paddingTop: topInset }]}>
      <View style={styles.row}>
        {/* Avatar — taps to Profile */}
        <TouchableOpacity onPress={openProfile} activeOpacity={0.8} style={styles.avatarBtn}>
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Search pill */}
        <TouchableOpacity
          style={styles.searchPill}
          onPress={openSearch}
          activeOpacity={0.88}
          testID="global-search-bar"
        >
          <Ionicons name="search-outline" size={15} color={COLORS.textMuted} style={styles.searchIcon} />
          <Text style={styles.placeholder} numberOfLines={1}>
            Search jobs...
          </Text>
        </TouchableOpacity>

        {/* Notifications bell */}
        <TouchableOpacity onPress={openNotifications} activeOpacity={0.8} style={styles.bellBtn} testID="global-bell-btn">
          <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          {unreadCount > 0 && <View testID="global-bell-dot" style={styles.bellDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 14,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  // Avatar
  avatarBtn: { flexShrink: 0 },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 15, fontWeight: '800' },
  // Search pill
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 7, flexShrink: 0 },
  placeholder: { flex: 1, fontSize: 14, color: COLORS.textMuted },
  // Icon buttons (chat, bell)
  iconBtn: { flexShrink: 0, padding: 2 },
  // Bell
  bellBtn: { flexShrink: 0, position: 'relative', padding: 2 },
  bellDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
});
