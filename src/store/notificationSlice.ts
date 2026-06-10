import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../constants';

interface NotificationState {
  fcmToken: string | null;
  registered: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  fcmToken: null,
  registered: false,
  error: null,
};

export const registerFcmToken = createAsyncThunk(
  'notifications/register',
  async (token: string, { rejectWithValue }) => {
    try {
      await apiClient.post(API_ENDPOINTS.REGISTER_FCM_TOKEN, { token });
      return token;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.error ?? 'Failed to register push token');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setFcmToken: (state, action) => { state.fcmToken = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerFcmToken.fulfilled, (state, action) => {
        state.fcmToken = action.payload;
        state.registered = true;
      })
      .addCase(registerFcmToken.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setFcmToken } = notificationSlice.actions;
export default notificationSlice.reducer;
