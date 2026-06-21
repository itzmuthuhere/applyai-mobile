import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Animated, RefreshControl, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { COLORS, API_ENDPOINTS } from '../../constants';
import apiClient from '../../api/apiClient';

interface JobAlert {
  id: number;
  keywords: string;
  remote: boolean;
  minSalary: number | null;
  category: string | null;
  active: boolean;
  createdAt: string;
}

interface NotifItem {
  id: string;
  type: 'alert' | 'tip' | 'status';
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

// Build notifications from job alerts + static tips
function buildNotifications(alerts: JobAlert[]): NotifItem[] {
  const items: NotifItem[] = [];

  alerts.forEach(alert => {
    items.push({
      id: `alert-${alert.id}`,
      type: 'alert',
      icon: 'notifications-outline',
      iconColor: COLORS.primary,
      iconBg: COLORS.primaryLight,
      title: `Job Alert: ${alert.keywords}`,
      body: [
        alert.remote && 'Remote only',
        alert.minSalary && `Min ₹${Math.round(alert.minSalary / 100_000)}L`,
        alert.category && alert.category,
      ].filter(Boolean).join(' · ') || 'All matching jobs',
      time: dayjs(alert.createdAt).fromNow(),
      read: false,
    });
  });

  // Static motivational/tip notifications
  const tips: NotifItem[] = [
    {
      id: 'tip-profile',
      type: 'tip',
      icon: 'person-circle-outline',
      iconColor: '#7C3AED',
      iconBg: '#F3E8FF',
      title: 'Complete your profile',
      body: 'A complete profile increases your match accuracy by up to 3x.',
      time: '1h ago',
      read: true,
    },
    {
      id: 'tip-resume',
      type: 'tip',
      icon: 'document-text-outline',
      iconColor: '#059669',
      iconBg: '#D1FAE5',
      title: 'Tailor your resume',
      body: 'Use "Tailor Resume" on each job to boost your ATS score.',
      time: '3h ago',
      read: true,
    },
    {
      id: 'tip-interview',
      type: 'tip',
      icon: 'mic-outline',
      iconColor: '#D97706',
      iconBg: '#FEF3C7',
      title: 'Practice mock interviews',
      body: 'Regular practice improves interview confidence. Try a 5-question session today.',
      time: 'Yesterday',
      read: true,
    },
    {
      id: 'tip-ats',
      type: 'tip',
      icon: 'shield-checkmark-outline',
      iconColor: COLORS.primary,
      iconBg: COLORS.primaryLight,
      title: 'Check your ATS score',
      body: '80% of resumes are filtered by ATS before a human sees them. Check yours.',
      time: '2 days ago',
      read: true,
    },
  ];

  return [...items, ...tips];
}

function SkeletonNotif() {
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
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.border }} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 13, width: '70%', backgroundColor: COLORS.border, borderRadius: 6 }} />
        <View style={{ height: 11, width: '90%', backgroundColor: COLORS.border, borderRadius: 6 }} />
      </View>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await apiClient.get<JobAlert[]>(API_ENDPOINTS.JOB_ALERTS);
      setAlerts(data.filter(a => a.active));
    } catch {
      // Silently degrade — show tips even without alerts
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const notifs = buildNotifications(alerts);
  const unreadCount = notifs.filter(n => !n.read && !readSet.has(n.id)).length;

  function markRead(id: string) {
    setReadSet(prev => new Set([...prev, id]));
  }

  function markAllRead() {
    setReadSet(new Set(notifs.map(n => n.id)));
  }

  const renderItem = ({ item }: { item: NotifItem }) => {
    const isRead = item.read || readSet.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.item, !isRead && styles.itemUnread]}
        onPress={() => markRead(item.id)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon} size={22} color={item.iconColor} />
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemTitleRow}>
            <Text style={[styles.itemTitle, !isRead && styles.itemTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {!isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.itemBodyText} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.itemTime}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map(k => <SkeletonNotif key={k} />)}
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, notifs.length === 0 && { flex: 1 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.primary} />
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListHeaderComponent={
            alerts.length > 0 ? (
              <View style={styles.sectionLabel}>
                <Text style={styles.sectionLabelText}>JOB ALERTS ({alerts.length} active)</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>
                Set up job alerts on the Jobs tab to get notified when new matching jobs appear.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 },
  markAllBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: COLORS.primaryLight, borderRadius: 20 },
  markAllText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  listContent: { paddingBottom: 40 },
  sectionLabel: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionLabelText: {
    fontSize: 11, fontWeight: '800', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: COLORS.surface,
  },
  itemUnread: { backgroundColor: '#F0F7FF' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemBody: { flex: 1 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  itemTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  itemTitleUnread: { fontWeight: '800', color: COLORS.textPrimary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, flexShrink: 0 },
  itemBodyText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 4 },
  itemTime: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  sep: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 20 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40, marginTop: 80 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
});
