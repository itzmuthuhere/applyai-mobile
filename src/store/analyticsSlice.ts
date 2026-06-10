import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../constants';

export interface AnalyticsOverview {
  totalApplications: number;
  pendingApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  applicationsByStatus: Record<string, number>;
  applicationsByMonth: { month: string; count: number }[];
  topAppliedRoles: string[];
  averageMatchScore: number;
}

export interface ResumePerformance {
  resumeId: number;
  fileName: string;
  totalApplications: number;
  interviewRate: number;
  averageMatchScore: number;
}

interface AnalyticsState {
  overview: AnalyticsOverview | null;
  resumePerformance: ResumePerformance[];
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  overview: null,
  resumePerformance: [],
  loading: false,
  error: null,
};

export const fetchAnalyticsOverview = createAsyncThunk(
  'analytics/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.ANALYTICS_OVERVIEW);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to load analytics');
    }
  }
);

export const fetchResumePerformance = createAsyncThunk(
  'analytics/fetchResumePerformance',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.ANALYTICS_RESUME);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to load resume performance');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsOverview.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAnalyticsOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchAnalyticsOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchResumePerformance.fulfilled, (state, action) => {
        state.resumePerformance = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
