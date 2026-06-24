import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../store';
import { prependPost } from '../../store/slices/feedSlice';
import { COLORS, API_ENDPOINTS } from '../../constants';
import apiClient from '../../api/apiClient';

export default function CreatePostScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const canPost = content.trim().length > 0 && !posting;

  async function handlePost() {
    if (!canPost) return;
    setPosting(true);
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.FEED, { content: content.trim() });
      dispatch(prependPost(data));
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            testID="post-submit-btn"
            onPress={handlePost}
            disabled={!canPost}
            style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Compose area */}
        <View style={styles.compose}>
          <View style={styles.authorRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user?.name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{user?.name ?? ''}</Text>
              {user?.headline ? (
                <Text style={styles.authorHeadline}>{user.headline}</Text>
              ) : null}
            </View>
          </View>
          <TextInput
            testID="post-content-input"
            style={styles.input}
            placeholder="What's on your mind? Share a career update, tip, or win..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            autoFocus
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />
        </View>

        {/* Character count */}
        <View style={styles.footer}>
          <Text style={[styles.charCount, content.length > 2000 && { color: COLORS.error }]}>
            {content.length} / 2000
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  postBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  postBtnDisabled: { backgroundColor: COLORS.border },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  compose: { flex: 1, padding: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  authorName: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  authorHeadline: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },

  input: {
    flex: 1, fontSize: 16, color: COLORS.textPrimary, lineHeight: 24,
  },

  footer: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  charCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
});
