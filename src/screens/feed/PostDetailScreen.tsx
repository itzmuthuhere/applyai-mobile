import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  SafeAreaView, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RootState, AppDispatch } from '../../store';
import {
  incrementComments, decrementComments, setReaction, FeedPost,
} from '../../store/slices/feedSlice';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import { FeedStackParamList } from '../../navigation/types';

dayjs.extend(relativeTime);

type RouteT = RouteProp<FeedStackParamList, 'PostDetail'>;

interface Comment {
  id: number;
  author: { id: number; name: string; profilePicture?: string };
  content: string;
  createdAt: string;
}

const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍', CELEBRATE: '🎉', SUPPORT: '🤝', LOVE: '❤️', INSIGHTFUL: '💡', FUNNY: '😄',
};
const REACTION_COLORS: Record<string, string> = {
  LIKE: '#2563EB', CELEBRATE: '#F59E0B', SUPPORT: '#10B981',
  LOVE: '#EF4444', INSIGHTFUL: '#8B5CF6', FUNNY: '#F97316',
};

function ReactionPicker({ onPick, colors }: { onPick: (r: string) => void; colors: AppColors }) {
  return (
    <View style={{
      flexDirection: 'row', backgroundColor: colors.surface,
      borderRadius: 30, paddingHorizontal: 8, paddingVertical: 6, gap: 4,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
    }}>
      {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => (
        <TouchableOpacity key={key} testID={`reaction-option-${key}`} onPress={() => onPick(key)}
          style={{ padding: 4 }} activeOpacity={0.7}>
          <Text style={{ fontSize: 26 }}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function PostDetailScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const dispatch = useDispatch<AppDispatch>();
  const { postId } = route.params;

  const user = useSelector((s: RootState) => s.auth.user);
  const reduxPost = useSelector((s: RootState) => s.feed.posts.find(p => p.id === postId));

  // Local post state — seeded from Redux; falls back to API fetch
  const [localPost, setLocalPost] = useState<FeedPost | null>(reduxPost ?? null);
  const [postLoading, setPostLoading] = useState(!reduxPost);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsPage, setCommentsPage] = useState(0);
  const [commentsHasMore, setCommentsHasMore] = useState(true);
  const loadingMoreComments = useRef(false);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Edit comment state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Reaction picker
  const [showPicker, setShowPicker] = useState(false);
  const pickerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (pickerTimeout.current) clearTimeout(pickerTimeout.current); };
  }, []);

  // Fetch post from API when not in Redux (e.g. navigated from notification)
  useEffect(() => {
    if (!reduxPost) {
      apiClient.get(API_ENDPOINTS.FEED_POST(postId))
        .then(({ data }) => setLocalPost(data))
        .catch(() => {})
        .finally(() => setPostLoading(false));
    }
  }, [postId, reduxPost]);

  // Keep local post in sync with Redux (reactions/counts updated by FeedScreen)
  useEffect(() => {
    if (reduxPost) setLocalPost(reduxPost);
  }, [reduxPost]);

  const loadComments = useCallback(async (page: number, reset = false) => {
    if (loadingMoreComments.current) return;
    loadingMoreComments.current = true;
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.FEED_COMMENTS(postId), {
        params: { page, size: 20 },
      });
      const items: Comment[] = data.content ?? [];
      setComments(prev => reset ? items : [...prev, ...items]);
      setCommentsHasMore(!data.last);
      setCommentsPage(page);
    } catch {}
    loadingMoreComments.current = false;
    setCommentsLoading(false);
  }, [postId]);

  useEffect(() => { loadComments(0, true); }, [loadComments]);

  function loadMoreComments() {
    if (!commentsHasMore || loadingMoreComments.current) return;
    loadComments(commentsPage + 1, false);
  }

  // ── Reaction ────────────────────────────────────────────────────────────────

  function openReactionPicker() {
    if (pickerTimeout.current) clearTimeout(pickerTimeout.current);
    setShowPicker(true);
    pickerTimeout.current = setTimeout(() => setShowPicker(false), 3000);
  }

  async function handleReact(type: string) {
    setShowPicker(false);
    if (pickerTimeout.current) clearTimeout(pickerTimeout.current);
    if (!localPost) return;

    const prevReaction = localPost.myReaction;
    const prevLikes = localPost.likesCount;
    const removing = prevReaction === type;
    const newReaction = removing ? null : type;
    const newLikes = removing
      ? prevLikes - 1
      : prevReaction ? prevLikes : prevLikes + 1;

    // Optimistic update
    setLocalPost(p => p ? { ...p, myReaction: newReaction, likesCount: newLikes } : p);
    dispatch(setReaction({ postId, reaction: newReaction, likesCount: newLikes }));

    try {
      if (removing) {
        const { data } = await apiClient.delete(API_ENDPOINTS.FEED_REACT(postId));
        setLocalPost(p => p ? { ...p, myReaction: null, likesCount: data.likesCount } : p);
        dispatch(setReaction({ postId, reaction: null, likesCount: data.likesCount }));
      } else {
        const { data } = await apiClient.post(API_ENDPOINTS.FEED_REACT(postId), { type });
        setLocalPost(p => p ? { ...p, myReaction: data.myReaction, likesCount: data.likesCount } : p);
        dispatch(setReaction({ postId, reaction: data.myReaction, likesCount: data.likesCount }));
      }
    } catch {
      setLocalPost(p => p ? { ...p, myReaction: prevReaction ?? null, likesCount: prevLikes } : p);
      dispatch(setReaction({ postId, reaction: prevReaction ?? null, likesCount: prevLikes }));
    }
  }

  // ── Send comment ─────────────────────────────────────────────────────────────

  async function sendComment() {
    if (!inputText.trim() || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.FEED_COMMENTS(postId), { content: text });
      setComments(prev => [...prev, data]);
      dispatch(incrementComments(postId));
      setLocalPost(p => p ? { ...p, commentsCount: (p.commentsCount ?? 0) + 1 } : p);
    } catch {
      setInputText(text);
    }
    setSending(false);
  }

  // ── Edit comment ─────────────────────────────────────────────────────────────

  function startEditComment(comment: Comment) {
    setEditingId(comment.id);
    setEditingText(comment.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText('');
  }

  async function saveEdit() {
    if (!editingText.trim() || savingEdit || editingId === null) return;
    setSavingEdit(true);
    const id = editingId;
    const text = editingText.trim();
    try {
      await apiClient.put(API_ENDPOINTS.FEED_COMMENT(postId, id), { content: text });
      setComments(prev => prev.map(c => c.id === id ? { ...c, content: text } : c));
      setEditingId(null);
      setEditingText('');
    } catch {}
    setSavingEdit(false);
  }

  // ── Delete comment ───────────────────────────────────────────────────────────

  async function deleteComment(commentId: number) {
    try {
      await apiClient.delete(API_ENDPOINTS.FEED_COMMENT_DELETE(postId, commentId));
      setComments(prev => prev.filter(c => c.id !== commentId));
      dispatch(decrementComments(postId));
      setLocalPost(p => p ? { ...p, commentsCount: Math.max(0, (p.commentsCount ?? 1) - 1) } : p);
    } catch {}
  }

  function onLongPressComment(comment: Comment) {
    if (comment.author.id !== user?.id) return;
    Alert.alert('Comment', undefined, [
      { text: 'Edit', onPress: () => startEditComment(comment) },
      { text: 'Delete', style: 'destructive', onPress: () => deleteComment(comment.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  // ── Renderers ────────────────────────────────────────────────────────────────

  function renderComment({ item }: { item: Comment }) {
    const isOwn = item.author.id === user?.id;
    const isEditing = editingId === item.id;

    return (
      <TouchableOpacity
        testID={`comment-item-${item.id}`}
        activeOpacity={isOwn ? 0.7 : 1}
        onLongPress={() => onLongPressComment(item)}
        style={styles.comment}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('PublicProfile', { userId: item.author.id, userName: item.author.name })}
        >
          {item.author.profilePicture ? (
            <Image source={{ uri: item.author.profilePicture }} style={styles.commentAvatar} />
          ) : (
            <View style={[styles.commentAvatar, styles.commentAvatarFallback]}>
              <Text style={styles.commentAvatarText}>{item.author.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.commentBubble}>
          <Text style={styles.commentAuthor}>{item.author.name}</Text>

          {isEditing ? (
            <View>
              <TextInput
                testID="edit-comment-input"
                style={styles.editInput}
                value={editingText}
                onChangeText={setEditingText}
                multiline
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity testID="edit-save-btn" onPress={saveEdit} disabled={savingEdit}
                  style={[styles.editBtn, styles.editBtnPrimary]}>
                  {savingEdit
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.editBtnPrimaryText}>Save</Text>}
                </TouchableOpacity>
                <TouchableOpacity testID="edit-cancel-btn" onPress={cancelEdit}
                  style={[styles.editBtn, styles.editBtnSecondary]}>
                  <Text style={styles.editBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.commentContent}>{item.content}</Text>
              <Text style={styles.commentTime}>{dayjs(item.createdAt).fromNow()}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  const myReaction = localPost?.myReaction ?? null;

  const postHeader = localPost ? (
    <View style={styles.postCard}>
      {/* Author row */}
      <TouchableOpacity
        style={styles.postAuthorRow}
        onPress={() => navigation.navigate('PublicProfile', {
          userId: localPost.author.id, userName: localPost.author.name,
        })}
      >
        {localPost.author.profilePicture ? (
          <Image source={{ uri: localPost.author.profilePicture }} style={styles.postAvatar} />
        ) : (
          <View style={[styles.postAvatar, styles.postAvatarFallback]}>
            <Text style={styles.postAvatarText}>{localPost.author.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View>
          <Text style={styles.postAuthorName}>{localPost.author.name}</Text>
          {localPost.author.headline ? (
            <Text style={styles.postAuthorHeadline}>{localPost.author.headline}</Text>
          ) : null}
          <Text style={styles.postTime}>{dayjs(localPost.createdAt).fromNow()}</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.postContent}>{localPost.content}</Text>

      {/* Stats */}
      {(localPost.likesCount > 0 || localPost.commentsCount > 0) && (
        <View style={styles.postStats}>
          {localPost.likesCount > 0 && (
            <Text testID="post-likes-count" style={styles.postStatText}>
              {myReaction ? REACTION_EMOJIS[myReaction] : '👍'} {localPost.likesCount}
            </Text>
          )}
          {localPost.commentsCount > 0 && (
            <Text testID="post-comments-count" style={styles.postStatText}>
              {localPost.commentsCount} {localPost.commentsCount === 1 ? 'comment' : 'comments'}
            </Text>
          )}
        </View>
      )}

      {/* Reaction action bar */}
      <View style={styles.divider} />
      <View style={styles.actions}>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            testID="detail-react-btn"
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
          {showPicker && (
            <View style={styles.pickerContainer}>
              <ReactionPicker onPick={handleReact} colors={colors} />
            </View>
          )}
        </View>
      </View>
      <View style={styles.divider} />

      <View style={styles.commentsDivider}>
        <Text style={styles.commentsLabel}>
          {localPost.commentsCount} {localPost.commentsCount === 1 ? 'Comment' : 'Comments'}
        </Text>
      </View>
    </View>
  ) : postLoading ? (
    <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
  ) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity testID="back-btn" onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 34 }} />
        </View>

        <FlatList
          data={comments}
          keyExtractor={item => String(item.id)}
          renderItem={renderComment}
          ListHeaderComponent={postHeader}
          ListEmptyComponent={
            commentsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
            ) : (
              <Text style={styles.noComments}>No comments yet. Be the first!</Text>
            )
          }
          ListFooterComponent={
            commentsHasMore && !commentsLoading ? (
              <TouchableOpacity testID="load-more-comments" onPress={loadMoreComments}
                style={styles.loadMoreBtn}>
                <Text style={styles.loadMoreText}>Load more comments</Text>
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreComments}
          onEndReachedThreshold={0.4}
        />

        <View style={styles.inputRow}>
          <View style={styles.inputAvatarCircle}>
            <Text style={styles.inputAvatarText}>{(user?.name ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          <TextInput
            testID="comment-input"
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            testID="send-comment-btn"
            onPress={sendComment}
            disabled={!inputText.trim() || sending}
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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

    postCard: { backgroundColor: colors.surface, marginBottom: 8 },
    postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    postAvatar: { width: 46, height: 46, borderRadius: 23 },
    postAvatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    postAvatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
    postAuthorName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
    postAuthorHeadline: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    postTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    postContent: { fontSize: 16, color: colors.textPrimary, lineHeight: 24, paddingHorizontal: 14, paddingBottom: 14 },
    postStats: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingBottom: 8, gap: 8,
    },
    postStatText: { fontSize: 12, color: colors.textSecondary },

    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 0 },
    actions: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 4 },
    actionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    },
    actionEmoji: { fontSize: 18 },
    actionLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
    pickerContainer: { position: 'absolute', bottom: 44, left: 0, zIndex: 99 },

    commentsDivider: { paddingHorizontal: 14, paddingVertical: 10 },
    commentsLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },

    comment: {
      flexDirection: 'row', alignItems: 'flex-start',
      paddingHorizontal: 14, paddingVertical: 8, gap: 10,
    },
    commentAvatar: { width: 36, height: 36, borderRadius: 18 },
    commentAvatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    commentAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    commentBubble: {
      flex: 1, backgroundColor: colors.background, borderRadius: 14,
      paddingHorizontal: 12, paddingVertical: 10,
    },
    commentAuthor: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
    commentContent: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
    commentTime: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

    editInput: {
      fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.primary,
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 6,
    },
    editActions: { flexDirection: 'row', gap: 8 },
    editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    editBtnPrimary: { backgroundColor: colors.primary },
    editBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    editBtnSecondary: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    editBtnSecondaryText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },

    noComments: {
      textAlign: 'center', color: colors.textMuted, fontSize: 14,
      marginTop: 24, fontStyle: 'italic',
    },
    loadMoreBtn: { alignItems: 'center', paddingVertical: 12 },
    loadMoreText: { fontSize: 13, color: colors.primary, fontWeight: '700' },

    inputRow: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    },
    inputAvatarCircle: {
      width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    inputAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    commentInput: {
      flex: 1, backgroundColor: colors.background, borderRadius: 20, borderWidth: 1,
      borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 8,
      fontSize: 14, color: colors.textPrimary, maxHeight: 100,
    },
    sendBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    sendBtnDisabled: { backgroundColor: colors.border },
  });
}
