import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InterviewSession } from '../../types/api.types';

interface InterviewState {
  currentSession: InterviewSession | null;
  history: InterviewSession[];
  isLoading: boolean;
  error: string | null;
}

const initialState: InterviewState = {
  currentSession: null,
  history: [],
  isLoading: false,
  error: null,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setCurrentSession(state, action: PayloadAction<InterviewSession>) {
      state.currentSession = action.payload;
      state.isLoading = false;
    },
    setHistory(state, action: PayloadAction<InterviewSession[]>) {
      state.history = action.payload;
    },
    clearCurrentSession(state) {
      state.currentSession = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setCurrentSession,
  setHistory,
  clearCurrentSession,
  setLoading,
  setError,
  clearError,
} = interviewSlice.actions;
export default interviewSlice.reducer;
