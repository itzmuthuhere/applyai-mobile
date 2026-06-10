import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../constants';

interface IntelligenceState {
  salaryResult: Record<string, any> | null;
  negotiationResult: Record<string, any> | null;
  interviewPrepResult: Record<string, any> | null;
  companyIntelResult: Record<string, any> | null;
  loading: boolean;
  error: string | null;
}

const initialState: IntelligenceState = {
  salaryResult: null,
  negotiationResult: null,
  interviewPrepResult: null,
  companyIntelResult: null,
  loading: false,
  error: null,
};

export const fetchSalaryIntel = createAsyncThunk(
  'intelligence/salary',
  async (payload: { role: string; location?: string; experienceYears?: number }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.SALARY_INTEL, payload);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to fetch salary data');
    }
  }
);

export const fetchNegotiationCoach = createAsyncThunk(
  'intelligence/negotiation',
  async (payload: { currentOffer: number; role: string; location?: string; experienceYears?: number; skills?: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.NEGOTIATION, payload);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to fetch negotiation advice');
    }
  }
);

export const fetchInterviewPrepPlan = createAsyncThunk(
  'intelligence/interviewPrep',
  async (payload: { applicationId: number; interviewDate?: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.INTERVIEW_PREP, payload);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to generate prep plan');
    }
  }
);

export const fetchCompanyIntel = createAsyncThunk(
  'intelligence/companyIntel',
  async (payload: { companyName: string; jobTitle?: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.COMPANY_INTEL, payload);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to fetch company intel');
    }
  }
);

const intelligenceSlice = createSlice({
  name: 'intelligence',
  initialState,
  reducers: {
    clearSalary: (state) => { state.salaryResult = null; },
    clearNegotiation: (state) => { state.negotiationResult = null; },
    clearInterviewPrep: (state) => { state.interviewPrepResult = null; },
    clearCompanyIntel: (state) => { state.companyIntelResult = null; },
  },
  extraReducers: (builder) => {
    const pending = (state: IntelligenceState) => { state.loading = true; state.error = null; };
    const rejected = (state: IntelligenceState, action: any) => {
      state.loading = false;
      state.error = action.payload as string;
    };
    builder
      .addCase(fetchSalaryIntel.pending, pending)
      .addCase(fetchSalaryIntel.fulfilled, (state, action) => { state.loading = false; state.salaryResult = action.payload; })
      .addCase(fetchSalaryIntel.rejected, rejected)
      .addCase(fetchNegotiationCoach.pending, pending)
      .addCase(fetchNegotiationCoach.fulfilled, (state, action) => { state.loading = false; state.negotiationResult = action.payload; })
      .addCase(fetchNegotiationCoach.rejected, rejected)
      .addCase(fetchInterviewPrepPlan.pending, pending)
      .addCase(fetchInterviewPrepPlan.fulfilled, (state, action) => { state.loading = false; state.interviewPrepResult = action.payload; })
      .addCase(fetchInterviewPrepPlan.rejected, rejected)
      .addCase(fetchCompanyIntel.pending, pending)
      .addCase(fetchCompanyIntel.fulfilled, (state, action) => { state.loading = false; state.companyIntelResult = action.payload; })
      .addCase(fetchCompanyIntel.rejected, rejected);
  },
});

export const { clearSalary, clearNegotiation, clearInterviewPrep, clearCompanyIntel } = intelligenceSlice.actions;
export default intelligenceSlice.reducer;
