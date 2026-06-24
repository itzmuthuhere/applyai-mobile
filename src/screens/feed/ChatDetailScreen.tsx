import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { RootState, AppDispatch } from '../../store';
import { setMessages, appendMessage, ChatMsg } from '../../store/slices/chatSlice';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import apiClient from '../../api/apiClient';
import { FeedStackParamList } from '../../navigation/types';

type RouteT = RouteProp<FeedStackParamList, 'ChatDetail'>;

export default function ChatDetailScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const dispatch = useDispatch<AppDispatch>();
  const { partnerId, partnerName, partnerPicture } = route.params;

  const user = useSelector((s: RootState) => s.auth.user);
  const messages = useSelector((s: RootState) => s.chat.messages[partnerId] ?? []);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(messages.length === 0);
  const flatRef = useRef<FlatList<ChatMsg>>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.CHAT_MESSAGES, {
        params: { with: partnerId, page: 0, size: 50 },
      });
      const items: ChatMsg[] = (data.content ?? []).reverse();
      dispatch(setMessages({ partnerId, messages: items }));
      // Mark as read
      await apiClient.post(API_ENDPOINTS.CHAT_READ, null, { params: { from: partnerId } });
    } catch {}
    setLoading(false);
  }, [partnerId, dispatch]);

  useEffect(() => {
    loadMessages();
    // Poll every 5 seconds for new messages
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    setInputText('');
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.CHAT_MESSAGES, {
        recipientId: partnerId,
        content: text,
      });
      dispatch(appendMessage({ partnerId, message: data }));
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setInputText(text);
    }
    setSending(false);
  }

  function renderMessage({ item, index }: { item: ChatMsg; index: number }) {
    const isMine = item.senderId === user?.id;
    const prev = messages[index - 1];
    const showTime = !prev || dayjs(item.createdAt).diff(dayjs(prev.createdAt), 'minute') > 5;

    return (
      <>
        {showTime && (
          <Text style={styles.timeLabel}>{dayjs(item.createdAt).format('h:mm A')}</Text>
        )}
        <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.content}</Text>
          </View>
        </View>
      </>
    );
  }

  const partnerInitial = partnerName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            testID="chat-input"
            style={styles.chatInput}
            placeholder={`Message ${partnerName}...`}
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            testID="chat-send-btn"
            onPress={sendMessage}
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
  bubbleText: { fontSize: 15, color: colors.textPrimary, lineHeight: 21 },
  bubbleTextMine: { color: '#fff' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: colors.textMuted },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
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
  });
}