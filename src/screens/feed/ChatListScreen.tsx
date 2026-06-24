import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RootState, AppDispatch } from '../../store';
import { setConversations, Conversation } from '../../store/slices/chatSlice';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';

dayjs.extend(relativeTime);

export default function ChatListScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const conversations = useSelector((s: RootState) => s.chat.conversations);
  const [loading, setLoading] = useState(conversations.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.CHAT_CONVERSATIONS);
      dispatch(setConversations(data));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [dispatch]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  function renderConversation({ item }: { item: Conversation }) {
    const initial = (item.partnerName ?? '?').charAt(0).toUpperCase();
    return (
      <TouchableOpacity
        testID={`conv-item-${item.partnerId}`}
        style={styles.convItem}
        onPress={() => navigation.navigate('ChatDetail', {
          partnerId: item.partnerId,
          partnerName: item.partnerName,
          partnerPicture: item.partnerProfilePicture,
        })}
        activeOpacity={0.75}
      >
        {item.partnerProfilePicture ? (
          <Image source={{ uri: item.partnerProfilePicture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}

        <View style={styles.convBody}>
          <View style={styles.convTop}>
            <Text style={styles.partnerName} numberOfLines={1}>{item.partnerName}</Text>
            <Text style={styles.convTime}>{dayjs(item.lastMessageAt).fromNow(true)}</Text>
          </View>
          {item.partnerHeadline ? (
            <Text style={styles.partnerHeadline} numberOfLines={1}>{item.partnerHeadline}</Text>
          ) : null}
          <Text style={[styles.lastMsg, item.unreadCount > 0 && styles.lastMsgUnread]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>

        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => String(item.partnerId)}
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadConversations(true)} tintColor={colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={52} color={colors.border} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySub}>Tap Message on someone's post or profile to start a chat</Text>
            </View>
          }
          contentContainerStyle={conversations.length === 0 ? { flex: 1 } : {}}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  convItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },

  convBody: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  partnerName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, flex: 1, marginRight: 8 },
  convTime: { fontSize: 11, color: colors.textMuted },
  partnerHeadline: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  lastMsg: { fontSize: 13, color: colors.textSecondary },
  lastMsgUnread: { color: colors.textPrimary, fontWeight: '700' },

  unreadBadge: {
    backgroundColor: colors.primary, borderRadius: 12, minWidth: 22,
    height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  separator: { height: 1, backgroundColor: colors.border, marginLeft: 80 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  });
}