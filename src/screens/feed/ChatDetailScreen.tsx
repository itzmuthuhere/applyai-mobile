import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, Pressable, Linking, Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import dayjs from 'dayjs';
import { RootState, AppDispatch } from '../../store';
import { setMessages, appendMessage, updateMessage, ChatMsg } from '../../store/slices/chatSlice';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import { FeedStackParamList } from '../../navigation/types';

type RouteT = RouteProp<FeedStackParamList, 'ChatDetail'>;

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

interface PendingAttachment {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type?: string): string {
  switch (type) {
    case 'PDF':           return 'document-text-outline';
    case 'DOCUMENT':      return 'document-outline';
    case 'SPREADSHEET':   return 'grid-outline';
    case 'PRESENTATION':  return 'easel-outline';
    default:              return 'attach-outline';
  }
}

export default function ChatDetailScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const dispatch = useDispatch<AppDispatch>();
  const { partnerId, partnerName, partnerPicture } = route.params;

  const user = useSelector((s: RootState) => s.auth.user);
  const messages = useSelector((s: RootState) => s.chat?.messages?.[partnerId] ?? []);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(messages.length === 0);
  const [actionSheet, setActionSheet] = useState<ChatMsg | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [attachPickerVisible, setAttachPickerVisible] = useState(false);
  const flatRef = useRef<FlatList<ChatMsg>>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const loadMessages = useCallback(async () => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.CHAT_MESSAGES, {
        params: { with: partnerId, page: 0, size: 50 },
      });
      const items: ChatMsg[] = (data.content ?? []).reverse();
      dispatch(setMessages({ partnerId, messages: items }));
      await apiClient.post(API_ENDPOINTS.CHAT_READ, null, { params: { from: partnerId } });
    } catch {}
    setLoading(false);
  }, [partnerId, dispatch]);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  async function pickDocument() {
    setAttachPickerVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setPendingAttachment({
          uri: asset.uri,
          name: asset.name ?? 'file',
          mimeType: asset.mimeType ?? 'application/octet-stream',
          size: asset.size ?? 0,
        });
      }
    } catch {}
  }

  async function pickFromLibrary() {
    setAttachPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setPendingAttachment({
          uri: asset.uri,
          name: asset.fileName ?? 'photo.jpg',
          mimeType: asset.mimeType ?? 'image/jpeg',
          size: asset.fileSize ?? 0,
        });
      }
    } catch {}
  }

  async function pickFromCamera() {
    setAttachPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setPendingAttachment({
          uri: asset.uri,
          name: asset.fileName ?? 'photo.jpg',
          mimeType: asset.mimeType ?? 'image/jpeg',
          size: asset.fileSize ?? 0,
        });
      }
    } catch {}
  }

  async function sendMessage() {
    const text = inputText.trim();
    if ((!text && !pendingAttachment) || sending || uploading) return;
    setSending(true);
    const savedText = text;
    setInputText('');
    inputRef.current?.clear();

    let uploadedAttachment: { url: string; type: string; name: string; size: number } | null = null;

    if (pendingAttachment) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: pendingAttachment.uri,
        name: pendingAttachment.name,
        type: pendingAttachment.mimeType,
      } as any);
      try {
        const { data } = await apiClient.post(API_ENDPOINTS.CHAT_UPLOAD, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedAttachment = data;
        setPendingAttachment(null);
      } catch {
        setInputText(savedText);
        setSending(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const optimisticId = -Date.now();
    const optimisticMsg: ChatMsg = {
      id: optimisticId,
      senderId: user?.id ?? 0,
      recipientId: partnerId,
      content: savedText || null,
      createdAt: new Date().toISOString(),
      read: false,
      deleted: false,
      editedAt: null,
      reactions: {},
      attachmentUrl: uploadedAttachment?.url ?? null,
      attachmentType: uploadedAttachment?.type ?? null,
      attachmentName: uploadedAttachment?.name ?? null,
      attachmentSize: uploadedAttachment?.size ?? null,
    };
    dispatch(appendMessage({ partnerId, message: optimisticMsg }));
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const payload: Record<string, any> = { recipientId: partnerId };
      if (savedText) payload.content = savedText;
      if (uploadedAttachment) {
        payload.attachmentUrl  = uploadedAttachment.url;
        payload.attachmentType = uploadedAttachment.type;
        payload.attachmentName = uploadedAttachment.name;
        payload.attachmentSize = uploadedAttachment.size;
      }
      await apiClient.post(API_ENDPOINTS.CHAT_MESSAGES, payload);
      await loadMessages();
    } catch {
      dispatch(updateMessage({ partnerId, message: { ...optimisticMsg, deleted: true, content: null } }));
      setInputText(savedText);
      Alert.alert('Message not sent', 'Could not send your message. Please try again.');
    }
    setSending(false);
  }

  async function submitEdit() {
    const text = editText.trim();
    if (!text || editingId === null) return;
    try {
      const { data } = await apiClient.put(API_ENDPOINTS.CHAT_MESSAGE_BY_ID(editingId), { content: text });
      dispatch(updateMessage({ partnerId, message: data }));
    } catch {}
    setEditingId(null);
    setEditText('');
  }

  async function handleDelete(msg: ChatMsg) {
    setActionSheet(null);
    try {
      await apiClient.delete(API_ENDPOINTS.CHAT_MESSAGE_BY_ID(msg.id));
      dispatch(updateMessage({ partnerId, message: { ...msg, deleted: true, content: null } }));
    } catch {}
  }

  async function handleReact(msg: ChatMsg, emoji: string) {
    setActionSheet(null);
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.CHAT_REACT(msg.id), { emoji });
      dispatch(updateMessage({ partnerId, message: data }));
    } catch {}
  }

  function startEdit(msg: ChatMsg) {
    setActionSheet(null);
    setEditingId(msg.id);
    setEditText(msg.content ?? '');
  }

  function renderMessage({ item, index }: { item: ChatMsg; index: number }) {
    const isMine = item.senderId === user?.id;
    const prev = messages[index - 1];
    const showTime = !prev || dayjs(item.createdAt).diff(dayjs(prev.createdAt), 'minute') > 5;
    const myReactedEmojis = new Set(
      Object.entries(item.reactions ?? {})
        .filter(([, ids]) => user && ids.includes(user.id))
        .map(([emoji]) => emoji)
    );
    const reactionEntries = Object.entries(item.reactions ?? {}).filter(([, ids]) => ids.length > 0);
    const hasAttach = !item.deleted && !!item.attachmentUrl;
    const isImageOnly = hasAttach && !item.content && item.attachmentType === 'IMAGE';

    return (
      <>
        {showTime && (
          <Text style={styles.timeLabel}>{dayjs(item.createdAt).format('h:mm A')}</Text>
        )}
        <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
          <TouchableOpacity
            testID={item.deleted ? `msg-deleted-${item.id}` : `msg-bubble-${item.id}`}
            onLongPress={() => !item.deleted && setActionSheet(item)}
            activeOpacity={0.85}
            delayLongPress={300}
          >
            <View style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleTheirs,
              item.deleted && styles.bubbleDeleted,
              isImageOnly && styles.bubbleImageOnly,
            ]}>
              {item.deleted ? (
                <Text style={styles.deletedText}>Message deleted</Text>
              ) : (
                <>
                  {item.content ? (
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                      {item.content}
                    </Text>
                  ) : null}
                  {hasAttach && item.attachmentType === 'IMAGE' ? (
                    <TouchableOpacity
                      testID={`attachment-image-${item.id}`}
                      onPress={() => Linking.openURL(item.attachmentUrl!)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: item.attachmentUrl }}
                        style={[styles.attachmentImage, item.content ? styles.attachmentImageWithText : null]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : hasAttach ? (
                    <TouchableOpacity
                      testID={`attachment-file-${item.id}`}
                      style={[styles.fileCard, isMine ? styles.fileCardMine : styles.fileCardTheirs]}
                      onPress={() => Linking.openURL(item.attachmentUrl!)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={getFileIcon(item.attachmentType) as any}
                        size={24}
                        color={isMine ? '#fff' : colors.primary}
                      />
                      <View style={styles.fileCardInfo}>
                        <Text
                          style={[styles.fileName, isMine && styles.fileNameMine]}
                          numberOfLines={2}
                        >
                          {item.attachmentName ?? 'File'}
                        </Text>
                        {item.attachmentSize ? (
                          <Text style={[styles.fileSize, isMine && styles.fileSizeMine]}>
                            {formatSize(item.attachmentSize)}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons
                        name="open-outline"
                        size={14}
                        color={isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>
            {item.editedAt && !item.deleted && (
              <Text
                testID={`msg-edited-${item.id}`}
                style={[styles.editedLabel, isMine && styles.editedLabelMine]}
              >
                edited
              </Text>
            )}
            {reactionEntries.length > 0 && (
              <View style={[styles.reactionRow, isMine && styles.reactionRowMine]}>
                {reactionEntries.map(([emoji, ids]) => (
                  <TouchableOpacity
                    key={emoji}
                    testID={`reaction-pill-${item.id}-${emoji}`}
                    style={[styles.reactionPill, myReactedEmojis.has(emoji) && styles.reactionPillActive]}
                    onPress={() => handleReact(item, emoji)}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    <Text style={[styles.reactionCount, myReactedEmojis.has(emoji) && styles.reactionCountActive]}>
                      {ids.length}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const partnerInitial = partnerName.charAt(0).toUpperCase();
  const sendDisabled = editingId !== null
    ? !editText.trim()
    : (!inputText.trim() && !pendingAttachment) || sending || uploading;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerCenter}
            onPress={() => navigation.navigate('PublicProfile', { userId: partnerId, userName: partnerName })}
            activeOpacity={0.8}
          >
            {partnerPicture ? (
              <Image source={{ uri: partnerPicture }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
                <Text style={styles.headerAvatarText}>{partnerInitial}</Text>
              </View>
            )}
            <Text style={styles.headerName}>{partnerName}</Text>
          </TouchableOpacity>
          <View style={{ width: 34 }} />
        </View>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={40} color={colors.border} />
                <Text style={styles.emptyText}>Start the conversation!</Text>
              </View>
            }
          />
        )}

        {/* Edit context bar */}
        {editingId !== null && (
          <View style={styles.editBar}>
            <Ionicons name="pencil" size={14} color={colors.primary} />
            <Text style={styles.editBarLabel}>Editing message</Text>
            <TouchableOpacity onPress={() => { setEditingId(null); setEditText(''); }}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Pending attachment chip */}
        {pendingAttachment && (
          <View testID="pending-attachment-chip" style={styles.pendingChip}>
            <Ionicons name="attach" size={16} color={colors.primary} />
            <Text style={styles.pendingChipName} numberOfLines={1}>
              {pendingAttachment.name}
            </Text>
            <Text style={styles.pendingChipSize}>{formatSize(pendingAttachment.size)}</Text>
            <TouchableOpacity
              testID="pending-attachment-remove"
              onPress={() => setPendingAttachment(null)}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input row */}
        <View style={styles.inputRow}>
          {editingId === null && (
            <TouchableOpacity
              testID="attach-btn"
              style={styles.attachBtn}
              onPress={() => setAttachPickerVisible(true)}
              disabled={sending || uploading}
            >
              <Ionicons name="attach" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TextInput
            ref={inputRef}
            testID="chat-input"
            style={styles.chatInput}
            placeholder={editingId !== null ? 'Edit message...' : `Message ${partnerName}...`}
            placeholderTextColor={colors.textMuted}
            value={editingId !== null ? editText : inputText}
            onChangeText={editingId !== null ? setEditText : setInputText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            testID="chat-send-btn"
            onPress={editingId !== null ? submitEdit : sendMessage}
            disabled={sendDisabled}
            style={[styles.sendBtn, sendDisabled && styles.sendBtnDisabled]}
          >
            {uploading || sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name={editingId !== null ? 'checkmark' : 'send'} size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Action Sheet Modal */}
      <Modal
        testID="action-sheet-modal"
        visible={actionSheet !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActionSheet(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setActionSheet(null)}>
          <Pressable style={styles.actionSheet}>
            <View style={styles.emojiRow}>
              {EMOJI_OPTIONS.map(emoji => {
                const reactedIds = actionSheet?.reactions?.[emoji] ?? [];
                const iReacted = user ? reactedIds.includes(user.id) : false;
                return (
                  <TouchableOpacity
                    key={emoji}
                    testID={`react-emoji-${emoji}`}
                    style={[styles.emojiBtn, iReacted && styles.emojiBtnActive]}
                    onPress={() => actionSheet && handleReact(actionSheet, emoji)}
                  >
                    <Text style={styles.emojiBtnText}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {actionSheet?.senderId === user?.id && (
              <>
                <TouchableOpacity
                  testID="action-edit-btn"
                  style={styles.actionBtn}
                  onPress={() => actionSheet && startEdit(actionSheet)}
                >
                  <Ionicons name="pencil" size={18} color={colors.textPrimary} />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="action-delete-btn"
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                  onPress={() => actionSheet && handleDelete(actionSheet)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Attachment picker modal */}
      <Modal
        testID="attach-modal"
        visible={attachPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAttachPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setAttachPickerVisible(false)}>
          <Pressable style={styles.attachSheet}>
            <Text style={styles.attachSheetTitle}>Share a file</Text>

            <TouchableOpacity testID="pick-photos-btn" style={styles.attachOption} onPress={pickFromLibrary}>
              <View style={[styles.attachOptionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="image-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.attachOptionLabel}>Photo Library</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="pick-camera-btn" style={styles.attachOption} onPress={pickFromCamera}>
              <View style={[styles.attachOptionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="camera-outline" size={22} color="#059669" />
              </View>
              <Text style={styles.attachOptionLabel}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="pick-files-btn" style={styles.attachOption} onPress={pickDocument}>
              <View style={[styles.attachOptionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-outline" size={22} color="#D97706" />
              </View>
              <Text style={styles.attachOptionLabel}>Files (PDF, Word, Excel…)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="pick-cancel-btn"
              style={styles.attachCancelBtn}
              onPress={() => setAttachPickerVisible(false)}
            >
              <Text style={styles.attachCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAvatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  headerName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },

  msgList: { paddingHorizontal: 12, paddingVertical: 12, flexGrow: 1 },
  timeLabel: { textAlign: 'center', fontSize: 11, color: colors.textMuted, marginVertical: 8 },
  msgRow: { flexDirection: 'row', marginVertical: 3 },
  msgRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9,
  },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleDeleted: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  bubbleImageOnly: { padding: 3, overflow: 'hidden' },
  bubbleText: { fontSize: 15, color: colors.textPrimary, lineHeight: 21 },
  bubbleTextMine: { color: '#fff' },
  deletedText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },

  attachmentImage: { width: 200, height: 150, borderRadius: 14 },
  attachmentImageWithText: { marginTop: 8 },

  fileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 4, padding: 10, borderRadius: 12,
  },
  fileCardMine: { backgroundColor: 'rgba(255,255,255,0.15)' },
  fileCardTheirs: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  fileCardInfo: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  fileNameMine: { color: '#fff' },
  fileSize: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  fileSizeMine: { color: 'rgba(255,255,255,0.7)' },

  editedLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, paddingLeft: 4 },
  editedLabelMine: { textAlign: 'right', paddingLeft: 0, paddingRight: 4 },

  reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, paddingLeft: 4 },
  reactionRowMine: { justifyContent: 'flex-end', paddingLeft: 0, paddingRight: 4 },
  reactionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
  },
  reactionPillActive: { backgroundColor: '#DBEAFE', borderColor: colors.primary },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  reactionCountActive: { color: colors.primary },

  editBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
  },
  editBarLabel: { flex: 1, fontSize: 13, color: colors.primary, fontWeight: '600' },

  pendingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.primaryLight ?? '#DBEAFE',
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  pendingChipName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.primary },
  pendingChipSize: { fontSize: 12, color: colors.textSecondary },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: colors.textMuted },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  attachBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  chatInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: 22, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, color: colors.textPrimary, maxHeight: 120,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: colors.border },

  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 16, paddingBottom: 32, paddingHorizontal: 16,
  },
  emojiRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 8,
  },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background,
  },
  emojiBtnActive: { backgroundColor: '#DBEAFE', borderWidth: 2, borderColor: colors.primary },
  emojiBtnText: { fontSize: 22 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  actionBtnDanger: { borderBottomWidth: 0 },
  actionBtnText: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
  actionBtnTextDanger: { color: '#EF4444' },

  attachSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 20, paddingBottom: 36, paddingHorizontal: 20,
  },
  attachSheetTitle: {
    fontSize: 15, fontWeight: '700', color: colors.textPrimary,
    marginBottom: 16, textAlign: 'center',
  },
  attachOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  attachOptionIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  attachOptionLabel: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  attachCancelBtn: {
    marginTop: 16, paddingVertical: 14,
    alignItems: 'center', borderRadius: 12,
    backgroundColor: colors.background,
  },
  attachCancelText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  });
}
