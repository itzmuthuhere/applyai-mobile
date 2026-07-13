import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  Image, ScrollView, FlatList,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { RootState, AppDispatch } from '../../store';
import { prependPost, updatePost, FeedPost } from '../../store/slices/feedSlice';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import WebPageContainer from '../../components/common/WebPageContainer';

interface Attachment {
  url: string;
  type: 'IMAGE' | 'PDF' | 'DOC';
  name: string;
  size: number;
}

interface MentionSuggestion {
  id: number;
  name: string;
  headline?: string;
  profilePicture?: string;
}

interface RouteParams {
  editPost?: FeedPost;
}

function RichText({ content, colors }: { content: string; colors: AppColors }) {
  const parts = content.split(/(#\w+|@\w+)/g);
  return (
    <Text style={{ fontSize: 16, color: colors.textPrimary, lineHeight: 24 }}>
      {parts.map((part, i) => {
        if (part.startsWith('#') || part.startsWith('@')) {
          return <Text key={i} style={{ color: colors.primary, fontWeight: '700' }}>{part}</Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

export default function CreatePostScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);

  const editPost: FeedPost | undefined = route.params?.editPost;
  const isEditMode = !!editPost;

  const [content, setContent] = useState(editPost?.content ?? '');
  const [posting, setPosting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(editPost?.imageUrl ?? null);
  const [attachment, setAttachment] = useState<Attachment | null>(
    editPost?.attachmentUrl
      ? { url: editPost.attachmentUrl, type: (editPost.attachmentType ?? 'DOC') as 'IMAGE' | 'PDF' | 'DOC', name: editPost.attachmentName ?? 'attachment', size: 0 }
      : null
  );
  const [uploading, setUploading] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const mentionSearchRef = useRef<string | null>(null);

  const canPost = content.trim().length > 0 && content.length <= 2000 && !posting && !uploading;

  function onContentChange(text: string) {
    setContent(text);

    const match = text.match(/@(\w*)$/);
    if (match) {
      const query = match[1];
      mentionSearchRef.current = query;
      if (query.length >= 1) {
        fetchMentionSuggestions(query);
      } else {
        setMentionSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setMentionSuggestions([]);
      setShowSuggestions(false);
    }
  }

  async function fetchMentionSuggestions(q: string) {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.USER_SEARCH, { params: { q } });
      setMentionSuggestions(data.slice(0, 5));
      setShowSuggestions(data.length > 0);
    } catch {}
  }

  function insertMention(u: MentionSuggestion) {
    const nameNoSpace = u.name.replace(/\s+/g, '');
    const newContent = content.replace(/@(\w*)$/, `@${nameNoSpace} `);
    setContent(newContent);
    setMentionSuggestions([]);
    setShowSuggestions(false);
  }

  async function pickFromLibrary() {
    setImagePickerVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('File too large', 'Images must be under 5 MB.');
      return;
    }
    await uploadImage(asset.uri, asset.fileName ?? 'photo.jpg', asset.mimeType ?? 'image/jpeg');
  }

  async function pickFromCamera() {
    setImagePickerVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    await uploadImage(asset.uri, asset.fileName ?? 'photo.jpg', asset.mimeType ?? 'image/jpeg');
  }

  async function uploadImage(uri: string, name: string, mimeType: string) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri, name, type: mimeType } as any);
      const { data } = await apiClient.post(API_ENDPOINTS.FEED_MEDIA, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.url);
      setAttachment(null);
    } catch {
      Alert.alert('Upload failed', 'Could not upload the image. Please try again.');
    }
    setUploading(false);
  }

  async function pickDoc() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 10 * 1024 * 1024) {
      Alert.alert('File too large', 'Documents must be under 10 MB.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream' } as any);
      const { data } = await apiClient.post(API_ENDPOINTS.FEED_MEDIA, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachment({ url: data.url, type: data.type, name: data.name, size: data.size });
      setImageUrl(null);
    } catch {
      Alert.alert('Upload failed', 'Could not upload the file. Please try again.');
    }
    setUploading(false);
  }

  function removeMedia() {
    setImageUrl(null);
    setAttachment(null);
  }

  async function handlePost() {
    if (!canPost) return;
    setPosting(true);
    try {
      const body: any = { content: content.trim(), imageUrl };
      if (attachment) {
        body.attachmentUrl = attachment.url;
        body.attachmentType = attachment.type;
        body.attachmentName = attachment.name;
      }

      if (isEditMode && editPost) {
        const { data } = await apiClient.put(`${API_ENDPOINTS.FEED}/${editPost.id}`, body);
        dispatch(updatePost(data));
      } else {
        const { data } = await apiClient.post(API_ENDPOINTS.FEED, body);
        dispatch(prependPost(data));
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', isEditMode ? 'Failed to update post.' : 'Failed to post. Please try again.');
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
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Post' : 'Create Post'}</Text>
          <TouchableOpacity
            testID="post-submit-btn"
            onPress={handlePost}
            disabled={!canPost}
            style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postBtnText}>{isEditMode ? 'Save' : 'Post'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <WebPageContainer maxWidth={640} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
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
                {user?.headline ? <Text style={styles.authorHeadline}>{user.headline}</Text> : null}
              </View>
            </View>
            <TextInput
              testID="post-content-input"
              style={styles.input}
              placeholder="What's on your mind? Use #hashtags and @mentions..."
              placeholderTextColor={colors.textMuted}
              multiline
              autoFocus
              value={content}
              onChangeText={onContentChange}
              textAlignVertical="top"
            />
          </View>

          {/* Mention suggestions */}
          {showSuggestions && mentionSuggestions.length > 0 && (
            <View style={styles.suggestions}>
              {mentionSuggestions.map(s => (
                <TouchableOpacity key={s.id} style={styles.suggestionRow} onPress={() => insertMention(s)}>
                  <View style={styles.suggestionAvatar}>
                    <Text style={styles.suggestionAvatarText}>{s.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.suggestionName}>{s.name}</Text>
                    {s.headline ? <Text style={styles.suggestionHeadline} numberOfLines={1}>{s.headline}</Text> : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Image preview */}
          {imageUrl ? (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeMediaBtn} onPress={removeMedia}>
                <Ionicons name="close-circle" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Document attachment preview */}
          {attachment ? (
            <View style={styles.docPreview}>
              <Ionicons
                name={attachment.type === 'PDF' ? 'document-text-outline' : 'document-outline'}
                size={28} color={colors.primary}
              />
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{attachment.name}</Text>
                {attachment.size > 0 && (
                  <Text style={styles.docSize}>{(attachment.size / 1024).toFixed(0)} KB</Text>
                )}
              </View>
              <TouchableOpacity onPress={removeMedia} style={styles.removeDocBtn}>
                <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>

        {/* Footer toolbar */}
        <View style={styles.footer}>
          <Text testID="char-count" style={[styles.charCount, content.length > 2000 && { color: colors.error }]}>
            {content.length} / 2000
          </Text>
          <View style={styles.mediaButtons}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                {!attachment && (
                  <TouchableOpacity
                    testID="pick-image-btn"
                    onPress={() => setImagePickerVisible(true)}
                    style={styles.mediaBtn}
                    disabled={!!attachment}
                  >
                    <Ionicons name="image-outline" size={22} color={colors.primary} />
                  </TouchableOpacity>
                )}
                {!imageUrl && (
                  <TouchableOpacity
                    testID="pick-doc-btn"
                    onPress={pickDoc}
                    style={styles.mediaBtn}
                    disabled={!!imageUrl}
                  >
                    <Ionicons name="attach-outline" size={22} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
        </WebPageContainer>

        {/* Image source picker modal */}
        {imagePickerVisible && (
          <View testID="image-picker-modal" style={styles.pickerModal}>
            <View style={styles.pickerSheet}>
              <TouchableOpacity testID="pick-library-btn" style={styles.pickerOption} onPress={pickFromLibrary}>
                <Ionicons name="images-outline" size={22} color={colors.primary} />
                <Text style={styles.pickerOptionText}>Choose from Library</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="pick-camera-btn" style={styles.pickerOption} onPress={pickFromCamera}>
                <Ionicons name="camera-outline" size={22} color={colors.primary} />
                <Text style={styles.pickerOptionText}>Take a Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="pick-image-cancel-btn" style={[styles.pickerOption, { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={() => setImagePickerVisible(false)}>
                <Text style={[styles.pickerOptionText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
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
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  postBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  postBtnDisabled: { backgroundColor: colors.border },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  compose: { padding: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  authorName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  authorHeadline: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  input: {
    fontSize: 16, color: colors.textPrimary, lineHeight: 24, minHeight: 120,
  },

  suggestions: {
    borderTopWidth: 1, borderTopColor: colors.border,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  suggestionAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  suggestionName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  suggestionHeadline: { fontSize: 12, color: colors.textSecondary },

  mediaPreview: { marginHorizontal: 16, marginBottom: 12, position: 'relative' },
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  removeMediaBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14,
  },

  docPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.background, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  docSize: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  removeDocBtn: { padding: 4 },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  charCount: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  mediaButtons: { flexDirection: 'row', gap: 6 },
  mediaBtn: { padding: 6 },

  pickerModal: {
    position: 'absolute', bottom: 0, left: 0, right: 0, top: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32,
  },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  pickerOptionText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  });
}
