import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/api.types';

interface AuthState {
  jwt: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  jwt: null,
  user: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ jwt: string; user: User }>) {
      state.jwt = action.payload.jwt;
      state.user = action.payload.user;
      state.isLoading = false;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearAuth(state) {
      state.jwt = null;
      state.user = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { setAuth, setLoading, setError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
