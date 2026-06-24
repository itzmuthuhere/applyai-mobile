import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RootState, AppDispatch } from '../../store';
import { incrementComments } from '../../store/slices/feedSlice';
import { COLORS, API_ENDPOINTS } from '../../constants';
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

export default function PostDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const dispatch = useDispatch<AppDispatch>();
  const { postId } = route.params;
  const user = useSelector((s: RootState) => s.auth.user);
  const post = useSelector((s: RootState) => s.feed.posts.find(p => p.id === postId));

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.FEED_COMMENTS(postId), { params: { page: 0, size: 50 } });
      setComments(data.content ?? []);
    } catch {}
    setLoading(false);
  }, [postId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  async function sendComment() {
    if (!inputText.trim() || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.FEED_COMMENTS(postId), { content: text });
      setComments(prev => [...prev, data]);
      dispatch(incrementComments(postId));
    } catch {
      setInputText(text);
    }
    setSending(false);
  }

  function renderComment({ item }: { item: Comment }) {
    return (
      <View style={styles.comment}>
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
          <Text style={styles.commentContent}>{item.content}</Text>
          <Text style={styles.commentTime}>{dayjs(item.createdAt).fromNow()}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 34 }} />
        </View>

        <FlatList
          data={comments}
          keyExtractor={item => String(item.id)}
          renderItem={renderComment}
          ListHeaderComponent={
            post ? (
              <View style={styles.postCard}>
                <TouchableOpacity
                  style={styles.postAuthorRow}
                  onPress={() => navigation.navigate('PublicProfile', { userId: post.author.id, userName: post.author.name })}
                >
                  {post.author.profilePicture ? (
                    <Image source={{ uri: post.author.profilePicture }} style={styles.postAvatar} />
                  ) : (
                    <View style={[styles.postAvatar, styles.postAvatarFallback]}>
                      <Text style={styles.postAvatarText}>{post.author.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.postAuthorName}>{post.author.name}</Text>
                    {post.author.headline ? (
                      <Text style={styles.postAuthorHeadline}>{post.author.headline}</Text>
                    ) : null}
                    <Text style={styles.postTime}>{dayjs(post.createdAt).fromNow()}</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.postContent}>{post.content}</Text>
                <View style={styles.postStats}>
                  <Text style={styles.postStatText}>{post.likesCount} reactions</Text>
                  <Text style={styles.postStatText}>{comments.length} comments</Text>
                </View>
                <View style={styles.commentsDivider}>
                  <Text style={styles.commentsLabel}>Comments</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
            ) : (
              <Text style={styles.noComments}>No comments yet. Be the first!</Text>
            )
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Comment input */}
        <View style={styles.inputRow}>
          <View style={styles.inputAvatarCircle}>
            <Text style={styles.inputAvatarText}>{(user?.name ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          <TextInput
            testID="comment-input"
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={COLORS.textMuted}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },

  postCard: { backgroundColor: COLORS.surface, marginBottom: 8 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  postAvatar: { width: 46, height: 46, borderRadius: 23 },
  postAvatarFallback: { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  postAuthorName: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  postAuthorHeadline: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  postTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  postContent: { fontSize: 16, color: COLORS.textPrimary, lineHeight: 24, paddingHorizontal: 14, paddingBottom: 14 },
  postStats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10 },
  postStatText: { fontSize: 12, color: COLORS.textSecondary },
  commentsDivider: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 10 },
  commentsLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },

  comment: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, gap: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentAvatarFallback: { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  commentAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  commentBubble: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  commentAuthor: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  commentContent: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  commentTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  noComments: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginTop: 24, fontStyle: 'italic' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  inputAvatarCircle: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  inputAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  commentInput: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: COLORS.textPrimary, maxHeight: 100,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: COLORS.border },
});
