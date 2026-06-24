import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SocialNotif {
  id: number;
  type: 'FOLLOW' | 'POST_LIKE' | 'POST_COMMENT' | 'MENTION' | 'DM';
  actor?: { id: number; name: string; profilePicture?: string } | null;
  postId?: number | null;
  commentId?: number | null;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: SocialNotif[];
  unreadCount: number;
  page: number;
  hasMore: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  page: 0,
  hasMore: true,
};

const notificationSlice = createSlice({
  name: 'socialNotifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<SocialNotif[]>) {
      state.notifications = action.payload;
      state.page = 0;
      state.hasMore = action.payload.length >= 20;
    },
    appendNotifications(state, action: PayloadAction<SocialNotif[]>) {
      const existing = new Set(state.notifications.map(n => n.id));
      const fresh = action.payload.filter(n => !existing.has(n.id));
      state.notifications.push(...fresh);
      state.page += 1;
      state.hasMore = action.payload.length >= 20;
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
    markAllRead(state) {
      state.notifications.forEach(n => { n.read = true; });
      state.unreadCount = 0;
    },
    markOneRead(state, action: PayloadAction<number>) {
      const n = state.notifications.find(n => n.id === action.payload);
      if (n && !n.read) {
        n.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    incrementUnread(state) {
      state.unreadCount += 1;
    },
  },
});

export const {
  setNotifications, appendNotifications, setUnreadCount,
  markAllRead, markOneRead, incrementUnread,
} = notificationSlice.actions;
export default notificationSlice.reducer;
