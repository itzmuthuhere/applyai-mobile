import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Animated, RefreshControl, SafeAreaView, Image, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { API_ENDPOINTS } from '../../constants';
import { NOTIFICATION_ICON, DEFAULT_NOTIFICATION_ICON } from '../../constants/notificationIcons';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import { RootState, AppDispatch } from '../../store';
import {
  setNotifications, appendNotifications, setUnreadCount, markAllRead, markOneRead,
  SocialNotif,
} from '../../store/slices/notificationSlice';
import WebPageContainer from '../../components/common/WebPageContainer';

interface JobAlert {
  id: number;
  keywords: string;
  remote: boolean;
  minSalary: number | null;
  category: string | null;
  active: boolean;
  createdAt: string;
}

function alertBody(alert: JobAlert): string {
  return [
    alert.remote && 'Remote only',
    alert.minSalary && `Min ₹${Math.round(alert.minSalary / 100_000)}L`,
    alert.category && alert.category,
  ].filter(Boolean).join(' · ') || 'All matching jobs';
}

function SkeletonNotif() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={[styles.item, { opacity }]}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border }} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 13, width: '70%', backgroundColor: colors.border, borderRadius: 6 }} />
        <View style={{ height: 11, width: '90%', backgroundColor: colors.border, borderRadius: 6 }} />
      </View>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();

  const notifications = useSelector((s: RootState) => s.socialNotifications.notifications);
  const hasMore = useSelector((s: RootState) => s.socialNotifications.hasMore);
  const page = useSelector((s: RootState) => s.socialNotifications.page);

  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const { data } = await apiClient.get<JobAlert[]>(API_ENDPOINTS.JOB_ALERTS);
      setAlerts(data.filter(a => a.active));
    } catch {
      // Silently degrade — real notifications can still show without alerts
    }
  }, []);

  const loadNotifications = useCallback(async (reset = false) => {
    try {
      const p = reset ? 0 : page;
      const { data } = await apiClient.get(API_ENDPOINTS.SOCIAL_NOTIFICATIONS, { params: { page: p, size: 20 } });
      const items = data.content ?? [];
      if (reset) dispatch(setNotifications(items));
      else dispatch(appendNotifications(items));
    } catch {
      // Silently degrade — alerts can still show without notifications
    }
  }, [page, dispatch]);

  useEffect(() => {
    (async () => {
      await Promise.all([loadAlerts(), loadNotifications(true)]);
      setLoading(false);
      // Opening this screen is itself the "seen it" signal — clear the bell dot
      // without requiring a separate "Mark all read" tap.
      handleMarkAllRead();
    })();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadAlerts(), loadNotifications(true)]);
    setRefreshing(false);
  }

  async function onEndReached() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await loadNotifications(false);
    setLoadingMore(false);
  }

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

  const renderItem = ({ item }: { item: SocialNotif }) => {
    const { icon, color } = NOTIFICATION_ICON[item.type] ?? DEFAULT_NOTIFICATION_ICON;
    return (
      <TouchableOpacity
        testID={`notif-item-${item.id}`}
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => handleNotifPress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          {item.actor?.profilePicture ? (
            <Image source={{ uri: item.actor.profilePicture }} style={styles.actorAvatar} />
          ) : (
            <Ionicons name={icon} size={22} color={color} />
          )}
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemBodyText} numberOfLines={2}>{item.message}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.itemTime}>{dayjs(item.createdAt).fromNow()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <>
      {alerts.length > 0 && (
        <>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>JOB ALERTS ({alerts.length} active)</Text>
          </View>
          {alerts.map(alert => (
            <View key={`alert-${alert.id}`} style={styles.item}>
              <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="notifications-outline" size={22} color="#2563EB" />
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle} numberOfLines={1}>{`Job Alert: ${alert.keywords}`}</Text>
                <Text style={styles.itemBodyText} numberOfLines={2}>{alertBody(alert)}</Text>
              </View>
            </View>
          ))}
        </>
      )}
      {notifications.length > 0 && (
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>NOTIFICATIONS</Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
      </View>

      {loading ? (
        <WebPageContainer maxWidth={720}>
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map(k => <SkeletonNotif key={k} />)}
        </View>
        </WebPageContainer>
      ) : (
        <WebPageContainer maxWidth={720}>
        <FlatList
          testID="notifications-list"
          data={notifications}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, notifications.length === 0 && alerts.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListHeaderComponent={listHeader}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={
            alerts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="notifications-outline" size={40} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySubtitle}>
                  Set up job alerts on the Jobs tab to get notified when new matching jobs appear.
                </Text>
              </View>
            ) : null
          }
        />
        </WebPageContainer>
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: colors.textPrimary },

  listContent: { paddingBottom: 40 },
  sectionLabel: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionLabelText: {
    fontSize: 11, fontWeight: '800', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  itemUnread: { backgroundColor: '#F0F7FF' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actorAvatar: { width: 44, height: 44, borderRadius: 22 },
  itemBody: { flex: 1 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, flexShrink: 0, marginTop: 5 },
  itemBodyText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 4 },
  itemTime: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  sep: { height: 1, backgroundColor: colors.border, marginHorizontal: 20 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40, marginTop: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  });
}
