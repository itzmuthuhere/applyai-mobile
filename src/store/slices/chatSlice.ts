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
  content: string;
  read: boolean;
  createdAt: string;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<number, ChatMsg[]>; // keyed by partnerId
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
      // Update conversation last message
      const conv = state.conversations.find(c => c.partnerId === partnerId);
      if (conv) {
        conv.lastMessage = message.content;
        conv.lastMessageAt = message.createdAt;
      }
    },
  },
});

export const { setConversations, setMessages, appendMessage } = chatSlice.actions;
export default chatSlice.reducer;
