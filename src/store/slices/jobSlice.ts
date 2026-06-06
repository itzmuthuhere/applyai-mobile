import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Job, MatchScore } from '../../types/api.types';

interface JobState {
  feed: Job[];
  selected: Job | null;
  currentPage: number;
  totalElements: number;
  matchScores: Record<string, MatchScore>;
  isLoading: boolean;
  error: string | null;
}

const initialState: JobState = {
  feed: [],
  selected: null,
  currentPage: 0,
  totalElements: 0,
  matchScores: {},
  isLoading: false,
  error: null,
};

const jobSlice = createSlice({
  name: 'job',
  initialState,
  reducers: {
    setJobs(
      state,
      action: PayloadAction<{ jobs: Job[]; totalElements: number; page: number }>
    ) {
      state.feed = action.payload.jobs;
      state.totalElements = action.payload.totalElements;
      state.currentPage = action.payload.page;
      state.isLoading = false;
    },
    appendJobs(
      state,
      action: PayloadAction<{ jobs: Job[]; totalElements: number; page: number }>
    ) {
      state.feed = [...state.feed, ...action.payload.jobs];
      state.totalElements = action.payload.totalElements;
      state.currentPage = action.payload.page;
      state.isLoading = false;
    },
    setSelectedJob(state, action: PayloadAction<Job | null>) {
      state.selected = action.payload;
    },
    setMatchScore(state, action: PayloadAction<MatchScore>) {
      const key = `${action.payload.resumeId}_${action.payload.jobId}`;
      state.matchScores[key] = action.payload;
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
  setJobs,
  appendJobs,
  setSelectedJob,
  setMatchScore,
  setLoading,
  setError,
  clearError,
} = jobSlice.actions;
export default jobSlice.reducer;
