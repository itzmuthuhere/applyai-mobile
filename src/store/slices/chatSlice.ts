import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Conversation {
  partnerId: number;
  partnerName: string;
  partnerHeadline?: string;
  partnerProfilePicture?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMsg {
  id: number;
  senderId: number;
  recipientId: number;
  content: string | null;
  deleted: boolean;
  read: boolean;
  createdAt: string;
  editedAt?: string;
  reactions?: Record<string, number[]>;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  attachmentSize?: number;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<number, ChatMsg[]>;
}

const initialState: ChatState = {
  conversations: [],
  messages: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload;
    },
    setMessages(state, action: PayloadAction<{ partnerId: number; messages: ChatMsg[] }>) {
      state.messages[action.payload.partnerId] = action.payload.messages;
    },
    appendMessage(state, action: PayloadAction<{ partnerId: number; message: ChatMsg }>) {
      const { partnerId, message } = action.payload;
      if (!state.messages[partnerId]) state.messages[partnerId] = [];
      if (!state.messages[partnerId].find(m => m.id === message.id)) {
        state.messages[partnerId].push(message);
      }
      const conv = state.conversations.find(c => c.partnerId === partnerId);
      if (conv) {
        conv.lastMessage = message.content ?? 'Message deleted';
        conv.lastMessageAt = message.createdAt;
      }
    },
    updateMessage(state, action: PayloadAction<{ partnerId: number; message: ChatMsg }>) {
      const { partnerId, message } = action.payload;
      const list = state.messages[partnerId];
      if (!list) return;
      const idx = list.findIndex(m => m.id === message.id);
      if (idx !== -1) list[idx] = message;
    },
    removeMessage(state, action: PayloadAction<{ partnerId: number; messageId: number }>) {
      const { partnerId, messageId } = action.payload;
      const list = state.messages[partnerId];
      if (!list) return;
      const idx = list.findIndex(m => m.id === messageId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], deleted: true, content: null };
      }
    },
  },
});

export const { setConversations, setMessages, appendMessage, updateMessage, removeMessage } = chatSlice.actions;
export default chatSlice.reducer;
