import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  SafeAreaView, RefreshControl, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RootState, AppDispatch } from '../../store';
import { setPosts, appendPosts, prependPost, removePost, setReaction, updatePost, FeedPost } from '../../store/slices/feedSlice';
import { setUnreadCount } from '../../store/slices/notificationSlice';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import WebPageContainer from '../../components/common/WebPageContainer';

dayjs.extend(relativeTime);

const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍', CELEBRATE: '🎉', SUPPORT: '🤝', LOVE: '❤️', INSIGHTFUL: '💡', FUNNY: '😄',
};

const REACTION_COLORS: Record<string, string> = {
  LIKE: '#2563EB', CELEBRATE: '#F59E0B', SUPPORT: '#10B981',
  LOVE: '#EF4444', INSIGHTFUL: '#8B5CF6', FUNNY: '#F97316',
};

const SEE_MORE_THRESHOLD = 280;

function Avatar({ uri, name, size = 40 }: { uri?: string | null; name?: string; size?: number }) {
  const colors = useTheme();
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.4 }}>
        {(name ?? '?').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function RichContent({ content, colors, navigation }: { content: string; colors: AppColors; navigation: any }) {
  const parts = React.useMemo(() => content.split(/(#\w+|@\w+)/g), [content]);
  return (
    <Text style={{ fontSize: 15, color: colors.textPrimary, lineHeight: 22 }}>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          const tag = part.slice(1);
          return (
            <Text key={i} style={{ color: colors.primary, fontWeight: '700' }}
              onPress={() => navigation.navigate('HashtagFeed', { tag })}>
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

function ExpandableContent({ content, colors, navigation }: { content: string; colors: AppColors; navigation: any }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > SEE_MORE_THRESHOLD;
  const displayed = isLong && !expanded ? content.slice(0, SEE_MORE_THRESHOLD) + '…' : content;

  return (
    <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
      <RichContent content={displayed} colors={colors} navigation={navigation} />
      {isLong && (
        <TouchableOpacity
          testID="see-more-btn"
          onPress={() => setExpanded(e => !e)}
          activeOpacity={0.7}
          style={{ marginTop: 4 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
            {expanded ? 'See less' : 'See more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ReactionPicker({ onPick }: { onPick: (r: string) => void }) {
  const colors = useTheme();
  return (
    <View style={{
      position: 'absolute', bottom: 44, left: 0,
      flexDirection: 'row', backgroundColor: colors.surface,
      borderRadius: 30, paddingHorizontal: 8, paddingVertical: 6, gap: 4,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
      zIndex: 99,
    }}>
      {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => (
        <TouchableOpacity key={key} onPress={() => onPick(key)} style={{ padding: 4 }} activeOpacity={0.7}>
          <Text style={{ fontSize: 26 }}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AttachmentRow({ post, colors }: { post: FeedPost; colors: AppColors }) {
  if (post.imageUrl) {
    return (
      <Image
        source={{ uri: post.imageUrl }}
        style={{ width: '100%', height: 220, marginBottom: 0 }}
        resizeMode="cover"
      />
    );
  }
  if (post.attachmentUrl) {
    const icon = post.attachmentType === 'PDF' ? 'document-text-outline' : 'document-outline';
    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          marginHorizontal: 14, marginBottom: 10,
          backgroundColor: colors.background, borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: colors.border,
        }}
        onPress={() => Linking.openURL(post.attachmentUrl!)}
        activeOpacity={0.8}
      >
        <Ionicons name={icon} size={24} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
            {post.attachmentName ?? 'Attachment'}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>{post.attachmentType}</Text>
        </View>
        <Ionicons name="download-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  }
  return null;
}

const PostCard = React.memo(function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId: number }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const [showPicker, setShowPicker] = useState(false);
  const pickerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (pickerTimeout.current) clearTimeout(pickerTimeout.current); };
  }, []);

  const myReaction = post.myReaction;

  const handleReact = useCallback(async (type: string) => {
    setShowPicker(false);
    if (pickerTimeout.current) clearTimeout(pickerTimeout.current);
    const removing = myReaction === type;
    const prevReaction = myReaction;
    const prevLikes = post.likesCount;

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
      dispatch(setReaction({ postId: post.id, reaction: prevReaction ?? null, likesCount: prevLikes }));
    }
  }, [post.id, post.likesCount, myReaction, dispatch]);

  function handleDelete() {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            dispatch(removePost(post.id));
            try {
              await apiClient.delete(`${API_ENDPOINTS.FEED}/${post.id}`);
            } catch {
              dispatch(prependPost(post));
              Alert.alert('Delete failed', 'Could not delete the post. Please try again.');
            }
          },
        },
      ]
    );
  }

  function handleEdit() {
    navigation.navigate('CreatePost', { editPost: post });
  }

  function openReactionPicker() {
    if (pickerTimeout.current) clearTimeout(pickerTimeout.current);
    setShowPicker(true);
    pickerTimeout.current = setTimeout(() => setShowPicker(false), 3000);
  }

  return (
    <View style={styles.card}>
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
          <View style={styles.ownerActions}>
            <TouchableOpacity testID={`edit-btn-${post.id}`} onPress={handleEdit} style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity testID={`delete-btn-${post.id}`} onPress={handleDelete} style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ExpandableContent content={post.content} colors={colors} navigation={navigation} />

      <AttachmentRow post={post} colors={colors} />

      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <View style={styles.countRow}>
          {post.likesCount > 0 && (
            <Text style={styles.countText}>
              {myReaction ? REACTION_EMOJIS[myReaction] : '👍'} {post.likesCount}
            </Text>
          )}
          {post.commentsCount > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: post.id })}>
              <Text style={styles.countText}>
                {post.commentsCount} comment{post.commentsCount !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.actions}>
        <View style={{ flex: 1, position: 'relative' }}>
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
          <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.actionLabel}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('ChatDetail', {
            partnerId: post.author.id,
            partnerName: post.author.name,
            partnerPicture: post.author.profilePicture ?? undefined,
          })}
          activeOpacity={0.7}
        >
          <Ionicons name="send-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.actionLabel}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}, (prev, next) => prev.post.id === next.post.id &&
   prev.post.likesCount === next.post.likesCount &&
   prev.post.commentsCount === next.post.commentsCount &&
   prev.post.myReaction === next.post.myReaction &&
   prev.post.content === next.post.content &&
   prev.currentUserId === next.currentUserId);

export default function FeedScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const posts = useSelector((s: RootState) => s.feed.posts);
  const hasMore = useSelector((s: RootState) => s.feed.hasMore);
  const page = useSelector((s: RootState) => s.feed.page);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(posts.length === 0);

  // Ref guard prevents duplicate in-flight requests regardless of React render timing.
  // React state updates are async — two rapid onEndReached calls both see loadingMore=false
  // before the first setLoadingMore(true) commits. The ref is synchronously set.
  const inFlightRef = useRef(false);

  const loadFeed = useCallback(async (reset = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (reset) {
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const p = reset ? 0 : page;
      const { data } = await apiClient.get(API_ENDPOINTS.FEED, { params: { page: p, size: 20 } });
      const items: FeedPost[] = data.content ?? [];
      if (reset) {
        dispatch(setPosts(items));
      } else {
        dispatch(appendPosts(items));
      }
    } catch {}

    inFlightRef.current = false;
    setInitialLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }, [page, dispatch]);

  async function loadUnreadCount() {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.SOCIAL_NOTIFICATIONS_UNREAD);
      dispatch(setUnreadCount(data.count ?? 0));
    } catch {}
  }

  useEffect(() => {
    loadFeed(true);
    loadUnreadCount();
  }, []);

  // Refresh unread count (cheap) each time the screen comes into focus.
  // Full feed refresh only if there are no posts (e.g., first ever load after login).
  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [])
  );

  const loadMore = useCallback(() => {
    if (!hasMore || inFlightRef.current) return;
    loadFeed(false);
  }, [hasMore, loadFeed]);

  const onRefresh = useCallback(() => {
    loadFeed(true);
  }, [loadFeed]);

  const renderItem = useCallback(({ item }: { item: FeedPost }) => (
    <PostCard post={item} currentUserId={user?.id ?? -1} />
  ), [user?.id]);

  return (
    <SafeAreaView style={styles.safe}>
      <WebPageContainer maxWidth={640}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo}>
            <Text style={styles.headerLogoText}>A</Text>
          </View>
          <Text style={styles.headerTitle}>Feed</Text>
        </View>
        <TouchableOpacity
          testID="feed-create-post-btn"
          onPress={() => navigation.navigate('CreatePost')}
          style={styles.createBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      {initialLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={10}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ padding: 16 }} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="newspaper-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptySub}>
                Your feed fills up as you follow people and share updates — search for people to follow, or be the first to post.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CreatePost')} activeOpacity={0.85}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>Create a post</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emptySecondaryBtn}
                onPress={() => navigation.navigate('Search', { initialQuery: '' })}
                activeOpacity={0.7}
              >
                <Text style={styles.emptySecondaryBtnText}>Find people to follow</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={posts.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerLogoText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 36, borderRadius: 18, backgroundColor: colors.primary,
    paddingHorizontal: 14,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: colors.surface, marginHorizontal: 12, marginTop: 10,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 14, paddingBottom: 10,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  authorHeadline: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  postTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  ownerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: 6 },

  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 8,
  },
  countText: { fontSize: 12, color: colors.textSecondary },

  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },

  actions: { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 10,
  },
  actionEmoji: { fontSize: 18 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 10 },
  emptyIcon: {
    width: 84, height: 84, borderRadius: 28,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.border, marginBottom: 6,
  },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: colors.textPrimary },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: 14,
    paddingHorizontal: 26, paddingVertical: 13, marginTop: 10,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptySecondaryBtn: { marginTop: 4, padding: 6 },
  emptySecondaryBtnText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  });
}
