import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  SafeAreaView, ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RootState } from '../../store';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import { FeedStackParamList } from '../../navigation/types';
import WebPageContainer from '../../components/common/WebPageContainer';

dayjs.extend(relativeTime);

type RouteT = RouteProp<FeedStackParamList, 'HashtagFeed'>;

interface HPost {
  id: number;
  content: string;
  imageUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author: { id: number; name: string; headline?: string; profilePicture?: string | null };
}

function RichContent({ content, colors, navigation }: { content: string; colors: AppColors; navigation: any }) {
  const parts = content.split(/(#\w+|@\w+)/g);
  return (
    <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 20 }}>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          const tag = part.slice(1);
          return (
            <Text key={i} style={{ color: colors.primary, fontWeight: '700' }}
              onPress={() => navigation.replace('HashtagFeed', { tag })}>
              {part}
            </Text>
          );
        }
        if (part.startsWith('@')) {
          return <Text key={i} style={{ color: colors.primary, fontWeight: '700' }}>{part}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

export default function HashtagFeedScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { tag } = route.params;
  const currentUser = useSelector((s: RootState) => s.auth.user);

  const [posts, setPosts] = useState<HPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (reset = false) => {
    if (reset) setRefreshing(true);
    const p = reset ? 0 : page;
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.FEED_HASHTAG(tag), { params: { page: p, size: 20 } });
      const items = data.content ?? [];
      if (reset) {
        setPosts(items);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...items]);
        setPage(p + 1);
      }
      setHasMore(!data.last);
    } catch {}
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }, [tag, page]);

  useEffect(() => { load(true); }, [tag]);

  function loadMore() {
    if (!hasMore || loadingMore || refreshing) return;
    setLoadingMore(true);
    load(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>#{tag}</Text>
        <View style={{ width: 34 }} />
      </View>

      <WebPageContainer maxWidth={640}>
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          testID="hashtag-feed-list"
          data={posts}
          keyExtractor={item => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyHash}>#{tag}</Text>
              <Text style={styles.emptyText}>No posts yet with this hashtag.</Text>
              <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreatePost')}>
                <Text style={styles.createBtnText}>Be the first to post #{tag}</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={posts.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              activeOpacity={0.85}
            >
              <TouchableOpacity
                style={styles.authorRow}
                onPress={() => navigation.navigate('PublicProfile', { userId: item.author.id, userName: item.author.name })}
              >
                {item.author.profilePicture ? (
                  <Image source={{ uri: item.author.profilePicture }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarText}>{item.author.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{item.author.name}</Text>
                  {item.author.headline ? <Text style={styles.authorHeadline} numberOfLines={1}>{item.author.headline}</Text> : null}
                  <Text style={styles.postTime}>{dayjs(item.createdAt).fromNow()}</Text>
                </View>
              </TouchableOpacity>

              <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                <RichContent content={item.content} colors={colors} navigation={navigation} />
              </View>

              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
              ) : item.attachmentUrl ? (
                <TouchableOpacity
                  style={styles.attachRow}
                  onPress={() => Linking.openURL(item.attachmentUrl!)}
                >
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                  <Text style={styles.attachName} numberOfLines={1}>{item.attachmentName ?? 'Attachment'}</Text>
                </TouchableOpacity>
              ) : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>👍 {item.likesCount}  💬 {item.commentsCount}</Text>
              </View>
            </TouchableOpacity>
          )}
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.primary },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyHash: { fontSize: 28, fontWeight: '900', color: colors.primary },
  emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  createBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: colors.surface, marginHorizontal: 12, marginTop: 10,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  authorHeadline: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  postTime: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  postImage: { width: '100%', height: 180 },
  attachRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginBottom: 10,
    backgroundColor: colors.background, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  attachName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  metaRow: { paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  });
}
