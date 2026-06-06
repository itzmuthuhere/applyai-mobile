import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import resumeReducer from './slices/resumeSlice';
import jobReducer from './slices/jobSlice';
import applicationReducer from './slices/applicationSlice';
import interviewReducer from './slices/interviewSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    resume: resumeReducer,
    job: jobReducer,
    application: applicationReducer,
    interview: interviewReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
