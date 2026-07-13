import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RootState, AppDispatch } from '../../store';
import {
  setNotifications, appendNotifications, setUnreadCount, markAllRead, markOneRead,
  SocialNotif,
} from '../../store/slices/notificationSlice';
import { API_ENDPOINTS } from '../../constants';
import { NOTIFICATION_ICON, DEFAULT_NOTIFICATION_ICON } from '../../constants/notificationIcons';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import WebPageContainer from '../../components/common/WebPageContainer';

dayjs.extend(relativeTime);

export default function SocialNotificationsScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector((s: RootState) => s.socialNotifications.notifications);
  const hasMore = useSelector((s: RootState) => s.socialNotifications.hasMore);
  const page = useSelector((s: RootState) => s.socialNotifications.page);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(notifications.length === 0);

  const loadNotifications = useCallback(async (reset = false) => {
    try {
      const p = reset ? 0 : page;
      const { data } = await apiClient.get(API_ENDPOINTS.SOCIAL_NOTIFICATIONS, { params: { page: p, size: 20 } });
      const items = data.content ?? [];
      if (reset) {
        dispatch(setNotifications(items));
      } else {
        dispatch(appendNotifications(items));
      }
    } catch {}
    setInitialLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }, [page]);

  useEffect(() => {
    (async () => {
      await loadNotifications(true);
      // Opening this screen is itself the "seen it" signal — clear the bell dot
      // without requiring a separate "Mark all read" tap.
      handleMarkAllRead();
    })();
  }, []);

  async function handleMarkAllRead() {
    try {
      await apiClient.post(API_ENDPOINTS.SOCIAL_NOTIFICATIONS_READ_ALL);
      dispatch(markAllRead());
      dispatch(setUnreadCount(0));
    } catch {}
  }

  function handleNotifPress(item: SocialNotif) {
    if (!item.read) {
      apiClient.patch(API_ENDPOINTS.SOCIAL_NOTIFICATION_READ(item.id)).catch(() => {});
      dispatch(markOneRead(item.id));
    }
    if (item.type === 'DM' && item.actor) {
      navigation.navigate('ChatDetail', {
        partnerId: item.actor.id,
        partnerName: item.actor.name,
        partnerPicture: item.actor.profilePicture,
      });
    } else if (item.postId) {
      navigation.navigate('PostDetail', { postId: item.postId });
    } else if (item.actor) {
      navigation.navigate('PublicProfile', { userId: item.actor.id, userName: item.actor.name });
    }
  }

  function renderItem({ item }: { item: SocialNotif }) {
    const { icon, color } = NOTIFICATION_ICON[item.type] ?? DEFAULT_NOTIFICATION_ICON;
    return (
      <TouchableOpacity
        testID={`notif-item-${item.id}`}
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => handleNotifPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          {item.actor?.profilePicture ? (
            <Image source={{ uri: item.actor.profilePicture }} style={styles.actorAvatar} />
          ) : (
            <Ionicons name={icon} size={22} color={color} />
          )}
        </View>
        <View style={styles.textCol}>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.time}>{dayjs(item.createdAt).fromNow()}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 22 }} />
      </View>

      <WebPageContainer maxWidth={720}>
      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          testID="notifications-list"
          data={notifications}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(true); }} tintColor={colors.primary} />
          }
          onEndReached={() => {
            if (!hasMore || loadingMore) return;
            setLoadingMore(true);
            loadNotifications(false);
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={52} color={colors.border} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          contentContainerStyle={notifications.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      </WebPageContainer>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },

  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  itemUnread: { backgroundColor: colors.primaryLight },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  actorAvatar: { width: 44, height: 44, borderRadius: 22 },
  textCol: { flex: 1 },
  message: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, flexShrink: 0 },
  });
}
