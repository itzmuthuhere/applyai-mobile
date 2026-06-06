import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Resume } from '../../types/api.types';

interface ResumeState {
  list: Resume[];
  selected: Resume | null;
  isUploading: boolean;
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ResumeState = {
  list: [],
  selected: null,
  isUploading: false,
  isAnalyzing: false,
  isLoading: false,
  error: null,
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    setResumes(state, action: PayloadAction<Resume[]>) {
      state.list = action.payload;
      state.isLoading = false;
    },
    setSelectedResume(state, action: PayloadAction<Resume | null>) {
      state.selected = action.payload;
    },
    addResume(state, action: PayloadAction<Resume>) {
      state.list.unshift(action.payload);
      state.isUploading = false;
    },
    setUploading(state, action: PayloadAction<boolean>) {
      state.isUploading = action.payload;
    },
    setAnalyzing(state, action: PayloadAction<boolean>) {
      state.isAnalyzing = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
      state.isUploading = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setResumes,
  setSelectedResume,
  addResume,
  setUploading,
  setAnalyzing,
  setLoading,
  setError,
  clearError,
} = resumeSlice.actions;
export default resumeSlice.reducer;
