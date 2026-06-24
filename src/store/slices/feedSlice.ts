import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FeedPost {
  id: number;
  author: { id: number; name: string; headline?: string; profilePicture?: string };
  content: string;
  imageUrl?: string | null;
  hashtags?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  myReaction?: string | null;
}

interface FeedState {
  posts: FeedPost[];
  page: number;
  hasMore: boolean;
  loading: boolean;
}

const initialState: FeedState = {
  posts: [],
  page: 0,
  hasMore: true,
  loading: false,
};

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setPosts(state, action: PayloadAction<FeedPost[]>) {
      state.posts = action.payload;
      state.page = 0;
      state.hasMore = action.payload.length >= 20;
    },
    appendPosts(state, action: PayloadAction<FeedPost[]>) {
      const existing = new Set(state.posts.map(p => p.id));
      const fresh = action.payload.filter(p => !existing.has(p.id));
      state.posts.push(...fresh);
      state.page += 1;
      state.hasMore = action.payload.length >= 20;
    },
    prependPost(state, action: PayloadAction<FeedPost>) {
      state.posts.unshift(action.payload);
    },
    removePost(state, action: PayloadAction<number>) {
      state.posts = state.posts.filter(p => p.id !== action.payload);
    },
    setReaction(state, action: PayloadAction<{ postId: number; reaction: string | null; likesCount: number }>) {
      const post = state.posts.find(p => p.id === action.payload.postId);
      if (post) {
        post.myReaction = action.payload.reaction;
        post.likesCount = action.payload.likesCount;
      }
    },
    incrementComments(state, action: PayloadAction<number>) {
      const post = state.posts.find(p => p.id === action.payload);
      if (post) post.commentsCount += 1;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setPosts, appendPosts, prependPost, removePost, setReaction, incrementComments, setLoading } = feedSlice.actions;
export default feedSlice.reducer;
