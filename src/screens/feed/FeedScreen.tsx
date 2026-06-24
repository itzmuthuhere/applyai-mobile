import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  SafeAreaView, RefreshControl, TextInput, ActivityIndicator, Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RootState, AppDispatch } from '../../store';
import { setPosts, appendPosts, removePost, setReaction, FeedPost } from '../../store/slices/feedSlice';
import { COLORS, API_ENDPOINTS } from '../../constants';
import apiClient from '../../api/apiClient';

dayjs.extend(relativeTime);

const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍', CELEBRATE: '🎉', SUPPORT: '🤝', LOVE: '❤️', INSIGHTFUL: '💡', FUNNY: '😄',
};

const REACTION_COLORS: Record<string, string> = {
  LIKE: '#2563EB', CELEBRATE: '#F59E0B', SUPPORT: '#10B981',
  LOVE: '#EF4444', INSIGHTFUL: '#8B5CF6', FUNNY: '#F97316',
};

function Avatar({ uri, name, size = 40 }: { uri?: string; name?: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.4 }}>
        {(name ?? '?').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function ReactionPicker({ onPick }: { onPick: (r: string) => void }) {
  return (
    <View style={styles.reactionPicker}>
      {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => (
        <TouchableOpacity key={key} onPress={() => onPick(key)} style={styles.reactionPickerBtn} activeOpacity={0.7}>
          <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId: number }) {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const [showPicker, setShowPicker] = useState(false);
  const pickerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myReaction = post.myReaction;

  async function handleReact(type: string) {
    setShowPicker(false);
    const removing = myReaction === type;
    const prevReaction = myReaction;
    const prevLikes = post.likesCount;

    // Optimistic update
    dispatch(setReaction({
      postId: post.id,
      reaction: removing ? null : type,
      likesCount: removing ? post.likesCount - 1 : prevReaction ? post.likesCount : post.likesCount + 1,
    }));

    try {
      if (removing) {
        await apiClient.delete(API_ENDPOINTS.FEED_REACT(post.id));
      } else {
        await apiClient.post(API_ENDPOINTS.FEED_REACT(post.id), { type });
      }
    } catch {
      // Revert on failure
      dispatch(setReaction({ postId: post.id, reaction: prevReaction ?? null, likesCount: prevLikes }));
    }
  }

  async function handleDelete() {
    try {
      await apiClient.delete(`${API_ENDPOINTS.FEED}/${post.id}`);
      dispatch(removePost(post.id));
    } catch {}
  }

  function openReactionPicker() {
    if (pickerTimeout.current) clearTimeout(pickerTimeout.current);
    setShowPicker(true);
    pickerTimeout.current = setTimeout(() => setShowPicker(false), 3000);
  }

  return (
    <View style={styles.card}>
      {/* Author row */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => navigation.navigate('PublicProfile', { userId: post.author.id, userName: post.author.name })}
          activeOpacity={0.8}
        >
          <Avatar uri={post.author.profilePicture} name={post.author.name} size={44} />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            {post.author.headline ? (
              <Text style={styles.authorHeadline} numberOfLines={1}>{post.author.headline}</Text>
            ) : null}
            <Text style={styles.postTime}>{dayjs(post.createdAt).fromNow()}</Text>
          </View>
        </TouchableOpacity>
        {post.author.id === currentUserId && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Reaction counts */}
      {post.likesCount > 0 || post.commentsCount > 0 ? (
        <View style={styles.countRow}>
          {post.likesCount > 0 && (
            <Text style={styles.countText}>
              {myReaction ? REACTION_EMOJIS[myReaction] : '👍'} {post.likesCount}
            </Text>
          )}
          {post.commentsCount > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: post.id })}>
              <Text style={styles.countText}>{post.commentsCount} comment{post.commentsCount !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Action bar */}
      <View style={styles.actions}>
        <View>
          <TouchableOpacity
            testID={`react-btn-${post.id}`}
            style={styles.actionBtn}
            onPress={() => myReaction ? handleReact(myReaction) : openReactionPicker()}
            onLongPress={openReactionPicker}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionEmoji, myReaction ? { opacity: 1 } : { opacity: 0.5 }]}>
              {myReaction ? REACTION_EMOJIS[myReaction] : '👍'}
            </Text>
            <Text style={[styles.actionLabel, myReaction ? { color: REACTION_COLORS[myReaction] } : {}]}>
              {myReaction ? myReaction.charAt(0) + myReaction.slice(1).toLowerCase() : 'Like'}
            </Text>
          </TouchableOpacity>
          {showPicker && <ReactionPicker onPick={handleReact} />}
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionLabel}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('ChatDetail', {
            partnerId: post.author.id,
            partnerName: post.author.name,
            partnerPicture: post.author.profilePicture,
          })}
          activeOpacity={0.7}
        >
          <Ionicons name="send-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionLabel}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const posts = useSelector((s: RootState) => s.feed.posts);
  const hasMore = useSelector((s: RootState) => s.feed.hasMore);
  const page = useSelector((s: RootState) => s.feed.page);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(posts.length === 0);

  async function loadFeed(reset = false) {
    if (reset) {
      setRefreshing(true);
    }
    try {
      const p = reset ? 0 : page;
      const { data } = await apiClient.get(API_ENDPOINTS.FEED, { params: { page: p, size: 20 } });
      const items = data.content ?? [];
      if (reset) {
        dispatch(setPosts(items));
      } else {
        dispatch(appendPosts(items));
      }
    } catch {}
    setInitialLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }

  useEffect(() => { loadFeed(true); }, []);

  function loadMore() {
    if (!hasMore || loadingMore || refreshing) return;
    setLoadingMore(true);
    loadFeed(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo}>
            <Text style={styles.headerLogoText}>A</Text>
          </View>
          <Text style={styles.headerTitle}>Feed</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('ChatList')} style={styles.headerBtn}>
            <Ionicons name="chatbubbles-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('CreatePost')} style={styles.createBtn}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {initialLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <PostCard post={item} currentUserId={user?.id ?? -1} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadFeed(true)} tintColor={COLORS.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={COLORS.primary} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptySub}>Be the first to post a career update!</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreatePost')}>
                <Text style={styles.emptyBtnText}>Create a post</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={posts.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerLogoText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { padding: 6 },
  createBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: COLORS.surface, marginHorizontal: 12, marginTop: 10,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'visible',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 14, paddingBottom: 10,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  avatarFallback: { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  authorHeadline: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  postTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  deleteBtn: { padding: 6 },

  postContent: {
    fontSize: 15, color: COLORS.textPrimary, lineHeight: 22,
    paddingHorizontal: 14, paddingBottom: 12,
  },

  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 8,
  },
  countText: { fontSize: 12, color: COLORS.textSecondary },

  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 14 },

  actions: {
    flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 4, gap: 0,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 10,
  },
  actionEmoji: { fontSize: 18 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

  reactionPicker: {
    position: 'absolute', bottom: 44, left: 0,
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderRadius: 30, paddingHorizontal: 8, paddingVertical: 6, gap: 4,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
    zIndex: 99,
  },
  reactionPickerBtn: { padding: 4 },
  reactionPickerEmoji: { fontSize: 26 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
