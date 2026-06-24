import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants';
import { RootState } from '../store';

interface Props {
  topInset: number;
}

export default function GlobalSearchBar({ topInset }: Props) {
  const navigation = useNavigation<any>();
  const user = useSelector((s: RootState) => s.auth.user);
  const initial = (user?.name?.trim().charAt(0) ?? '?').toUpperCase();

  const openSearch = () => {
    // GlobalSearchBar's useNavigation() returns Root Stack nav (knows 'Main'+'Auth').
    // Navigate into Main's nested Tab → FeedTab → Search.
    navigation.navigate('Main', {
      screen: 'FeedTab',
      params: { screen: 'Search', params: { initialQuery: '' } },
    });
  };

  const openProfile = () => {
    navigation.navigate('Main', {
      screen: 'Home',
      params: { screen: 'Profile' },
    });
  };

  const openNotifications = () => {
    navigation.navigate('Main', {
      screen: 'Home',
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
            Search people, posts, hashtags...
          </Text>
        </TouchableOpacity>

        {/* Notifications bell */}
        <TouchableOpacity onPress={openNotifications} activeOpacity={0.8} style={styles.bellBtn}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          <View style={styles.bellDot} />
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
