import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import resumeReducer from './slices/resumeSlice';
import jobReducer from './slices/jobSlice';
import applicationReducer from './slices/applicationSlice';
import interviewReducer from './slices/interviewSlice';
import analyticsReducer from './analyticsSlice';
import intelligenceReducer from './intelligenceSlice';
import blacklistReducer from './blacklistSlice';
import notificationReducer from './notificationSlice';
import feedReducer from './slices/feedSlice';
import chatReducer from './slices/chatSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    resume: resumeReducer,
    job: jobReducer,
    application: applicationReducer,
    interview: interviewReducer,
    analytics: analyticsReducer,
    intelligence: intelligenceReducer,
    blacklist: blacklistReducer,
    notifications: notificationReducer,
    feed: feedReducer,
    chat: chatReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
