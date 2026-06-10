import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../constants';

export interface BlacklistEntry {
  id: number;
  companyName: string;
  reason: string;
  notes?: string;
  createdAt: string;
}

interface BlacklistState {
  items: BlacklistEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: BlacklistState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchBlacklist = createAsyncThunk(
  'blacklist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.BLACKLIST);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to load blacklist');
    }
  }
);

export const addToBlacklist = createAsyncThunk(
  'blacklist/add',
  async (payload: { companyName: string; reason: string; notes?: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.BLACKLIST, payload);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to add to blacklist');
    }
  }
);

export const removeFromBlacklist = createAsyncThunk(
  'blacklist/remove',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiClient.delete(API_ENDPOINTS.BLACKLIST_BY_ID(id));
      return id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to remove from blacklist');
    }
  }
);

const blacklistSlice = createSlice({
  name: 'blacklist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlacklist.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBlacklist.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchBlacklist.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addToBlacklist.fulfilled, (state, action) => { state.items.push(action.payload); })
      .addCase(removeFromBlacklist.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      });
  },
});

export default blacklistSlice.reducer;
