import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Application } from '../../types/api.types';

interface ApplicationState {
  list: Application[];
  selected: Application | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ApplicationState = {
  list: [],
  selected: null,
  isLoading: false,
  error: null,
};

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    setApplications(state, action: PayloadAction<Application[]>) {
      state.list = action.payload;
      state.isLoading = false;
    },
    setSelectedApplication(state, action: PayloadAction<Application | null>) {
      state.selected = action.payload;
    },
    addApplication(state, action: PayloadAction<Application>) {
      state.list.unshift(action.payload);
    },
    updateApplication(state, action: PayloadAction<Application>) {
      const idx = state.list.findIndex((a) => a.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
      if (state.selected?.id === action.payload.id) {
        state.selected = action.payload;
      }
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
  setApplications,
  setSelectedApplication,
  addApplication,
  updateApplication,
  setLoading,
  setError,
  clearError,
} = applicationSlice.actions;
export default applicationSlice.reducer;
